<script setup>
import { ref, reactive } from 'vue'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const form = reactive({
  name: '',
  url: '',
  description: '',
  contactEmail: ''
})

const submitting = ref(false)
const submitted = ref(false)
const error = ref(null)
const applicationId = ref(null)

async function submitApplication() {
  error.value = null
  submitting.value = true

  try {
    const response = await fetch(`${API_URL}/api/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })

    const data = await response.json()

    if (!response.ok) {
      if (data.details) {
        error.value = data.details.join(', ')
      } else {
        error.value = data.error || 'Submission failed'
      }
      return
    }

    applicationId.value = data.application.id
    submitted.value = true
  } catch (e) {
    error.value = 'Failed to submit application. Please try again.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="container">
    <header>
      <router-link to="/" class="back-link">Back to Webring</router-link>
      <h1>Join the Webring</h1>
      <p>Submit your site for review</p>
    </header>

    <div v-if="submitted" class="success-message">
      <h2>Application Submitted!</h2>
      <p>Your application has been received and will be reviewed by an admin.</p>
      <p class="application-id">Application ID: <code>{{ applicationId }}</code></p>
      <router-link to="/" class="btn-primary">Return to Webring</router-link>
    </div>

    <form v-else @submit.prevent="submitApplication" class="apply-form">
      <div class="form-group">
        <label for="name">Site Name</label>
        <input
          id="name"
          v-model="form.name"
          type="text"
          placeholder="My Awesome Site"
          required
          minlength="2"
        />
      </div>

      <div class="form-group">
        <label for="url">Site URL</label>
        <input
          id="url"
          v-model="form.url"
          type="url"
          placeholder="https://example.com"
          required
        />
      </div>

      <div class="form-group">
        <label for="description">Description</label>
        <textarea
          id="description"
          v-model="form.description"
          placeholder="A brief description of your site (minimum 10 characters)"
          required
          minlength="10"
          rows="3"
        ></textarea>
      </div>

      <div class="form-group">
        <label for="email">Contact Email</label>
        <input
          id="email"
          v-model="form.contactEmail"
          type="email"
          placeholder="you@example.com"
          required
        />
        <small>Your email will only be used to contact you about your application</small>
      </div>

      <div v-if="error" class="error-message">{{ error }}</div>

      <button type="submit" class="btn-primary" :disabled="submitting">
        {{ submitting ? 'Submitting...' : 'Submit Application' }}
      </button>
    </form>
  </div>
</template>

<style scoped>
.container {
  max-width: 480px;
  margin: 0 auto;
  padding: 3rem 1.5rem;
}

header {
  text-align: center;
  margin-bottom: 2.5rem;
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

header p {
  margin: 0.5rem 0 0;
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.apply-form {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  font-size: 0.8125rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.form-group input,
.form-group textarea {
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

.form-group input:focus,
.form-group textarea:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 1px;
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
}

.form-group small {
  display: block;
  margin-top: 0.375rem;
  font-size: 0.75rem;
  color: var(--color-text-muted);
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
  transition: background-color 0.15s ease;
  text-decoration: none;
  display: inline-block;
  text-align: center;
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.success-message {
  text-align: center;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 2rem 1.5rem;
}

.success-message h2 {
  margin: 0 0 1rem;
  font-size: 1.25rem;
  color: var(--color-success, #059669);
}

.success-message p {
  margin: 0 0 1rem;
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.application-id {
  margin-bottom: 1.5rem !important;
}

.application-id code {
  font-family: "SF Mono", Monaco, Consolas, monospace;
  font-size: 0.75rem;
  background: var(--color-bg);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}
</style>
