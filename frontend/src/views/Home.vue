<script setup>
import { ref, onMounted, computed } from 'vue'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
const SHOW_NAVIGATION = import.meta.env.VITE_SHOW_NAVIGATION !== 'false'

const participants = ref([])
const loading = ref(true)
const error = ref(null)
const selectedSlug = ref('')
const selectedTheme = ref('minimal')
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
const selectedMode = ref(prefersDark ? 'dark' : 'light')
const copiedWidget = ref(false)

const themes = [
  { id: 'minimal', name: 'Minimal' },
  { id: 'modern', name: 'Modern' },
  { id: 'retro', name: 'Retro' }
]

const modes = [
  { id: 'light', name: 'Light' },
  { id: 'dark', name: 'Dark' }
]

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

const widgetThemes = {
  minimal: {
    light: `<div style="text-align:center;font-family:system-ui,sans-serif;padding:12px;background:#fff;border:1px solid #ddd;border-radius:6px;max-width:280px;margin:0 auto">
  <small style="color:#666">Member of the Webring</small>
  <nav style="margin-top:8px">
    <a href="${API_URL}/api/prev" style="color:#3b82f6;text-decoration:none">Prev</a>
    <span style="color:#999;margin:0 8px">|</span>
    <a href="${API_URL}/api/random" style="color:#3b82f6;text-decoration:none">Random</a>
    <span style="color:#999;margin:0 8px">|</span>
    <a href="${API_URL}/api/next" style="color:#3b82f6;text-decoration:none">Next</a>
  </nav>
</div>`,
    dark: `<div style="text-align:center;font-family:system-ui,sans-serif;padding:12px;background:#1f2937;border:1px solid #374151;border-radius:6px;max-width:280px;margin:0 auto">
  <small style="color:#9ca3af">Member of the Webring</small>
  <nav style="margin-top:8px">
    <a href="${API_URL}/api/prev" style="color:#60a5fa;text-decoration:none">Prev</a>
    <span style="color:#4b5563;margin:0 8px">|</span>
    <a href="${API_URL}/api/random" style="color:#60a5fa;text-decoration:none">Random</a>
    <span style="color:#4b5563;margin:0 8px">|</span>
    <a href="${API_URL}/api/next" style="color:#60a5fa;text-decoration:none">Next</a>
  </nav>
</div>`
  },

  modern: {
    light: `<div style="display:flex;align-items:center;justify-content:center;gap:16px;font-family:system-ui,sans-serif;padding:16px 20px;background:#f8fafc;border-radius:50px;max-width:280px;margin:0 auto">
  <a href="${API_URL}/api/prev" style="display:flex;align-items:center;justify-content:center;width:40px;height:40px;background:#fff;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.08);color:#3b82f6;text-decoration:none" title="Previous">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
  </a>
  <a href="${API_URL}/api/random" style="display:flex;align-items:center;justify-content:center;width:40px;height:40px;background:#fff;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.08);color:#3b82f6;text-decoration:none" title="Random">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/></svg>
  </a>
  <a href="${API_URL}/api/next" style="display:flex;align-items:center;justify-content:center;width:40px;height:40px;background:#fff;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.08);color:#3b82f6;text-decoration:none" title="Next">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
  </a>
</div>`,
    dark: `<div style="display:flex;align-items:center;justify-content:center;gap:16px;font-family:system-ui,sans-serif;padding:16px 20px;background:#1f2937;border-radius:50px;max-width:280px;margin:0 auto">
  <a href="${API_URL}/api/prev" style="display:flex;align-items:center;justify-content:center;width:40px;height:40px;background:#374151;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.3);color:#60a5fa;text-decoration:none" title="Previous">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
  </a>
  <a href="${API_URL}/api/random" style="display:flex;align-items:center;justify-content:center;width:40px;height:40px;background:#374151;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.3);color:#60a5fa;text-decoration:none" title="Random">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/></svg>
  </a>
  <a href="${API_URL}/api/next" style="display:flex;align-items:center;justify-content:center;width:40px;height:40px;background:#374151;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.3);color:#60a5fa;text-decoration:none" title="Next">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
  </a>
</div>`
  },

  retro: {
    light: `<div style="font-family:Verdana,Geneva,sans-serif;padding:8px;background:linear-gradient(180deg,#dfdfdf 0%,#c0c0c0 100%);border:2px outset #fff;max-width:280px;margin:0 auto">
  <div style="text-align:center;font-size:10px;font-weight:bold;color:#000080;text-shadow:1px 1px #fff;margin-bottom:6px">~ WEBRING ~</div>
  <div style="display:flex;justify-content:center;gap:4px">
    <a href="${API_URL}/api/prev" style="padding:4px 12px;font-size:11px;font-weight:bold;background:linear-gradient(180deg,#fff 0%,#ddd 100%);border:2px outset #fff;color:#000;text-decoration:none">&#171; PREV</a>
    <a href="${API_URL}/api/random" style="padding:4px 12px;font-size:11px;font-weight:bold;background:linear-gradient(180deg,#fff 0%,#ddd 100%);border:2px outset #fff;color:#000;text-decoration:none">RANDOM</a>
    <a href="${API_URL}/api/next" style="padding:4px 12px;font-size:11px;font-weight:bold;background:linear-gradient(180deg,#fff 0%,#ddd 100%);border:2px outset #fff;color:#000;text-decoration:none">NEXT &#187;</a>
  </div>
</div>`,
    dark: `<div style="font-family:Verdana,Geneva,sans-serif;padding:8px;background:linear-gradient(180deg,#2d2d2d 0%,#1a1a1a 100%);border:2px outset #444;max-width:280px;margin:0 auto">
  <div style="text-align:center;font-size:10px;font-weight:bold;color:#00ff00;text-shadow:0 0 4px #00ff00;margin-bottom:6px">~ WEBRING ~</div>
  <div style="display:flex;justify-content:center;gap:4px">
    <a href="${API_URL}/api/prev" style="padding:4px 12px;font-size:11px;font-weight:bold;background:linear-gradient(180deg,#3d3d3d 0%,#2a2a2a 100%);border:2px outset #555;color:#00ff00;text-decoration:none">&#171; PREV</a>
    <a href="${API_URL}/api/random" style="padding:4px 12px;font-size:11px;font-weight:bold;background:linear-gradient(180deg,#3d3d3d 0%,#2a2a2a 100%);border:2px outset #555;color:#00ff00;text-decoration:none">RANDOM</a>
    <a href="${API_URL}/api/next" style="padding:4px 12px;font-size:11px;font-weight:bold;background:linear-gradient(180deg,#3d3d3d 0%,#2a2a2a 100%);border:2px outset #555;color:#00ff00;text-decoration:none">NEXT &#187;</a>
  </div>
</div>`
  }
}

