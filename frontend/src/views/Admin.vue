<script setup>
import { ref, onMounted, computed } from 'vue'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

// Auth state
const token = ref(localStorage.getItem('admin_token') || '')
const isAuthenticated = computed(() => !!token.value)

// Login form
const loginForm = ref({ username: '', password: '' })
const loginError = ref(null)
const loggingIn = ref(false)

// Data
const applications = ref([])
const participants = ref([])
const loading = ref(false)
const error = ref(null)
const activeTab = ref('applications')

// Actions
const actionLoading = ref({})

async function login() {
  loginError.value = null
  loggingIn.value = true

  try {
    const response = await fetch(`${API_URL}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loginForm.value)
    })

    const data = await response.json()

    if (!response.ok) {
      loginError.value = data.error || 'Login failed'
      return
    }

    token.value = data.token
    localStorage.setItem('admin_token', data.token)
    await loadData()
  } catch (e) {
    loginError.value = 'Connection failed'
  } finally {
    loggingIn.value = false
  }
}

function logout() {
  token.value = ''
  localStorage.removeItem('admin_token')
  applications.value = []
  participants.value = []
}

async function authFetch(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token.value}`,
      'Content-Type': 'application/json'
    }
  })

  if (response.status === 401) {
    logout()
    throw new Error('Session expired')
  }

  return response
}

async function loadData() {
  loading.value = true
  error.value = null

  try {
    const [appsRes, partsRes] = await Promise.all([
      authFetch(`${API_URL}/api/admin/applications`),
      authFetch(`${API_URL}/api/admin/participants`)
    ])

    applications.value = await appsRes.json()
    participants.value = await partsRes.json()
  } catch (e) {
    if (e.message !== 'Session expired') {
      error.value = 'Failed to load data'
    }
  } finally {
    loading.value = false
  }
}

const pendingApplications = computed(() =>
  applications.value.filter(a => a.status === 'pending')
)

async function approveApplication(id) {
  actionLoading.value[id] = true
  try {
    const response = await authFetch(`${API_URL}/api/admin/applications/${id}/approve`, {
      method: 'POST'
    })

    if (response.ok) {
      await loadData()
    }
  } catch (e) {
    console.error('Failed to approve:', e)
  } finally {
    actionLoading.value[id] = false
  }
}

async function rejectApplication(id) {
  actionLoading.value[id] = true
  try {
    const response = await authFetch(`${API_URL}/api/admin/applications/${id}/reject`, {
      method: 'POST'
    })

    if (response.ok) {
      await loadData()
    }
  } catch (e) {
    console.error('Failed to reject:', e)
  } finally {
    actionLoading.value[id] = false
  }
}

async function deleteApplication(id) {
  if (!confirm('Delete this application?')) return

  actionLoading.value[id] = true
  try {
    const response = await authFetch(`${API_URL}/api/admin/applications/${id}`, {
      method: 'DELETE'
    })

    if (response.ok) {
      await loadData()
    }
  } catch (e) {
    console.error('Failed to delete:', e)
  } finally {
    actionLoading.value[id] = false
  }
}

