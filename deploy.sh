#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Webring Deployment Script ===${NC}\n"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Please run as root (use sudo)${NC}"
  exit 1
fi

# Get domain from user
if [ -z "$1" ]; then
  read -p "Enter your domain (e.g., webring.example.com): " DOMAIN
else
  DOMAIN=$1
fi

if [ -z "$DOMAIN" ]; then
  echo -e "${RED}Domain is required${NC}"
  exit 1
fi

echo -e "\n${YELLOW}Domain: ${DOMAIN}${NC}\n"

# Get admin password
read -s -p "Enter admin password for the dashboard: " ADMIN_PASSWORD
echo ""

if [ -z "$ADMIN_PASSWORD" ]; then
  echo -e "${RED}Admin password is required${NC}"
  exit 1
fi

echo -e "\n${GREEN}Step 1: Installing Docker...${NC}"
if ! command -v docker &> /dev/null; then
  apt-get update
  apt-get install -y docker.io docker-compose
  systemctl enable docker
  systemctl start docker
  echo -e "${GREEN}Docker installed successfully${NC}"
else
  echo -e "${YELLOW}Docker already installed${NC}"
fi

echo -e "\n${GREEN}Step 2: Setting up application directory...${NC}"
APP_DIR="/opt/webring"
mkdir -p $APP_DIR
cd $APP_DIR

# Copy files if running from repo directory
if [ -f "./docker-compose.prod.yml" ]; then
  echo "Copying files from current directory..."
  cp -r . $APP_DIR/
fi

echo -e "\n${GREEN}Step 3: Creating Caddyfile...${NC}"
cat > Caddyfile << EOF
${DOMAIN} {
    handle /api/* {
        reverse_proxy backend:3000
    }

    handle {
        reverse_proxy frontend:80
    }
}
EOF
echo -e "${GREEN}Caddyfile created${NC}"

echo -e "\n${GREEN}Step 4: Generating secure secrets...${NC}"
JWT_SECRET=$(openssl rand -hex 32)

# Generate password hash using Node.js in a container
echo -e "Generating password hash..."
PASSWORD_HASH=$(docker run --rm node:22-alpine sh -c "
  npm install bcrypt --silent 2>/dev/null &&
  node -e \"const bcrypt = require('bcrypt'); bcrypt.hash('${ADMIN_PASSWORD}', 10).then(h => console.log(h));\"
" 2>/dev/null)

if [ -z "$PASSWORD_HASH" ]; then
  echo -e "${RED}Failed to generate password hash${NC}"
  exit 1
fi

echo -e "\n${GREEN}Step 5: Creating .env file...${NC}"
cat > .env << EOF
# Webring Production Configuration
NODE_ENV=production
PORT=3000

# Your domain
VITE_API_URL=https://${DOMAIN}

# Admin credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=${PASSWORD_HASH}
ADMIN_JWT_SECRET=${JWT_SECRET}
ADMIN_JWT_EXPIRES=24h

# Data storage (local JSON files)
USE_LOCAL_DATA=true

# GitHub settings (optional - only needed if USE_LOCAL_DATA=false)
GITHUB_TOKEN=
GITHUB_OWNER=
GITHUB_REPO=
GITHUB_BRANCH=main
EOF
echo -e "${GREEN}.env file created${NC}"

echo -e "\n${GREEN}Step 6: Initializing data directory...${NC}"
mkdir -p data
if [ ! -f data/participants.json ]; then
  echo '{"participants":[]}' > data/participants.json
fi
if [ ! -f data/applications.json ]; then
  echo '{"applications":[]}' > data/applications.json
fi

echo -e "\n${GREEN}Step 7: Running init container to set permissions...${NC}"
docker-compose -f docker-compose.prod.yml run --rm init-data

echo -e "\n${GREEN}Step 8: Building and starting services...${NC}"
docker-compose -f docker-compose.prod.yml up -d --build backend frontend caddy

echo -e "\n${GREEN}=== Deployment Complete! ===${NC}"
echo -e "\nYour webring is now available at:"
echo -e "  ${GREEN}https://${DOMAIN}${NC}"
echo -e "\nAdmin dashboard:"
echo -e "  ${GREEN}https://${DOMAIN}/admin${NC}"
echo -e "  Username: admin"
echo -e "  Password: (the password you entered)"
echo -e "\n${YELLOW}Note: It may take a minute for the SSL certificate to be issued.${NC}"
echo -e "\nUseful commands:"
echo -e "  View logs:     cd $APP_DIR && docker-compose -f docker-compose.prod.yml logs -f"
echo -e "  Restart:       cd $APP_DIR && docker-compose -f docker-compose.prod.yml restart"
echo -e "  Stop:          cd $APP_DIR && docker-compose -f docker-compose.prod.yml down"