const widgetCode = computed(() => widgetThemes[selectedTheme.value][selectedMode.value])

function copyWidget() {
  navigator.clipboard.writeText(widgetCode.value)
  copiedWidget.value = true
  setTimeout(() => copiedWidget.value = false, 2000)
}

onMounted(fetchParticipants)
</script>

<template>
  <div class="page">
    <header>
      <div class="header-icon">
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="40" stroke="currentColor" stroke-width="4" stroke-dasharray="8 4" />
          <circle cx="50" cy="10" r="8" fill="currentColor" />
          <circle cx="85" cy="65" r="8" fill="currentColor" />
          <circle cx="15" cy="65" r="8" fill="currentColor" />
          <path d="M50 18 L77 61" stroke="currentColor" stroke-width="2" />
          <path d="M77 61 L23 61" stroke="currentColor" stroke-width="2" />
          <path d="M23 61 L50 18" stroke="currentColor" stroke-width="2" />
        </svg>
      </div>
      <h1>Webring</h1>
      <p class="tagline">Discover the indie web, one site at a time</p>
      <div class="header-stats">
        <span class="stat">{{ participants.length }} sites connected</span>
      </div>
    </header>

    <div v-if="loading" class="message">Loading...</div>
    <div v-else-if="error" class="message error">{{ error }}</div>

    <div v-else class="two-column">
      <!-- Left Column -->
      <div class="column-left">
        <!-- Introduction -->
        <section class="intro-section">
          <h2>What is a Webring?</h2>
          <p>
            A webring is a collection of websites linked together in a circular structure.
            Each member site contains navigation links to the previous and next sites in the ring,
            allowing visitors to discover new websites by traversing the ring.
          </p>
          <p>
            Webrings were popular in the early days of the internet as a way for like-minded
            website owners to connect and share traffic. They represent a more personal,
            community-driven approach to web discovery.
          </p>
        </section>

        <!-- Embed Code -->
        <section class="embed-section">
          <h2>Embed Code</h2>
          <p class="embed-hint">Add this widget to your site to let visitors navigate the ring.</p>

          <!-- Theme Selector -->
          <div class="theme-selector">
            <span class="theme-label">Style:</span>
            <div class="theme-options">
              <label
                v-for="theme in themes"
                :key="theme.id"
                class="theme-option"
                :class="{ active: selectedTheme === theme.id }"
              >
                <input
                  type="radio"
                  :value="theme.id"
                  v-model="selectedTheme"
                  class="sr-only"
                />
                {{ theme.name }}
              </label>
            </div>
          </div>

          <!-- Mode Selector -->
          <div class="theme-selector">
            <span class="theme-label">Color mode:</span>
            <div class="theme-options">
              <label
                v-for="mode in modes"
                :key="mode.id"
                class="theme-option"
                :class="{ active: selectedMode === mode.id }"
              >
                <input
                  type="radio"
                  :value="mode.id"
                  v-model="selectedMode"
                  class="sr-only"
                />
                {{ mode.name }}
              </label>
            </div>
          </div>

          <!-- Live Preview -->
          <div class="widget-preview">
            <span class="preview-label">Preview:</span>
            <div class="preview-container" :class="{ 'preview-dark': selectedMode === 'dark' }" v-html="widgetCode"></div>
          </div>

          <!-- Code -->
          <div class="code-block">
            <span class="code-label">Copy this code to your site:</span>
            <pre><code>{{ widgetCode }}</code></pre>
          </div>

          <button @click="copyWidget" class="btn-outline">
            {{ copiedWidget ? 'Copied!' : 'Copy code' }}
          </button>
        </section>
      </div>

      <!-- Right Column -->
      <div class="column-right">
        <!-- Call to Action -->
        <section class="cta-section">
          <h2>Join the Webring</h2>
          <p>Have a website? Become part of our community of connected sites.</p>
          <router-link to="/apply" class="btn-primary">Apply Now</router-link>
        </section>

        <!-- Members -->
        <section class="members">
          <h2>Members</h2>
          <ul>
            <li v-for="p in participants" :key="p.slug">
              <a :href="p.url" target="_blank" rel="noopener">{{ p.name }}</a>
              <span class="description">{{ p.description }}</span>
            </li>
          </ul>
        </section>

        <!-- Navigation (optional) -->
        <section v-if="SHOW_NAVIGATION" class="nav-section">
          <h2>Navigate</h2>
          <select v-model="selectedSlug">
            <option value="">Select a site...</option>
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
      </div>
    </div>

    <footer>
      <router-link to="/admin">Admin</router-link>
    </footer>
  </div>
