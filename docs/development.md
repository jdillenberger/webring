# Development Guide

This guide covers the development workflow and codebase structure.

## Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher
- Git
- A code editor (VS Code recommended)

## Getting Started

### 1. Clone and Install

```bash
git clone <repository-url>
cd webring2
make install
```

### 2. Configure for Development

```bash
make setup
```

Edit `.env` for local development:

```bash
USE_LOCAL_DATA=true
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=<generate with: make hash-password PASSWORD=admin>
ADMIN_JWT_SECRET=dev-secret-for-local-only
```

### 3. Start Development Servers

```bash
make dev
```

This starts:
- Backend at http://localhost:3000 (with hot reload)
- Frontend at http://localhost:5173 (with HMR)

## Project Structure

```
webring2/
├── backend/                 # Express.js API server
│   ├── server.js            # Entry point, Express setup
│   ├── routes/
│   │   ├── participants.js  # Public navigation endpoints
│   │   ├── applications.js  # Application submission
│   │   └── admin.js         # Protected admin endpoints
│   ├── services/
│   │   └── github.js        # Data storage abstraction
│   ├── middleware/
│   │   └── auth.js          # JWT authentication
│   └── package.json
├── frontend/                # Vue 3 + Vite application
│   ├── src/
│   │   ├── main.js          # Vue app initialization
│   │   ├── App.vue          # Root component (router outlet)
│   │   ├── router/
│   │   │   └── index.js     # Route definitions
│   │   ├── views/
│   │   │   ├── Home.vue     # Homepage
│   │   │   ├── Apply.vue    # Application form
│   │   │   └── Admin.vue    # Admin dashboard
│   │   └── style.css        # Global styles
│   ├── .env                 # Frontend environment
│   ├── vite.config.js       # Vite configuration
│   └── package.json
├── data/                    # Local data storage
│   ├── participants.json    # Webring members
│   └── applications.json    # Pending applications
├── docs/                    # Documentation
├── .env                     # Backend environment
├── example.env              # Environment template
├── Makefile                 # Build automation
└── README.md
```

## Backend Development

### Technology Stack

- **Express.js** - Web framework
- **@octokit/rest** - GitHub API client
- **jsonwebtoken** - JWT handling
- **bcrypt** - Password hashing
- **dotenv** - Environment configuration
- **uuid** - UUID generation

### Architecture

```
Request → Express Router → Route Handler → GitHub Service → Response
                              ↓
                         Auth Middleware (for admin routes)
```

### Key Files

#### `server.js`

Entry point that:
- Loads environment variables
- Configures Express middleware (CORS, JSON parsing)
- Mounts route handlers
- Starts the HTTP server

#### `services/github.js`

Data storage abstraction that:
- Reads/writes to GitHub API or local files
- Implements caching (60-second TTL)
- Provides methods for CRUD operations on participants and applications

Key methods:
```javascript
getParticipants()           // Get all members
saveParticipants(data)      // Save members
getApplications()           // Get all applications
saveApplications(data)      // Save applications
addParticipant(participant) // Add new member
removeParticipant(slug)     // Remove member
addApplication(application) // Add new application
updateApplicationStatus(id, status) // Update application
```

#### `middleware/auth.js`

Authentication middleware that:
- Verifies JWT tokens
- Attaches decoded user to request
- Returns 401 for invalid/expired tokens

### Adding a New Endpoint

1. Choose the appropriate route file (or create a new one)
2. Add the route handler:

```javascript
// routes/example.js
import { Router } from 'express';
import { getGitHubService } from '../services/github.js';

const router = Router();

router.get('/example', async (req, res) => {
  try {
    const github = getGitHubService();
    const data = await github.getParticipants();
    res.json(data);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

export default router;
```

3. Mount in `server.js`:

```javascript
import exampleRouter from './routes/example.js';
app.use('/api/example', exampleRouter);
```

### Testing the API

Use curl or a tool like Postman:

```bash
# Get participants
curl http://localhost:3000/api/participants

# Submit application
curl -X POST http://localhost:3000/api/applications \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","url":"https://test.com","description":"Test site","contactEmail":"test@test.com"}'

# Admin login
curl -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}'

# Admin request (with token)
curl http://localhost:3000/api/admin/applications \
  -H "Authorization: Bearer <token>"
```

## Frontend Development

### Technology Stack

- **Vue 3** - UI framework (Composition API)
- **Vue Router** - Client-side routing
- **Vite** - Build tool and dev server

