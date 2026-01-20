# Deploying Webring on Hetzner Cloud

This guide walks you through deploying the webring application on a Hetzner Cloud server from scratch. No prior server experience required.

## What You'll Need

- A Hetzner Cloud account ([sign up here](https://console.hetzner.cloud/))
- A domain name pointed to your server's IP address
- About 30 minutes of time

## Cost

A Hetzner CX22 server costs approximately **€4.35/month** and is more than enough for this application.

---

## Part 1: Create an SSH Key (on your computer)

SSH keys let you securely connect to your server without typing a password each time.

### On Mac/Linux

Open Terminal and run:

```bash
ssh-keygen -t ed25519 -C "your-email@example.com"
```

Press Enter to accept the default location, then enter a passphrase (or press Enter for none).

View your public key:

```bash
cat ~/.ssh/id_ed25519.pub
```

Copy the entire output (starts with `ssh-ed25519`).

### On Windows

1. Open PowerShell
2. Run the same commands as above, or use [PuTTYgen](https://www.puttygen.com/) to generate a key

---

## Part 2: Create a Hetzner Server

1. Log in to [Hetzner Cloud Console](https://console.hetzner.cloud/)

2. Click **"Create a Project"** (or use an existing one)

3. Click **"Add Server"**

4. Configure your server:
   - **Location**: Choose one close to your users (e.g., Nuremberg, Helsinki)
   - **Image**: Ubuntu 24.04
   - **Type**: CX22 (2 vCPU, 4 GB RAM) - plenty for this app
   - **Networking**: Leave defaults (Public IPv4 enabled)
   - **SSH Keys**: Click "Add SSH Key" and paste your public key from Part 1
   - **Name**: Give it a name like `webring-server`

5. Click **"Create & Buy Now"**

6. Wait about 30 seconds for the server to start

7. **Copy the IP address** shown (e.g., `46.62.255.24`)

---

## Part 3: Point Your Domain to the Server

Go to your domain registrar (where you bought your domain) and add a DNS record:

| Type | Name | Value |
|------|------|-------|
| A | webring (or @ for root domain) | YOUR_SERVER_IP |

Example: If your domain is `example.com` and you want `webring.example.com`:
- Type: A
- Name: webring
- Value: 46.62.255.24

**Note**: DNS changes can take up to 24 hours to propagate, but usually work within minutes.

---

## Part 4: Connect to Your Server

Open Terminal (Mac/Linux) or PowerShell (Windows):

```bash
ssh root@YOUR_SERVER_IP
```

Replace `YOUR_SERVER_IP` with your server's IP address.

If asked "Are you sure you want to continue connecting?", type `yes`.

You should now see a command prompt like `root@webring-server:~#`

---

## Part 5: Deploy the Application

### Option A: One-Command Deploy (Easiest)

Run this single command on your server:

```bash
apt-get update && apt-get install -y git && \
git clone --branch development --single-branch https://github.com/jdillenberger/webring.git /opt/webring
 && \
cd /opt/webring && \
./deploy.sh
```

Replace `YOUR_USERNAME` with the GitHub username where the repo is hosted.

The script will ask you for:
1. Your domain (e.g., `webring.example.com`)
2. An admin password for the dashboard

Then it automatically:
- Installs Docker
- Sets up SSL certificates (HTTPS)
- Configures everything
- Starts the application

### Option B: Manual Deploy

If you prefer to do it step by step:

```bash
# 1. Update system and install Docker
apt-get update
apt-get install -y docker.io docker-compose git

# 2. Clone the repository
git clone https://github.com/YOUR_USERNAME/webring.git /opt/webring
cd /opt/webring

# 3. Create the Caddyfile (replace with your domain)
cat > Caddyfile << 'EOF'
webring.example.com {
    handle /api/* {
        reverse_proxy backend:3000
    }
    handle {
        reverse_proxy frontend:80
    }
}
EOF

# 4. Generate a password hash for admin
# (save this output for the next step)
docker run --rm node:22-alpine sh -c "
  npm install bcrypt --silent 2>/dev/null &&
  node -e \"const bcrypt = require('bcrypt'); bcrypt.hash('YOUR_PASSWORD', 10).then(h => console.log(h));\"
"

# 5. Create .env file
cat > .env << 'EOF'
NODE_ENV=production
VITE_API_URL=https://webring.example.com
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=PASTE_HASH_FROM_STEP_4
ADMIN_JWT_SECRET=GENERATE_WITH_openssl_rand_-hex_32
ADMIN_JWT_EXPIRES=24h
USE_LOCAL_DATA=true
EOF

# 6. Initialize data directory
mkdir -p data
echo '{"participants":[]}' > data/participants.json
echo '{"applications":[]}' > data/applications.json

# 7. Set up permissions and start
docker-compose -f docker-compose.prod.yml run --rm init-data
docker-compose -f docker-compose.prod.yml up -d --build backend frontend caddy
```

---

## Part 6: Verify It's Working

1. Wait 1-2 minutes for SSL certificate generation

2. Open your browser and go to: `https://your-domain.com`

3. You should see the webring homepage

4. Go to `https://your-domain.com/admin` and log in with:
   - Username: `admin`
   - Password: (the password you set)

---

## Useful Commands

Run these from your server (SSH in first):

```bash
cd /opt/webring

# View live logs
docker-compose -f docker-compose.prod.yml logs -f

# View logs for specific service
docker-compose -f docker-compose.prod.yml logs backend
docker-compose -f docker-compose.prod.yml logs frontend
docker-compose -f docker-compose.prod.yml logs caddy

# Restart all services
docker-compose -f docker-compose.prod.yml restart

# Stop everything
docker-compose -f docker-compose.prod.yml down

# Start everything
docker-compose -f docker-compose.prod.yml up -d

# Update to latest version
git pull
docker-compose -f docker-compose.prod.yml up -d --build
```

---

## Troubleshooting

### "Connection refused" when visiting the site

- Wait a few minutes for services to start
- Check if containers are running: `docker-compose -f docker-compose.prod.yml ps`
- Check logs: `docker-compose -f docker-compose.prod.yml logs`

### SSL certificate error

- Make sure your domain DNS is pointing to your server IP
- Check Caddy logs: `docker-compose -f docker-compose.prod.yml logs caddy`
- Ensure ports 80 and 443 are not blocked by firewall

### "Permission denied" errors

- Run the init container: `docker-compose -f docker-compose.prod.yml run --rm init-data`
- Restart: `docker-compose -f docker-compose.prod.yml restart backend`

### Can't connect via SSH

- Verify your SSH key was added correctly in Hetzner
- Try: `ssh -v root@YOUR_IP` to see detailed connection info
- Check if your IP is blocked (too many failed attempts)

### Admin login not working

- Verify the password hash in `.env` was generated correctly
- The hash should start with `$2b$10$`
- Regenerate with the docker command in Option B, step 4

---

## Security Recommendations

1. **Set up a firewall**:
   ```bash
   ufw allow 22    # SSH
   ufw allow 80    # HTTP (for SSL redirect)
   ufw allow 443   # HTTPS
   ufw enable
   ```

2. **Create a non-root user** (optional but recommended):
   ```bash
   adduser deploy
   usermod -aG docker deploy
   ```

3. **Enable automatic security updates**:
   ```bash
   apt-get install -y unattended-upgrades
   dpkg-reconfigure -plow unattended-upgrades
   ```

---

## Backup Your Data

The webring data is stored in a Docker volume. To backup:

```bash
# Create backup
docker run --rm -v webring_webring_data:/data -v $(pwd):/backup alpine tar czf /backup/webring-backup.tar.gz -C /data .

# Restore backup
docker run --rm -v webring_webring_data:/data -v $(pwd):/backup alpine tar xzf /backup/webring-backup.tar.gz -C /data
```

---

## Updating the Application

```bash
cd /opt/webring
git pull
docker-compose -f docker-compose.prod.yml up -d --build
```

---

## Deleting Everything

If you want to completely remove the application:

```bash
cd /opt/webring
docker-compose -f docker-compose.prod.yml down -v  # -v removes volumes (data)
cd /
rm -rf /opt/webring
```

To delete the Hetzner server, go to Cloud Console → Your Server → Delete.
