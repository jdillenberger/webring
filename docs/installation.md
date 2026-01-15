# Installation Guide

This guide covers how to install and set up the Webring application.

## Prerequisites

- **Node.js** 18.x or higher
- **npm** 9.x or higher
- **Git** (optional, for cloning)
- **GitHub account** (optional, for GitHub storage mode)

## Quick Install

```bash
# Clone the repository (or download and extract)
git clone <repository-url>
cd webring2

# Run setup to create .env file
make setup

# Install all dependencies
make install
```

## Step-by-Step Installation

### 1. Get the Code

Clone the repository or download and extract the source code:

```bash
git clone <repository-url>
cd webring2
```

### 2. Create Configuration File

Copy the example environment file:

```bash
make setup
```

This creates `.env` from `example.env`. Alternatively, do it manually:

```bash
cp example.env .env
```

### 3. Configure Environment

Edit `.env` with your settings. At minimum, set:

```bash
# For local development (no GitHub needed)
USE_LOCAL_DATA=true
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=<generated-hash>
ADMIN_JWT_SECRET=<random-string>
```

Generate a password hash:

```bash
make hash-password PASSWORD=your-secure-password
```

Copy the output to `ADMIN_PASSWORD_HASH` in `.env`.

Generate a JWT secret:

```bash
openssl rand -hex 32
```

Copy the output to `ADMIN_JWT_SECRET` in `.env`.

### 4. Install Dependencies

Install both backend and frontend dependencies:

```bash
make install
```

This runs `npm install` in both the `backend/` and `frontend/` directories.

### 5. Initialize Data Files

For local data mode, ensure the data files exist:

```bash
# participants.json should already exist with example data
# Create applications.json if it doesn't exist
echo '{"applications": []}' > data/applications.json
```

For GitHub storage mode, see [GitHub Storage Setup](github-storage.md).

### 6. Start the Application

Start both servers in development mode:

```bash
make dev
```

This starts:
- Backend API at http://localhost:3000
- Frontend at http://localhost:5173

## Verifying Installation

1. Open http://localhost:5173 in your browser
2. You should see the webring homepage with example members
3. Click "Apply Now" to test the application form
4. Go to http://localhost:5173/admin and log in with your admin credentials

## Directory Structure After Installation

```
webring2/
├── backend/
│   ├── node_modules/      # Backend dependencies
│   ├── middleware/        # Auth middleware
│   ├── routes/            # API routes
│   ├── services/          # GitHub service
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── node_modules/      # Frontend dependencies
│   ├── src/
│   │   ├── views/         # Page components
│   │   └── router/        # Vue Router
│   ├── .env               # Frontend environment
│   └── package.json
├── data/
│   ├── participants.json  # Member data
│   └── applications.json  # Application data
├── docs/                  # Documentation
├── .env                   # Main configuration
├── example.env            # Configuration template
├── Makefile               # Build automation
└── README.md
```

## Troubleshooting

### "Command not found: make"

On Windows, install Make via Chocolatey (`choco install make`) or use the npm commands directly:

```bash
cd backend && npm install
cd ../frontend && npm install
```

### "EADDRINUSE: address already in use"

Port 3000 is already in use. Either:
- Stop the other process using port 3000
- Change the port in `.env`: `PORT=3001`
- Update `frontend/.env` to match: `VITE_API_URL=http://localhost:3001`

### "Cannot find module" errors

Run `make install` again to ensure all dependencies are installed.

### Frontend shows "Failed to load participants"

The backend is not running. Start it with:

```bash
cd backend && npm run dev
```

Or use `make dev` to start both servers.

## Next Steps

- [Configuration Guide](configuration.md) - All configuration options
- [Development Guide](development.md) - Development workflow
- [GitHub Storage Setup](github-storage.md) - Configure GitHub as data store
