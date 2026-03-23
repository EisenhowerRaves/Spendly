<template>
  <div class="chat-panel" :class="{ open: visible }">
    <div class="chat-header">
      <div class="chat-title">
        <span>Spendly Assistant</span>
        <span class="gemini-badge">Gemini</span>
      </div>
      <button class="chat-close" @click="$emit('close')"><X :size="18" /></button>
    </div>
    <div ref="messagesEl" class="chat-messages">
      <div
        v-for="(msg, i) in messages"
        :key="i"
        class="msg"
        :class="msg.role"
      >
        {{ msg.text }}
      </div>
      <div v-if="loading" class="msg ai loading">Analysing your expenses...</div>
    </div>
    <div class="chat-input-wrap">
      <input
        v-model="input"
        type="text"
        placeholder="Ask about your spending..."
        @keydown.enter="send"
      />
      <button class="send-btn" :disabled="!input.trim() || loading" @click="send"><Send :size="16" /></button>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, watch } from 'vue'
import { X, Send } from 'lucide-vue-next'
import { useAppStore } from '@/stores/useAppStore'

const props = defineProps({ visible: Boolean })
defineEmits(['close'])
const store = useAppStore()

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const messages = ref([])
const input = ref('')
const loading = ref(false)
const messagesEl = ref(null)

function scrollBottom() {
  nextTick(() => {
    if (messagesEl.value) messagesEl.value.scrollTop = messagesEl.value.scrollHeight
  })
}

watch(() => props.visible, (v) => {
  if (v && messages.value.length === 0) {
    messages.value.push({ role: 'ai', text: 'Hi! I\'m your Spendly assistant. Ask me anything about your expenses.' })
  }
})

async function send() {
  const msg = input.value.trim()
  if (!msg || loading.value) return
  input.value = ''
  messages.value.push({ role: 'user', text: msg })
  scrollBottom()

  loading.value = true
  scrollBottom()
  try {
    const summary = store.getExpenseSummary()
    const res = await fetch(`${API_URL}/api/gemini`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ summary, message: msg }),
    })
    const data = await res.json()
    messages.value.push({ role: 'ai', text: data.reply || data.error || 'Sorry, I had trouble processing that.' })
  } catch {
    messages.value.push({ role: 'ai', text: 'AI unavailable right now. Your expense data is saved and working fine!' })
  } finally {
    loading.value = false
    scrollBottom()
  }
}
</script>

<style scoped>
.chat-panel { position: fixed; top: 0; right: 0; width: 380px; max-width: 100vw; height: 100vh; background: var(--surface); border-left: 1px solid var(--border); z-index: 300; display: flex; flex-direction: column; transform: translateX(100%); transition: transform 0.3s ease; box-shadow: -4px 0 20px rgba(0,0,0,0.1); }
.chat-panel.open { transform: translateX(0); }
.chat-header { display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.25rem; border-bottom: 1px solid var(--border); }
.chat-title { display: flex; align-items: center; gap: 0.5rem; font-weight: 600; font-size: 0.95rem; }
.gemini-badge { font-size: 0.65rem; padding: 0.15rem 0.5rem; border-radius: 99px; background: linear-gradient(135deg, #4285f4, #9b72cb, #d96570); color: #fff; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
.chat-close { background: none; border: 1px solid var(--border); border-radius: 8px; cursor: pointer; color: var(--muted); padding: 0.35rem; display: inline-flex; align-items: center; justify-content: center; }
.chat-close:hover { color: var(--text); }
.chat-messages { flex: 1; overflow-y: auto; padding: 1.25rem; display: flex; flex-direction: column; gap: 0.75rem; }
.msg { padding: 0.75rem 1rem; border-radius: 12px; font-size: 0.88rem; max-width: 85%; line-height: 1.5; white-space: pre-wrap; word-break: break-word; }
.msg.user { background: var(--accent); color: #0f0f0f; align-self: flex-end; border-bottom-right-radius: 4px; }
.msg.ai { background: var(--surface2); color: var(--text); align-self: flex-start; border-bottom-left-radius: 4px; }
.msg.loading { opacity: 0.6; animation: pulse 1.5s ease-in-out infinite; }
@keyframes pulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 0.3; } }
.chat-input-wrap { display: flex; gap: 0.5rem; padding: 1rem 1.25rem; border-top: 1px solid var(--border); }
.chat-input-wrap input { flex: 1; background: var(--surface2); border: 1px solid var(--border); border-radius: 8px; padding: 0.65rem 1rem; color: var(--text); font-family: 'DM Sans', sans-serif; font-size: 0.9rem; outline: none; }
.chat-input-wrap input:focus { border-color: var(--accent); }
.send-btn { background: var(--accent); border: none; border-radius: 8px; padding: 0.65rem 0.85rem; cursor: pointer; color: #0f0f0f; display: inline-flex; align-items: center; justify-content: center; }
.send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
@media (max-width: 768px) {
  .chat-panel { width: 100vw; }
}
</style>
