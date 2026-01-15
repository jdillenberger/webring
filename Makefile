.PHONY: install dev dev-backend dev-frontend build deploy setup setup-github clean hash-password help docker-build docker-up docker-down docker-logs

# Default target
help:
	@echo "Webring Management Commands"
	@echo ""
	@echo "Setup:"
	@echo "  make setup          - Initial setup (copy example.env to .env)"
	@echo "  make setup-github   - Initialize GitHub data repository"
	@echo "  make install        - Install all dependencies"
	@echo ""
	@echo "Development:"
	@echo "  make dev            - Run both backend and frontend in development mode"
	@echo "  make dev-backend    - Run only the backend server"
	@echo "  make dev-frontend   - Run only the frontend dev server"
	@echo ""
	@echo "Production:"
	@echo "  make build          - Build frontend for production"
	@echo "  make deploy         - Build and deploy (customize deploy target)"
	@echo ""
	@echo "Docker:"
	@echo "  make docker-build   - Build Docker images"
	@echo "  make docker-up      - Start containers (detached)"
	@echo "  make docker-down    - Stop and remove containers"
	@echo "  make docker-logs    - View container logs"
	@echo ""
	@echo "Utilities:"
	@echo "  make hash-password  - Generate bcrypt hash for admin password"
	@echo "  make clean          - Remove build artifacts and node_modules"
	@echo ""

# Initial setup - copy example.env to .env
setup:
	@if [ ! -f .env ]; then \
		cp example.env .env; \
		echo "Created .env from example.env"; \
		echo "Please edit .env with your configuration"; \
	else \
		echo ".env already exists"; \
	fi

# Initialize GitHub data repository with required files
setup-github:
	@echo "This will create initial files in your GitHub data repository."
	@echo "Make sure GITHUB_TOKEN, GITHUB_OWNER, and GITHUB_REPO are set in .env"
	@echo ""
	@if [ ! -f .env ]; then \
		echo "Error: .env file not found. Run 'make setup' first."; \
		exit 1; \
	fi
	@echo "Creating initial data files via API..."
	@cd backend && node -e " \
		import('dotenv/config').then(() => import('./services/github.js')).then(async (m) => { \
			const github = m.getGitHubService(); \
			console.log('Initializing participants.json...'); \
			await github.getParticipants(); \
			console.log('Initializing applications.json...'); \
			await github.getApplications(); \
			console.log('Done! GitHub repository initialized.'); \
		}).catch(e => { console.error('Error:', e.message); process.exit(1); }); \
	"

# Install all dependencies
install:
	@echo "Installing backend dependencies..."
	cd backend && npm install
	@echo ""
	@echo "Installing frontend dependencies..."
	cd frontend && npm install
	@echo ""
	@echo "Done! Run 'make setup' if you haven't configured .env yet."

# Run both servers in development mode
dev:
	@echo "Starting backend on :3000 and frontend on :5173..."
	@echo "Press Ctrl+C to stop both servers"
	@echo ""
	@trap 'kill 0' INT; \
	(cd backend && npm run dev) & \
	(cd frontend && npm run dev) & \
	wait

# Run only backend
dev-backend:
	cd backend && npm run dev

# Run only frontend
dev-frontend:
	cd frontend && npm run dev

# Build frontend for production
build:
	@echo "Building frontend..."
	cd frontend && npm run build
	@echo ""
	@echo "Frontend built to frontend/dist/"
	@echo "Configure your web server to serve this directory"

# Deploy (customize this for your hosting setup)
deploy: build
	@echo "Deploy target - customize this for your hosting setup"
	@echo ""
	@echo "Example deployment options:"
	@echo "  - Copy frontend/dist to your web server"
	@echo "  - Deploy backend to a Node.js host (Heroku, Railway, etc.)"
	@echo "  - Use Docker (add Dockerfile)"
	@echo ""
	@echo "Add your deployment commands to this Makefile target"

# Generate bcrypt hash for admin password
hash-password:
	@if [ -z "$(PASSWORD)" ]; then \
		echo "Usage: make hash-password PASSWORD=your-password"; \
		echo ""; \
		echo "Example:"; \
		echo "  make hash-password PASSWORD=mysecretpassword"; \
		echo ""; \
		echo "Copy the resulting hash to ADMIN_PASSWORD_HASH in your .env file"; \
	else \
		cd backend && npm exec -- node -e "import('bcrypt').then(b => b.default.hash('$(PASSWORD)', 10).then(console.log))"; \
	fi

# Clean build artifacts and dependencies
clean:
	@echo "Removing build artifacts..."
	rm -rf frontend/dist
	@echo "Removing node_modules..."
	rm -rf frontend/node_modules
	rm -rf backend/node_modules
	@echo "Done!"

# Docker commands
docker-build:
	docker compose build

docker-up:
	docker compose up -d

docker-down:
	docker compose down

docker-logs:
	docker compose logs -f
