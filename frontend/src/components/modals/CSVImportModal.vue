<template>
  <Teleport to="body">
    <div class="modal-overlay" :class="{ open: visible }" @click.self="$emit('close')">
      <div class="modal">
        <h3>Import CSV</h3>
        <div
          class="csv-drop"
          :class="{ 'drag-over': dragging }"
          @dragover.prevent="dragging = true"
          @dragleave="dragging = false"
          @drop.prevent="onDrop"
        >
          <p>Drag & drop your CSV file here</p>
          <p style="font-size: 0.8rem; color: var(--muted)">or</p>
          <label class="csv-file-label">
            Choose file
            <input type="file" accept=".csv" style="display: none" @change="onFile" />
          </label>
        </div>
        <p class="csv-preview">{{ previewText }}</p>
        <div class="form-group">
          <label>Import into category</label>
          <select v-model="targetTabId">
            <option v-for="t in store.tabs" :key="t.id" :value="t.id">{{ t.name }}</option>
          </select>
        </div>
        <div class="modal-actions">
          <button class="btn-cancel" @click="$emit('close')">Cancel</button>
          <button class="btn-accent" style="flex: 2" :disabled="pending.length === 0" @click="doImport">
            Import {{ pending.length }} transactions
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useAppStore } from '@/stores/useAppStore'

const props = defineProps({ visible: Boolean })
const emit = defineEmits(['close'])
const store = useAppStore()

const dragging = ref(false)
const previewText = ref('')
const pending = ref([])
const targetTabId = ref('')

watch(
  () => props.visible,
  (v) => {
    if (v) {
      pending.value = []
      previewText.value = ''
      targetTabId.value = store.tabs[0]?.id || ''
    }
  },
)

function parseRow(line) {
  const out = []
  let cur = ''
  let inQ = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQ) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++ } else { inQ = false }
      } else { cur += ch }
    } else {
      if (ch === '"') inQ = true
      else if (ch === ',') { out.push(cur.trim()); cur = '' }
      else cur += ch
    }
  }
  out.push(cur.trim())
  return out
}

function parseCSV(text, filename) {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim().split('\n')
  const headers = parseRow(lines[0]).map((h) => h.replace(/"/g, '').toLowerCase())
  const descIdx = headers.findIndex((h) => h.includes('desc') || h.includes('narr') || h.includes('detail') || h.includes('merchant') || h === 'description')
  const amtIdx = headers.findIndex((h) => h.includes('amount') || h.includes('debit') || h.includes('credit'))
  const dateIdx = headers.findIndex((h) => h.includes('date'))

  if (descIdx === -1 || amtIdx === -1) {
    previewText.value = 'Could not find required columns. Make sure CSV has Date, Description, Amount columns.'
    return
  }

  const items = []
  for (let i = 1; i < lines.length; i++) {
    const cols = parseRow(lines[i]).map((c) => c.replace(/"/g, ''))
    if (!cols[descIdx] || !cols[amtIdx]) continue
    const amt = Math.abs(parseFloat(cols[amtIdx].replace(/[^0-9.-]/g, '')))
    if (isNaN(amt) || amt === 0) continue
    let date = dateIdx >= 0 ? cols[dateIdx] : new Date().toISOString().split('T')[0]
    try { const d = new Date(date); if (!isNaN(d)) date = d.toISOString().split('T')[0] } catch {}
    items.push({ desc: cols[descIdx], amount: amt, date, note: '', id: crypto.randomUUID() })
  }

  pending.value = items
  previewText.value = `Found ${items.length} transactions in "${filename}"`
}

function onFile(e) {
  const file = e.target.files[0]
  if (!file) return
  const r = new FileReader()
  r.onload = (ev) => parseCSV(ev.target.result, file.name)
  r.readAsText(file)
}

function onDrop(e) {
  dragging.value = false
  const file = e.dataTransfer.files[0]
  if (file) { const r = new FileReader(); r.onload = (ev) => parseCSV(ev.target.result, file.name); r.readAsText(file) }
}

async function doImport() {
  for (const exp of pending.value) {
    exp.tabId = targetTabId.value
    await store.addExpense(exp)
  }
  window.__spendlyToast?.(`Imported ${pending.value.length} transactions`)
  emit('close')
}
</script>

<style scoped>
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); z-index: 200; display: flex; align-items: center; justify-content: center; padding: 1rem; opacity: 0; pointer-events: none; transition: opacity 0.2s; }
.modal-overlay.open { opacity: 1; pointer-events: all; }
.modal { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 2rem; width: 100%; max-width: 480px; }
.modal h3 { font-family: 'DM Serif Display', serif; font-size: 1.4rem; margin-bottom: 1.5rem; }
.csv-drop { border: 2px dashed var(--border); border-radius: 12px; padding: 2rem; text-align: center; margin-bottom: 1rem; transition: border-color 0.2s; }
.csv-drop.drag-over { border-color: var(--accent); background: rgba(22,163,112,0.05); }
.csv-file-label { display: inline-block; margin-top: 0.5rem; padding: 0.5rem 1rem; background: var(--surface2); border: 1px solid var(--border); border-radius: 8px; cursor: pointer; font-size: 0.85rem; }
.csv-preview { font-size: 0.85rem; color: var(--accent); margin-bottom: 1rem; min-height: 1.2rem; }
.form-group { display: flex; flex-direction: column; gap: 0.4rem; margin-bottom: 1rem; }
.form-group label { font-size: 0.75rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.06em; }
.form-group select { background: var(--surface2); border: 1px solid var(--border); border-radius: 8px; padding: 0.75rem 1rem; color: var(--text); font-family: 'DM Sans', sans-serif; font-size: 0.95rem; outline: none; width: 100%; }
.modal-actions { display: flex; gap: 0.75rem; margin-top: 1.5rem; }
.btn-cancel { flex: 1; background: var(--surface2); border: 1px solid var(--border); border-radius: 8px; padding: 0.75rem; color: var(--muted); font-family: 'DM Sans', sans-serif; cursor: pointer; }
</style>