</template>

<style scoped>
.page {
  max-width: 1100px;
  margin: 0 auto;
  padding: 3rem 1.5rem;
}

header {
  text-align: center;
  margin-bottom: 3rem;
  padding: 2.5rem 2rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 16px;
}

.header-icon {
  width: 72px;
  height: 72px;
  margin: 0 auto 1.25rem;
  color: var(--color-primary);
}

.header-icon svg {
  width: 100%;
  height: 100%;
}

header h1 {
  margin: 0;
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: -0.03em;
}

.tagline {
  margin: 0.5rem 0 0;
  font-size: 1.0625rem;
  color: var(--color-text-muted);
}

.header-stats {
  margin-top: 1.25rem;
  display: flex;
  justify-content: center;
  gap: 1.5rem;
}

.stat {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  font-size: 0.8125rem;
  font-weight: 500;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 50px;
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

/* Two Column Layout */
.two-column {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2.5rem;
}

.column-left,
.column-right {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

@media (max-width: 768px) {
  .two-column {
    grid-template-columns: 1fr;
  }
}

/* Introduction */
.intro-section {
  margin-bottom: 0;
}

.intro-section h2 {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0 0 1rem;
  color: var(--color-text);
}

.intro-section p {
  font-size: 0.9375rem;
  line-height: 1.6;
  color: var(--color-text-muted);
  margin: 0 0 0.75rem;
}

.intro-section p:last-child {
  margin-bottom: 0;
}

/* Call to Action */
.cta-section {
  background: var(--color-primary);
  color: #fff;
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
}

.cta-section h2 {
  margin: 0 0 0.5rem;
  font-size: 1.25rem;
  font-weight: 600;
}

.cta-section p {
  margin: 0 0 1.25rem;
  font-size: 0.9375rem;
  opacity: 0.9;
}

.cta-section .btn-primary {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  font-size: 0.9375rem;
  font-weight: 500;
  background: #fff;
  color: var(--color-primary);
  border-radius: 8px;
  text-decoration: none;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.cta-section .btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

/* Embed Code */
.embed-section {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 1.5rem;
}

.embed-section h2 {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
  margin: 0 0 0.5rem;
}

.embed-hint {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  margin: 0 0 1.25rem;
}

/* Theme Selector */
.theme-selector {
  margin-bottom: 1.25rem;
}

.theme-label {
  display: block;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-text);
  margin-bottom: 0.5rem;
}

.theme-options {
  display: flex;
  gap: 0.5rem;
}

.theme-option {
  padding: 0.5rem 1rem;
  font-size: 0.8125rem;
  font-weight: 500;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-bg);
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all 0.15s ease;
}

.theme-option:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.theme-option.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: #fff;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}

/* Widget Preview */
.widget-preview {
  margin-bottom: 1.25rem;
}

.preview-label {
  display: block;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-text);
  margin-bottom: 0.5rem;
}

.preview-container {
  background: #fff;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 1.5rem;
  display: flex;
  justify-content: center;
  transition: background-color 0.2s ease;
}

.preview-container.preview-dark {
  background: #111827;
  border-color: #374151;
}

/* Code Block */
.code-block {
  margin-bottom: 1rem;
}

.code-label {
  display: block;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-text);
  margin-bottom: 0.5rem;
}

.embed-section pre {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 1rem;
  margin: 0;
  overflow-x: auto;
  max-height: 200px;
}

.embed-section code {
  font-family: "SF Mono", Monaco, Consolas, monospace;
  font-size: 0.6875rem;
  line-height: 1.5;
  color: var(--color-text-muted);
  white-space: pre-wrap;
  word-break: break-all;
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

/* Members */
.members {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 1.5rem;
}

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

.members .description {
  display: block;
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  margin-top: 0.25rem;
  line-height: 1.4;
}

/* Navigation */
.nav-section {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 1.25rem;
}

.nav-section h2 {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
  margin: 0 0 1rem;
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

/* Footer */
footer {
  margin-top: 3rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--color-border);
  text-align: center;
}

footer a {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  text-decoration: none;
}

footer a:hover {
  color: var(--color-primary);
}
</style>
