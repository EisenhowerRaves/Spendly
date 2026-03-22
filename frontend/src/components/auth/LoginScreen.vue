<template>
  <div class="auth-screen">
    <div class="login-form">
      <h1>Spendly</h1>
      <p>Track your expenses, your way.</p>
      <div class="setup-card">
        <div class="form-group">
          <label>Email:</label>
          <input
            v-model="email"
            type="email"
            placeholder="you@example.com"
            autocomplete="email"
            @keyup.enter="handleLogin"
          />
        </div>
        <div class="form-group">
          <label>Password:</label>
          <div class="password-wrapper">
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Password"
              autocomplete="current-password"
              @keyup.enter="handleLogin"
            />
            <button type="button" class="toggle-password" @click="showPassword = !showPassword">
              <Eye v-if="!showPassword" :size="18" />
              <EyeOff v-else :size="18" />
            </button>
          </div>
        </div>
        <button class="btn-accent" :disabled="loading" @click="handleLogin">
          {{ loading ? 'Logging in…' : 'Log in' }}
        </button>
        <p class="setup-note">
          Don't have an account?
          <a href="#" @click.prevent="$emit('open-register')">Create new account</a>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/firebase'
import { Eye, EyeOff } from 'lucide-vue-next'

const emit = defineEmits(['open-register'])

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
async function handleLogin() {
  if (!email.value.trim() || !password.value) {
    window.__spendlyToast?.('Enter email and password')
    return
  }
  loading.value = true
  try {
    await signInWithEmailAndPassword(auth, email.value.trim(), password.value)
    // onAuthStateChanged in App.vue handles the rest
  } catch (e) {
    window.__spendlyToast?.('Error: ' + (e.message || e.code))
    loading.value = false
  }
}
</script>

<style scoped>
.auth-screen {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 1.5rem;
  padding: 2rem;
  background: radial-gradient(ellipse at 60% 40%, #1a2a0a 0%, #0f0f0f 70%);
}
.auth-screen h1 {
  font-family: 'DM Serif Display', serif;
  font-size: clamp(2.5rem, 6vw, 4rem);
  color: var(--accent);
  text-align: center;
}
.auth-screen p {
  color: var(--muted);
  text-align: center;
  max-width: 400px;
  line-height: 1.6;
}
.login-form {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  width: 100%;
  max-width: 420px;
}
.setup-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 2rem;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.setup-card label {
  font-size: 0.8rem;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.setup-card input {
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 0.75rem 1rem;
  color: var(--text);
  font-family: 'DM Sans', sans-serif;
  font-size: 0.95rem;
  width: 100%;
  outline: none;
  transition: border-color 0.2s;
}
.setup-card input:focus {
  border-color: var(--accent);
}
.setup-note {
  font-size: 0.78rem;
  color: var(--muted);
  text-align: center;
  line-height: 1.5;
}
.setup-note a {
  color: var(--accent);
  text-decoration: none;
}
.setup-note a:hover {
  text-decoration: underline;
}
.password-wrapper {
  position: relative;
  width: 100%;
}
.password-wrapper input {
  padding-right: 2.5rem;
}
.toggle-password {
  position: absolute;
  top: 50%;
  right: 0.5rem;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--muted);
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
}
.toggle-password:hover {
  color: var(--text);
}
</style>
