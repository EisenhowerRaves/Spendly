<template>
  <Teleport to="body">
    <div class="modal-overlay" :class="{ open: visible }" @click.self="$emit('close')">
      <div class="modal">
        <h3>New Category</h3>
        <div class="form-group">
          <label>Category Name</label>
          <input v-model="name" type="text" placeholder="e.g. Entertainment" @keydown.enter="create" />
        </div>
        <div class="form-group">
          <label>Colour</label>
          <div class="color-picker">
            <div
              v-for="c in COLORS"
              :key="c"
              class="color-swatch"
              :class="{ selected: selectedColor === c }"
              :style="{ background: c }"
              @click="selectedColor = c"
            />
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn-cancel" @click="$emit('close')">Cancel</button>
          <button class="btn-accent" style="flex: 2" @click="create">Create Category</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useAppStore, COLORS } from '@/stores/useAppStore'

const props = defineProps({ visible: Boolean })
const emit = defineEmits(['close'])
const store = useAppStore()

const name = ref('')
const selectedColor = ref(COLORS[0])

watch(
  () => props.visible,
  (v) => { if (v) { name.value = ''; selectedColor.value = COLORS[0] } },
)

async function create() {
  const n = name.value.trim()
  if (!n) { window.__spendlyToast?.('Enter a category name'); return }
  await store.createTab(n, selectedColor.value)
  window.__spendlyToast?.('Category created')
  emit('close')
}
</script>

<style scoped>
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); z-index: 200; display: flex; align-items: center; justify-content: center; padding: 1rem; opacity: 0; pointer-events: none; transition: opacity 0.2s; }
.modal-overlay.open { opacity: 1; pointer-events: all; }
.modal { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 2rem; width: 100%; max-width: 440px; }
.modal h3 { font-family: 'DM Serif Display', serif; font-size: 1.4rem; margin-bottom: 1.5rem; }
.form-group { display: flex; flex-direction: column; gap: 0.4rem; margin-bottom: 1rem; }
.form-group label { font-size: 0.75rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.06em; }
.form-group input { background: var(--surface2); border: 1px solid var(--border); border-radius: 8px; padding: 0.75rem 1rem; color: var(--text); font-family: 'DM Sans', sans-serif; font-size: 0.95rem; outline: none; width: 100%; }
.form-group input:focus { border-color: var(--accent); }
.color-picker { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.color-swatch { width: 28px; height: 28px; border-radius: 50%; cursor: pointer; border: 2px solid transparent; transition: border-color 0.15s, transform 0.15s; }
.color-swatch:hover { transform: scale(1.15); }
.color-swatch.selected { border-color: var(--text); transform: scale(1.15); }
.modal-actions { display: flex; gap: 0.75rem; margin-top: 1.5rem; }
.btn-cancel { flex: 1; background: var(--surface2); border: 1px solid var(--border); border-radius: 8px; padding: 0.75rem; color: var(--muted); font-family: 'DM Sans', sans-serif; cursor: pointer; }
</style>
