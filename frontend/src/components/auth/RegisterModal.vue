<template>
  <Teleport to="body">
    <div class="modal-overlay" :class="{ open: visible }" @click.self="$emit('close')">
      <div class="modal">
        <h3>Spendly New Account</h3>
        <div class="form-group">
          <label>Name:</label>
          <input v-model="name" type="text" placeholder="First name" autocomplete="given-name" />
        </div>
        <div class="form-group">
          <label>Surname:</label>
          <input v-model="surname" type="text" placeholder="Last name" autocomplete="family-name" />
        </div>
        <div class="form-group">
          <label>Preferred name:</label>
          <input v-model="preferredName" type="text" placeholder="How should we call you?" />
        </div>
        <div class="form-group">
          <label>Email:</label>
          <input v-model="email" type="email" placeholder="you@example.com" autocomplete="email" />
        </div>
        <div class="form-group">
          <label>Password:</label>
          <div class="password-wrapper">
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Choose a password"
              autocomplete="new-password"
              @keyup.enter="handleRegister"
            />
            <button type="button" class="toggle-password" @click="showPassword = !showPassword">
              <Eye v-if="!showPassword" :size="18" />
              <EyeOff v-else :size="18" />
            </button>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn-cancel" @click="$emit('close')">Cancel</button>
          <button class="btn-accent" style="flex: 2" :disabled="loading" @click="handleRegister">
            {{ loading ? 'Creating account…' : 'Create' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref } from 'vue'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { auth, db } from '@/firebase'
import { useAppStore, DEFAULT_TABS } from '@/stores/useAppStore'
import { Eye, EyeOff } from 'lucide-vue-next'

const props = defineProps({ visible: Boolean })
const emit = defineEmits(['close'])

const store = useAppStore()

const name = ref('')
const surname = ref('')
const preferredName = ref('')
const email = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)

async function handleRegister() {
  if (!email.value.trim() || !password.value) {
    window.__spendlyToast?.('Enter email and password')
    return
  }
  loading.value = true
  try {
    const cred = await createUserWithEmailAndPassword(auth, email.value.trim(), password.value)
    const uid = cred.user.uid
    await setDoc(doc(db, 'users', uid), {
      email: email.value.trim(),
      name: name.value.trim(),
      surname: surname.value.trim(),
      preferredName: preferredName.value.trim(),
    })
    store.currentUserProfile = {
      email: email.value.trim(),
      name: name.value.trim(),
      surname: surname.value.trim(),
      preferredName: preferredName.value.trim(),
    }
    store.currentUserId = uid
    store.tabs = DEFAULT_TABS.map((t) => ({ ...t, id: crypto.randomUUID() }))
    store.expenses = []
    for (const tab of store.tabs) {
      await store.fbSaveTab(tab)
    }
    store.saveLocal()
    resetForm()
    emit('close')
    // onAuthStateChanged in App.vue fires and sets isLoggedIn
  } catch (e) {
    window.__spendlyToast?.('Error: ' + (e.message || e.code))
    loading.value = false
  }
}

function resetForm() {
  name.value = ''
  surname.value = ''
  preferredName.value = ''
  email.value = ''
  password.value = ''
  showPassword.value = false
  loading.value = false
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s;
}
.modal-overlay.open {
  opacity: 1;
  pointer-events: all;
}
.modal {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 2rem;
  width: 100%;
  max-width: 440px;
  transform: translateY(10px);
  transition: transform 0.2s;
}
.modal-overlay.open .modal {
  transform: translateY(0);
}
.modal h3 {
  font-family: 'DM Serif Display', serif;
  font-size: 1.4rem;
  margin-bottom: 1.5rem;
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  margin-bottom: 1rem;
}
.form-group label {
  font-size: 0.75rem;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.form-group input {
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 0.75rem 1rem;
  color: var(--text);
  font-family: 'DM Sans', sans-serif;
  font-size: 0.95rem;
  outline: none;
  transition: border-color 0.2s;
  width: 100%;
}
.form-group input:focus {
  border-color: var(--accent);
}
.modal-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1.5rem;
}
.btn-cancel {
  flex: 1;
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 0.75rem;
  color: var(--muted);
  font-family: 'DM Sans', sans-serif;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-cancel:hover {
  color: var(--text);
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
