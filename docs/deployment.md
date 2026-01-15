# Deployment Guide

This guide covers deploying the webring application to production.

## Architecture Overview

The webring consists of two parts:

1. **Backend (API)** - Node.js/Express server
2. **Frontend** - Static Vue.js application

These can be deployed together or separately depending on your hosting setup.

## Pre-Deployment Checklist

Before deploying, ensure you have:

- [ ] Created a GitHub repository for data storage (if not using local files)
- [ ] Generated a GitHub Personal Access Token
- [ ] Generated a strong admin password hash
- [ ] Generated a secure JWT secret
- [ ] Tested the application locally

## Building for Production

### Build the Frontend

```bash
make build
```

This creates optimized static files in `frontend/dist/`.

Before building, update `frontend/.env`:

```bash
VITE_API_URL=https://your-api-domain.com
VITE_SHOW_NAVIGATION=false  # or true, based on preference
```

### Prepare Backend

The backend runs directly from source. Ensure production `.env` is configured:

```bash
NODE_ENV=production
USE_LOCAL_DATA=false
GITHUB_TOKEN=ghp_xxxxx
GITHUB_OWNER=your-username
GITHUB_REPO=webring-data
ADMIN_USERNAME=your-admin
ADMIN_PASSWORD_HASH=$2b$10$xxxxx
ADMIN_JWT_SECRET=your-secure-secret
```

## Deployment Options

### Option 1: Single VPS/Server

Deploy both frontend and backend on one server.

#### Using nginx + Node.js

1. **Install dependencies:**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs nginx
   ```

2. **Clone and build:**
   ```bash
   git clone <repo-url> /var/www/webring
   cd /var/www/webring
   npm install --prefix backend
   npm install --prefix frontend
   npm run build --prefix frontend
   ```

3. **Create backend service** (`/etc/systemd/system/webring.service`):
   ```ini
   [Unit]
   Description=Webring API
   After=network.target

   [Service]
   Type=simple
   User=www-data
   WorkingDirectory=/var/www/webring/backend
   ExecStart=/usr/bin/node server.js
   Restart=on-failure
   Environment=NODE_ENV=production

   [Install]
   WantedBy=multi-user.target
   ```

4. **Configure nginx** (`/etc/nginx/sites-available/webring`):
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       # Frontend (static files)
       location / {
           root /var/www/webring/frontend/dist;
           try_files $uri $uri/ /index.html;
       }

       # Backend API
       location /api {
           proxy_pass http://127.0.0.1:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

5. **Enable and start:**
   ```bash
   sudo ln -s /etc/nginx/sites-available/webring /etc/nginx/sites-enabled/
   sudo systemctl enable webring
   sudo systemctl start webring
   sudo systemctl restart nginx
   ```

6. **Add SSL with Certbot:**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

### Option 2: Platform as a Service (PaaS)

#### Backend on Railway/Render/Heroku

1. **Create a `Procfile`** in `backend/`:
   ```
   web: node server.js
   ```

2. **Deploy to Railway:**
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli

   # Login and deploy
   cd backend
   railway login
   railway init
   railway up
   ```

3. **Set environment variables** in the Railway dashboard.

4. **Note the deployed URL** for frontend configuration.

#### Frontend on Vercel/Netlify

1. **Update `frontend/.env`** with backend URL:
   ```bash
   VITE_API_URL=https://your-backend.railway.app
   ```

2. **Deploy to Vercel:**
   ```bash
   # Install Vercel CLI
   npm install -g vercel

   # Deploy
   cd frontend
   vercel
   ```

3. **Or deploy to Netlify:**
   ```bash
   # Install Netlify CLI
   npm install -g netlify-cli

   # Build and deploy
   npm run build
   netlify deploy --prod --dir=dist
   ```

### Option 3: Docker

#### Dockerfile for Backend

Create `backend/Dockerfile`:

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
```

#### Dockerfile for Frontend

Create `frontend/Dockerfile`:

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
```

Create `frontend/nginx.conf`:

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

#### Docker Compose

Create `docker-compose.yml` in project root:

```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "3000:3000"
    env_file:
      - .env
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      args:
        VITE_API_URL: http://localhost:3000
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped
```

Run with:

```bash
docker-compose up -d
```

## Environment Variables in Production

### Required Variables

| Variable | Description |
|----------|-------------|
| `NODE_ENV` | Set to `production` |
| `ADMIN_USERNAME` | Admin login username |
| `ADMIN_PASSWORD_HASH` | Bcrypt hash of admin password |
| `ADMIN_JWT_SECRET` | Strong random string (32+ chars) |

### For GitHub Storage

| Variable | Description |
|----------|-------------|
| `USE_LOCAL_DATA` | Set to `false` |
| `GITHUB_TOKEN` | Personal Access Token |
| `GITHUB_OWNER` | GitHub username/org |
| `GITHUB_REPO` | Data repository name |

### For Frontend Build

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Full URL to backend API |
| `VITE_SHOW_NAVIGATION` | `true` or `false` |

## SSL/HTTPS

Always use HTTPS in production. Options:

1. **Certbot** (Let's Encrypt) - Free, automated
2. **Cloudflare** - Free SSL proxy
3. **Platform SSL** - Vercel, Netlify, Railway include SSL

## Monitoring

### Health Check Endpoint

Monitor the backend with:

```bash
curl https://your-api.com/api/health
```

Returns `{"status":"ok"}` if healthy.

### Logging

Backend logs to stdout. Configure your hosting to capture logs:

- **Railway/Render**: Automatic log capture
- **VPS**: Use `journalctl -u webring` with systemd
- **Docker**: `docker logs <container>`

## Updating

### Standard Update

```bash
git pull
npm install --prefix backend
npm install --prefix frontend
npm run build --prefix frontend
sudo systemctl restart webring  # if using systemd
```

### Docker Update

```bash
git pull
docker-compose build
docker-compose up -d
```

## Rollback

If an update causes issues:

1. **Git rollback:**
   ```bash
   git checkout <previous-commit>
   ```

2. **Rebuild and restart**

3. **Data is safe** - stored in GitHub or local files, not in the application

## Troubleshooting

### Frontend can't reach backend

- Check `VITE_API_URL` is correct
- Verify CORS is configured (backend allows frontend origin)
- Check firewall rules

### Backend won't start

- Check `.env` file exists and is readable
- Verify all required environment variables are set
- Check Node.js version (18+ required)

### GitHub API errors

- Verify token hasn't expired
- Check rate limits (5000 requests/hour)
- Ensure repository exists and token has access

### 502 Bad Gateway

- Backend process crashed - check logs
- Backend not running - start the service
- Wrong proxy configuration in nginx
