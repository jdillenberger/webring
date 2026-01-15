# Configuration Guide

All configuration is managed through environment variables. There are two configuration files:

- **`.env`** (project root) - Backend configuration
- **`frontend/.env`** - Frontend configuration

## Backend Configuration (.env)

### Server Settings

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Port the backend API listens on |
| `NODE_ENV` | `development` | Environment mode (`development` or `production`) |

### Data Storage

| Variable | Default | Description |
|----------|---------|-------------|
| `USE_LOCAL_DATA` | `false` | Set to `true` to use local JSON files instead of GitHub |

When `USE_LOCAL_DATA=true`:
- Data is stored in `data/participants.json` and `data/applications.json`
- No GitHub configuration is needed
- Changes are written directly to local files

When `USE_LOCAL_DATA=false`:
- Data is stored in a GitHub repository
- Requires GitHub configuration (see below)
- Provides version history and backup

### GitHub Storage

Required when `USE_LOCAL_DATA=false`:

| Variable | Default | Description |
|----------|---------|-------------|
| `GITHUB_TOKEN` | - | Personal Access Token with `repo` scope |
| `GITHUB_OWNER` | - | GitHub username or organization name |
| `GITHUB_REPO` | - | Repository name for data storage |
| `GITHUB_BRANCH` | `main` | Branch to use for data files |

Example:
```bash
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GITHUB_OWNER=myusername
GITHUB_REPO=webring-data
GITHUB_BRANCH=main
```

See [GitHub Storage Setup](github-storage.md) for detailed instructions.

### Admin Authentication

| Variable | Default | Description |
|----------|---------|-------------|
| `ADMIN_USERNAME` | - | Username for admin login |
| `ADMIN_PASSWORD_HASH` | - | Bcrypt hash of admin password |
| `ADMIN_JWT_SECRET` | - | Secret key for signing JWT tokens |
| `ADMIN_JWT_EXPIRES` | `24h` | Token expiration time |

#### Generating Password Hash

```bash
make hash-password PASSWORD=your-password
```

Or using npm directly:
```bash
cd backend
npm exec -- node -e "import('bcrypt').then(b => b.default.hash('your-password', 10).then(console.log))"
```

#### Generating JWT Secret

```bash
openssl rand -hex 32
```

#### Token Expiration Format

The `ADMIN_JWT_EXPIRES` value uses the [ms](https://github.com/vercel/ms) format:
- `24h` - 24 hours
- `7d` - 7 days
- `1w` - 1 week
- `30m` - 30 minutes

## Frontend Configuration (frontend/.env)

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:3000` | Backend API URL |
| `VITE_SHOW_NAVIGATION` | `true` | Show/hide dropdown navigation section |

### API URL

The frontend needs to know where the backend API is running:

```bash
# Development (default)
VITE_API_URL=http://localhost:3000

# Production example
VITE_API_URL=https://api.mywebring.com
```

### Show/Hide Navigation

The dropdown navigation section on the homepage can be hidden:

```bash
# Show navigation (default)
VITE_SHOW_NAVIGATION=true

# Hide navigation
VITE_SHOW_NAVIGATION=false
```

## Complete Example Configuration

### Development (.env)

```bash
# Server
PORT=3000
NODE_ENV=development

# Storage - use local files for development
USE_LOCAL_DATA=true

# Admin
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=$2b$10$04e5HoM8iBCA91LQcub2hu4LWGiM7OJHqqWjn6yVfapvHJQxZ4wJ2
ADMIN_JWT_SECRET=dev-secret-change-in-production-abc123
ADMIN_JWT_EXPIRES=24h
```

### Development (frontend/.env)

```bash
VITE_API_URL=http://localhost:3000
VITE_SHOW_NAVIGATION=true
```

### Production (.env)

```bash
# Server
PORT=3000
NODE_ENV=production

# Storage - use GitHub for production
USE_LOCAL_DATA=false
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GITHUB_OWNER=myusername
GITHUB_REPO=webring-data
GITHUB_BRANCH=main

# Admin - use strong credentials in production!
ADMIN_USERNAME=webring-admin
ADMIN_PASSWORD_HASH=$2b$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ADMIN_JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
ADMIN_JWT_EXPIRES=12h
```

### Production (frontend/.env)

```bash
VITE_API_URL=https://api.mywebring.com
VITE_SHOW_NAVIGATION=false
```

## Environment Variable Precedence

1. Shell environment variables (highest priority)
2. `.env` file
3. Default values in code (lowest priority)

This means you can override `.env` values by setting shell environment variables:

```bash
PORT=4000 npm run dev
```

## Security Considerations

### Never Commit Secrets

The `.env` file is in `.gitignore` and should never be committed. It contains:
- GitHub tokens
- Admin password hashes
- JWT secrets

### Use Strong Secrets in Production

- Generate `ADMIN_JWT_SECRET` with `openssl rand -hex 32`
- Use a strong admin password (12+ characters, mixed case, numbers, symbols)
- Use a dedicated GitHub token with minimal permissions

### Rotate Secrets Regularly

- Regenerate `ADMIN_JWT_SECRET` periodically
- Rotate GitHub tokens
- Change admin password if compromised

## Troubleshooting

### Changes not taking effect

Environment variables are read at startup. Restart the server after changing `.env`:

```bash
# Stop servers (Ctrl+C) then restart
make dev
```

### Frontend not connecting to backend

1. Check `VITE_API_URL` in `frontend/.env` matches where backend is running
2. Restart the frontend dev server after changes (Vite caches env vars)
3. Check for CORS errors in browser console

### "Admin credentials not configured"

Ensure both `ADMIN_USERNAME` and `ADMIN_PASSWORD_HASH` are set in `.env`.

### GitHub API errors

1. Verify `GITHUB_TOKEN` is valid and not expired
2. Check token has `repo` scope (or `public_repo` for public repos)
3. Verify `GITHUB_OWNER` and `GITHUB_REPO` are correct
4. Ensure the repository exists