async function removeParticipant(slug) {
  if (!confirm('Remove this participant from the webring?')) return

  actionLoading.value[slug] = true
  try {
    const response = await authFetch(`${API_URL}/api/admin/participants/${slug}`, {
      method: 'DELETE'
    })

    if (response.ok) {
      await loadData()
    }
  } catch (e) {
    console.error('Failed to remove:', e)
  } finally {
    actionLoading.value[slug] = false
  }
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

onMounted(() => {
  if (isAuthenticated.value) {
    loadData()
  }
})
</script>

<template>
  <div class="container">
    <header>
      <router-link to="/" class="back-link">Back to Webring</router-link>
      <h1>Admin Dashboard</h1>
    </header>

    <!-- Login Form -->
    <div v-if="!isAuthenticated" class="login-box">
      <form @submit.prevent="login">
        <div class="form-group">
          <label for="username">Username</label>
          <input
            id="username"
            v-model="loginForm.username"
            type="text"
            required
            autocomplete="username"
          />
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <input
            id="password"
            v-model="loginForm.password"
            type="password"
            required
            autocomplete="current-password"
          />
        </div>

        <div v-if="loginError" class="error-message">{{ loginError }}</div>

        <button type="submit" class="btn-primary" :disabled="loggingIn">
          {{ loggingIn ? 'Logging in...' : 'Login' }}
        </button>
      </form>
    </div>

    <!-- Dashboard -->
    <template v-else>
      <div class="dashboard-header">
        <div class="tabs">
          <button
            :class="{ active: activeTab === 'applications' }"
            @click="activeTab = 'applications'"
          >
            Applications
            <span v-if="pendingApplications.length" class="badge">{{ pendingApplications.length }}</span>
          </button>
          <button
            :class="{ active: activeTab === 'participants' }"
            @click="activeTab = 'participants'"
          >
            Members ({{ participants.length }})
          </button>
        </div>
        <button @click="logout" class="btn-text">Logout</button>
      </div>

      <div v-if="loading" class="message">Loading...</div>
      <div v-else-if="error" class="message error">{{ error }}</div>

      <!-- Applications Tab -->
      <div v-else-if="activeTab === 'applications'" class="tab-content">
        <div v-if="applications.length === 0" class="empty-state">
          No applications yet
        </div>

        <div v-else class="list">
          <div
            v-for="app in applications"
            :key="app.id"
            class="list-item"
            :class="{ pending: app.status === 'pending' }"
          >
            <div class="item-header">
              <strong>{{ app.name }}</strong>
              <span class="status" :class="app.status">{{ app.status }}</span>
            </div>
            <a :href="app.url" target="_blank" rel="noopener" class="url">{{ app.url }}</a>
            <p class="description">{{ app.description }}</p>
            <div class="meta">
              <span>{{ app.contactEmail }}</span>
              <span>{{ formatDate(app.submittedAt) }}</span>
            </div>

            <div v-if="app.status === 'pending'" class="actions">
              <button
                @click="approveApplication(app.id)"
                class="btn-success"
                :disabled="actionLoading[app.id]"
              >
                Approve
              </button>
              <button
                @click="rejectApplication(app.id)"
                class="btn-danger"
                :disabled="actionLoading[app.id]"
              >
                Reject
              </button>
            </div>
            <div v-else class="actions">
              <button
                @click="deleteApplication(app.id)"
                class="btn-text-danger"
                :disabled="actionLoading[app.id]"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Participants Tab -->
      <div v-else-if="activeTab === 'participants'" class="tab-content">
        <div v-if="participants.length === 0" class="empty-state">
          No members yet
        </div>

        <div v-else class="list">
          <div v-for="p in participants" :key="p.slug" class="list-item">
            <div class="item-header">
              <strong>{{ p.name }}</strong>
              <span class="slug">/{{ p.slug }}</span>
            </div>
            <a :href="p.url" target="_blank" rel="noopener" class="url">{{ p.url }}</a>
            <p class="description">{{ p.description }}</p>
            <div class="meta">
              <span>{{ p.contactEmail }}</span>
              <span v-if="p.approvedAt">Joined {{ formatDate(p.approvedAt) }}</span>
            </div>

            <div class="actions">
              <button
                @click="removeParticipant(p.slug)"
                class="btn-text-danger"
                :disabled="actionLoading[p.slug]"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.container {
  max-width: 640px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

header {
  text-align: center;
  margin-bottom: 2rem;
}

.back-link {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  text-decoration: none;
}

.back-link:hover {
  color: var(--color-primary);
}

header h1 {
  margin: 1rem 0 0;
  font-size: 1.5rem;
  font-weight: 600;
}

/* Login */
.login-box {
  max-width: 320px;
  margin: 0 auto;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  font-size: 0.8125rem;
  font-weight: 500;
  margin-bottom: 0.375rem;
}

.form-group input {
  width: 100%;
  padding: 0.625rem 0.875rem;
  font-size: 0.875rem;
  font-family: inherit;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-bg);
  color: var(--color-text);
  box-sizing: border-box;
}

.form-group input:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 1px;
}