### Architecture

```
App.vue (router-view)
    ├── Home.vue      → /
    ├── Apply.vue     → /apply
    └── Admin.vue     → /admin
```

### Key Files

#### `router/index.js`

Defines application routes:

```javascript
const routes = [
  { path: '/', name: 'Home', component: Home },
  { path: '/apply', name: 'Apply', component: Apply },
  { path: '/admin', name: 'Admin', component: Admin }
]
```

#### `views/Home.vue`

Homepage with:
- Call to action section
- Embed code generator
- Member list
- Optional navigation dropdown

#### `views/Apply.vue`

Application form with:
- Form validation
- API submission
- Success/error feedback

#### `views/Admin.vue`

Admin dashboard with:
- Login form
- Applications management (approve/reject)
- Members management (remove)
- Tab navigation

### Adding a New Page

1. Create the component in `views/`:

```vue
<!-- views/NewPage.vue -->
<script setup>
import { ref } from 'vue'

const data = ref(null)
</script>

<template>
  <div class="container">
    <h1>New Page</h1>
  </div>
</template>

<style scoped>
.container {
  max-width: 560px;
  margin: 0 auto;
  padding: 3rem 1.5rem;
}
</style>
```

2. Add route in `router/index.js`:

```javascript
import NewPage from '../views/NewPage.vue'

const routes = [
  // ... existing routes
  { path: '/new-page', name: 'NewPage', component: NewPage }
]
```

### Styling

Global styles are in `style.css`. CSS custom properties (variables) are used for theming:

```css
:root {
  --color-primary: #3b82f6;
  --color-primary-hover: #2563eb;
  --color-secondary: #6b7280;
  --color-text: #1f2937;
  --color-text-muted: #6b7280;
  --color-border: #e5e7eb;
  --color-surface: #f9fafb;
  --color-bg: #ffffff;
  --color-error: #dc2626;
}
```

Components use scoped styles to avoid conflicts.

## Data Storage

### Local Mode (`USE_LOCAL_DATA=true`)

Data is stored in JSON files:
- `data/participants.json` - Member list
- `data/applications.json` - Applications

Files are read/written synchronously for simplicity.

### GitHub Mode (`USE_LOCAL_DATA=false`)

Data is stored in a GitHub repository:
- Uses GitHub REST API via Octokit
- Implements caching to reduce API calls
- Each save creates a commit

## Common Development Tasks

### Changing the Data Schema

1. Update the TypeScript-like structure in docs
2. Modify `services/github.js` methods
3. Update API response handling in routes
4. Update frontend components

### Adding Environment Variables

1. Add to `example.env` with documentation
2. Add to `.env` for local development
3. Read in code: `process.env.VARIABLE_NAME`
4. For frontend: prefix with `VITE_` and use `import.meta.env.VITE_VARIABLE_NAME`

### Debugging

**Backend:**
```javascript
console.log('Debug:', variable);
// Logs appear in terminal running backend
```

**Frontend:**
```javascript
console.log('Debug:', variable);
// Logs appear in browser DevTools console
```

**Network requests:**
Use browser DevTools Network tab to inspect API calls.

## Code Style

### Backend

- ES Modules (`import`/`export`)
- Async/await for promises
- Error handling with try/catch
- Descriptive error messages

### Frontend

- Vue 3 Composition API (`<script setup>`)
- Refs for reactive state
- Computed properties for derived state
- Scoped CSS

## Makefile Commands

| Command | Description |
|---------|-------------|
| `make help` | Show all commands |
| `make install` | Install dependencies |
| `make dev` | Start dev servers |
| `make dev-backend` | Start only backend |
| `make dev-frontend` | Start only frontend |
| `make build` | Build frontend |
| `make hash-password PASSWORD=xxx` | Generate password hash |
| `make clean` | Remove node_modules and dist |

## Troubleshooting

### Backend won't start

```bash
# Check for syntax errors
node --check backend/server.js

# Check dependencies
cd backend && npm install
```

### Frontend build errors

```bash
# Clear cache and rebuild
rm -rf frontend/node_modules/.vite
cd frontend && npm run dev
```

### Hot reload not working

- Backend: Uses Node.js `--watch` flag (Node 18+)
- Frontend: Vite HMR should work automatically

If issues persist, restart the dev servers.

### CORS errors

The backend has CORS enabled for all origins in development. If you see CORS errors:

1. Check backend is running
2. Check `VITE_API_URL` matches backend URL
3. Check browser console for specific error
