# Webring

A full-featured webring application with member applications, admin approval workflow, and flexible data storage.

## Features

- **Webring Navigation** - Prev/Next/Random navigation between member sites
- **Application System** - Website owners can apply to join
- **Admin Dashboard** - Review and approve/reject applications, manage members
- **Flexible Storage** - Use local JSON files or GitHub as a database
- **Embeddable Widget** - Generate embed code for member sites

## Quick Start

```bash
# Install dependencies
make install

# Create configuration
make setup

# Generate admin password hash
make hash-password PASSWORD=your-password
# Copy the output to ADMIN_PASSWORD_HASH in .env

# Start development servers
make dev
```

Visit:
- **Homepage:** http://localhost:5173
- **Apply:** http://localhost:5173/apply
- **Admin:** http://localhost:5173/admin

## Quick Deploy to Hetzner Cloud

Deploy your own webring in minutes. See the [Hetzner Deployment Guide](docs/hetzner-deployment.md) for step-by-step instructions.

```bash
# On your server:
git clone https://github.com/YOUR_USERNAME/webring.git /opt/webring
cd /opt/webring
./deploy.sh
```

## Documentation

| Document | Description |
|----------|-------------|
| [Hetzner Deployment](docs/hetzner-deployment.md) | Deploy to Hetzner Cloud (beginner-friendly) |
| [Installation Guide](docs/installation.md) | How to install and set up the application |
| [Configuration Guide](docs/configuration.md) | All environment variables and options |
| [API Reference](docs/api.md) | Complete API endpoint documentation |
| [Admin Guide](docs/admin-guide.md) | How to use the admin dashboard |
| [GitHub Storage Setup](docs/github-storage.md) | Configure GitHub as data store |
| [Deployment Guide](docs/deployment.md) | Deploy to production |
| [Development Guide](docs/development.md) | Development workflow and codebase structure |

## Project Structure

```
webring/
├── backend/                  # Express.js API server
│   ├── routes/               # API endpoints
│   ├── services/             # GitHub/local storage service
│   └── middleware/           # Authentication
├── frontend/                 # Vue 3 + Vite application
│   └── src/views/            # Page components
├── data/                     # Local JSON data storage
├── docs/                     # Documentation
├── deploy.sh                 # One-command deployment script
├── docker-compose.yml        # Development Docker setup
├── docker-compose.prod.yml   # Production Docker setup
├── Caddyfile.example         # Caddy reverse proxy template
├── .env                      # Configuration (create from example.env)
├── example.env               # Configuration template
└── Makefile                  # Build automation
```

## Data Storage Options

### Local Files (Default for Development)

```bash
# In .env
USE_LOCAL_DATA=true
```

Data stored in `data/participants.json` and `data/applications.json`.

### GitHub Repository (Recommended for Production)

```bash
# In .env
USE_LOCAL_DATA=false
GITHUB_TOKEN=ghp_xxxxx
GITHUB_OWNER=your-username
GITHUB_REPO=webring-data
```

See [GitHub Storage Setup](docs/github-storage.md) for details.

## Configuration

Key environment variables:

| Variable | Description |
|----------|-------------|
| `USE_LOCAL_DATA` | `true` for local files, `false` for GitHub |
| `ADMIN_USERNAME` | Admin login username |
| `ADMIN_PASSWORD_HASH` | Bcrypt hash of admin password |
| `ADMIN_JWT_SECRET` | Secret for JWT tokens |
| `VITE_API_URL` | Backend URL (frontend config) |

See [Configuration Guide](docs/configuration.md) for all options.

## Make Commands

| Command | Description |
|---------|-------------|
| `make install` | Install all dependencies |
| `make dev` | Run development servers |
| `make build` | Build frontend for production |
| `make setup` | Create .env from example.env |
| `make setup-github` | Initialize GitHub data repository |
| `make hash-password PASSWORD=xxx` | Generate password hash |
| `make clean` | Remove build artifacts |
| `make help` | Show all commands |

## How the Widget Works

Members add this widget to their sites:

```html
<div style="text-align:center;padding:12px;border:1px solid #ddd;border-radius:6px">
  <small>Member of the Webring</small>
  <nav style="margin-top:8px">
    <a href="https://your-api.com/api/prev">Prev</a> |
    <a href="https://your-api.com/api/random">Random</a> |
    <a href="https://your-api.com/api/next">Next</a>
  </nav>
</div>
```

When visitors click the links:
1. The API identifies the current site from the `Referer` header
2. The API redirects to the previous, random, or next site in the ring

## License

MIT
