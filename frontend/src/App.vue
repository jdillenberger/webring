<script setup>
import { ref, onMounted, computed } from 'vue'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const participants = ref([])
const loading = ref(true)
const error = ref(null)
const selectedSlug = ref('')
const showWidget = ref(false)

async function fetchParticipants() {
  try {
    const response = await fetch(`${API_URL}/api/participants`)
    participants.value = await response.json()
  } catch (e) {
    error.value = 'Failed to load participants'
  } finally {
    loading.value = false
  }
}

function navigatePrev() {
  window.location.href = `${API_URL}/api/prev/${selectedSlug.value}`
}

function navigateNext() {
  window.location.href = `${API_URL}/api/next/${selectedSlug.value}`
}

function navigateRandom() {
  const url = selectedSlug.value
    ? `${API_URL}/api/random/${selectedSlug.value}`
    : `${API_URL}/api/random`
  window.location.href = url
}

const widgetCode = computed(() => {
  const slug = selectedSlug.value
  if (slug) {
    // Explicit slug version (most reliable)
    return `<div style="text-align:center;font-family:system-ui,sans-serif;padding:12px;border:1px solid #ddd;border-radius:6px;max-width:280px">
  <small style="color:#666">Member of the Webring</small>
  <nav style="margin-top:8px">
    <a href="${API_URL}/api/prev/${slug}">Prev</a> |
    <a href="${API_URL}/api/random/${slug}">Random</a> |
    <a href="${API_URL}/api/next/${slug}">Next</a>
  </nav>
</div>`
  } else {
    // Referrer-based version (simpler, uses Referer header to identify site)
    return `<div style="text-align:center;font-family:system-ui,sans-serif;padding:12px;border:1px solid #ddd;border-radius:6px;max-width:280px">
  <small style="color:#666">Member of the Webring</small>
  <nav style="margin-top:8px">
    <a href="${API_URL}/api/prev">Prev</a> |
    <a href="${API_URL}/api/random">Random</a> |
    <a href="${API_URL}/api/next">Next</a>
  </nav>
</div>`
  }
})

function copyWidget() {
  navigator.clipboard.writeText(widgetCode.value)
}

onMounted(fetchParticipants)
</script>

<template>
  <div class="container">
    <header>
      <h1>Webring</h1>
      <p>{{ participants.length }} connected sites</p>
    </header>

    <div v-if="loading" class="message">Loading...</div>
    <div v-else-if="error" class="message error">{{ error }}</div>

    <template v-else>
      <section class="nav-section">
        <select v-model="selectedSlug">
          <option value="">Select a site to navigate from...</option>
          <option v-for="p in participants" :key="p.slug" :value="p.slug">
            {{ p.name }}
          </option>
        </select>

        <div class="nav-buttons">
          <button @click="navigatePrev" :disabled="!selectedSlug">Prev</button>
          <button @click="navigateRandom" class="btn-secondary">Random</button>
          <button @click="navigateNext" :disabled="!selectedSlug">Next</button>
        </div>
      </section>

      <section class="members">
        <h2>Members</h2>
        <ul>
          <li v-for="p in participants" :key="p.slug">
            <a :href="p.url" target="_blank" rel="noopener">{{ p.name }}</a>
            <span class="slug">/{{ p.slug }}</span>
            <span class="description">{{ p.description }}</span>
          </li>
        </ul>
      </section>

      <section class="widget-section">
        <button @click="showWidget = !showWidget" class="btn-text">
          {{ showWidget ? 'Hide embed code' : 'Get embed code' }}
        </button>

        <div v-if="showWidget" class="widget-box">
          <p class="widget-hint" v-if="selectedSlug">
            Using explicit slug (most reliable)
          </p>
          <p class="widget-hint" v-else>
            Using referrer-based detection (simpler, but requires your site's URL to be registered)
          </p>
          <pre><code>{{ widgetCode }}</code></pre>
          <button @click="copyWidget" class="btn-outline">Copy code</button>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.container {
  max-width: 560px;
  margin: 0 auto;
  padding: 3rem 1.5rem;
}

header {
  text-align: center;
  margin-bottom: 2.5rem;
}

header h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  letter-spacing: -0.025em;
}

header p {
  margin: 0.5rem 0 0;
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.message {
  text-align: center;
  padding: 2rem;
  color: var(--color-text-muted);
}

.message.error {
  color: var(--color-error);
}

/* Navigation */
.nav-section {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 1.25rem;
  margin-bottom: 2.5rem;
}

.nav-section select {
  width: 100%;
  padding: 0.625rem 0.875rem;
  font-size: 0.875rem;
  font-family: inherit;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-bg);
  color: var(--color-text);
  margin-bottom: 0.875rem;
  cursor: pointer;
}

.nav-section select:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 1px;
}

.nav-buttons {
  display: flex;
  gap: 0.5rem;
}

.nav-buttons button {
  flex: 1;
  padding: 0.625rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  font-family: inherit;
  border: none;
  border-radius: 8px;
  background: var(--color-primary);
  color: #fff;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.nav-buttons button:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

.nav-buttons button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.nav-buttons button.btn-secondary {
  background: var(--color-secondary);
}

.nav-buttons button.btn-secondary:hover:not(:disabled) {
  background: var(--color-secondary-hover);
}

/* Members */
.members h2 {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
  margin: 0 0 1rem;
}

.members ul {
  list-style: none;
  margin: 0;
  padding: 0;
}

.members li {
  padding: 0.875rem 0;
  border-bottom: 1px solid var(--color-border);
}

.members li:first-child {
  padding-top: 0;
}

.members li:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.members a {
  font-weight: 500;
  color: var(--color-primary);
  text-decoration: none;
}

.members a:hover {
  text-decoration: underline;
}

.members .slug {
  font-size: 0.75rem;
  font-family: "SF Mono", Monaco, Consolas, monospace;
  color: var(--color-text-muted);
  margin-left: 0.5rem;
}

.members .description {
  display: block;
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  margin-top: 0.25rem;
  line-height: 1.4;
}

/* Widget */
.widget-section {
  margin-top: 2.5rem;
  padding-top: 2rem;
  border-top: 1px solid var(--color-border);
  text-align: center;
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

.widget-box {
  margin-top: 1.25rem;
  text-align: left;
}

.widget-box pre {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 1rem;
  margin: 0 0 1rem;
  overflow-x: auto;
}

.widget-box code {
  font-family: "SF Mono", Monaco, Consolas, monospace;
  font-size: 0.75rem;
  line-height: 1.5;
  color: var(--color-text-muted);
}

.btn-outline {
  padding: 0.5rem 1rem;
  font-size: 0.8125rem;
  font-family: inherit;
  font-weight: 500;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: transparent;
  color: var(--color-text);
  cursor: pointer;
  transition: border-color 0.15s ease;
}

.btn-outline:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.widget-hint {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin: 0 0 0.75rem;
}
</style>