.error-message {
  background: var(--color-error-bg, #fef2f2);
  color: var(--color-error);
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.8125rem;
  margin-bottom: 1rem;
}

.btn-primary {
  width: 100%;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  font-family: inherit;
  border: none;
  border-radius: 8px;
  background: var(--color-primary);
  color: #fff;
  cursor: pointer;
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Dashboard */
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--color-border);
}

.tabs {
  display: flex;
  gap: 0.5rem;
}

.tabs button {
  padding: 0.5rem 1rem;
  font-size: 0.8125rem;
  font-family: inherit;
  font-weight: 500;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
}

.tabs button.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: #fff;
}

.tabs button .badge {
  display: inline-block;
  margin-left: 0.375rem;
  padding: 0.125rem 0.375rem;
  font-size: 0.6875rem;
  background: var(--color-error, #dc2626);
  color: #fff;
  border-radius: 10px;
}

.tabs button.active .badge {
  background: rgba(255,255,255,0.3);
}

.btn-text {
  background: none;
  border: none;
  font-size: 0.8125rem;
  font-family: inherit;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: 0.5rem;
}

.btn-text:hover {
  color: var(--color-primary);
}

.message {
  text-align: center;
  padding: 2rem;
  color: var(--color-text-muted);
}

.message.error {
  color: var(--color-error);
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--color-text-muted);
  font-size: 0.875rem;
}

/* List */
.list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.list-item {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  padding: 1rem;
}

.list-item.pending {
  border-color: var(--color-primary);
}

.item-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.375rem;
}

.item-header strong {
  font-size: 0.9375rem;
}

.status {
  font-size: 0.6875rem;
  font-weight: 500;
  text-transform: uppercase;
  padding: 0.125rem 0.5rem;
  border-radius: 10px;
}

.status.pending {
  background: #fef3c7;
  color: #92400e;
}

.status.approved {
  background: #d1fae5;
  color: #065f46;
}

.status.rejected {
  background: #fee2e2;
  color: #991b1b;
}

.slug {
  font-size: 0.75rem;
  font-family: "SF Mono", Monaco, Consolas, monospace;
  color: var(--color-text-muted);
}

.url {
  font-size: 0.8125rem;
  color: var(--color-primary);
  text-decoration: none;
  word-break: break-all;
}

.url:hover {
  text-decoration: underline;
}

.description {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  margin: 0.5rem 0;
  line-height: 1.4;
}

.meta {
  display: flex;
  gap: 1rem;
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin-top: 0.5rem;
}

.actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.875rem;
  padding-top: 0.875rem;
  border-top: 1px solid var(--color-border);
}

.btn-success {
  padding: 0.375rem 0.75rem;
  font-size: 0.8125rem;
  font-family: inherit;
  font-weight: 500;
  border: none;
  border-radius: 6px;
  background: #059669;
  color: #fff;
  cursor: pointer;
}

.btn-success:hover:not(:disabled) {
  background: #047857;
}

.btn-danger {
  padding: 0.375rem 0.75rem;
  font-size: 0.8125rem;
  font-family: inherit;
  font-weight: 500;
  border: none;
  border-radius: 6px;
  background: #dc2626;
  color: #fff;
  cursor: pointer;
}

.btn-danger:hover:not(:disabled) {
  background: #b91c1c;
}

.btn-text-danger {
  background: none;
  border: none;
  font-size: 0.8125rem;
  font-family: inherit;
  color: var(--color-error, #dc2626);
  cursor: pointer;
  padding: 0.375rem 0;
}

.btn-text-danger:hover:not(:disabled) {
  text-decoration: underline;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
