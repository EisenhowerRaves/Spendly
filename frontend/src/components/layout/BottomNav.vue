<template>
  <nav class="bottom-nav">
    <button class="bottom-nav-item" :class="{ active: store.activeTab === 'overview' }" @click="store.activeTab = 'overview'">
      <LayoutDashboard :size="20" />
      <span>Dashboard</span>
    </button>
    <button class="bottom-nav-item" :class="{ active: isCategory }" @click="showCats = true">
      <Layers :size="20" />
      <span>Categories</span>
    </button>
    <button class="fab" @click="$emit('open-add-expense')">
      <Plus :size="24" />
    </button>
    <button class="bottom-nav-item" @click="$emit('open-csv')">
      <FileUp :size="20" />
      <span>Import</span>
    </button>
    <button class="bottom-nav-item" @click="$emit('toggle-chat')">
      <Bot :size="20" />
      <span>AI</span>
    </button>

    <!-- Slide-up category sheet -->
    <Teleport to="body">
      <div class="sheet-overlay" :class="{ open: showCats }" @click.self="showCats = false">
        <div class="sheet">
          <div class="sheet-header">
            <h3>Categories</h3>
            <button class="sheet-close" @click="showCats = false"><X :size="18" /></button>
          </div>
          <div class="sheet-list">
            <div class="sheet-item" :class="{ active: store.activeTab === 'overview' }" @click="pick('overview')">
              <span class="dot" style="background: #e8ff47" />
              <span>Dashboard</span>
            </div>
            <div class="sheet-item" :class="{ active: store.activeTab === 'income' }" @click="pick('income')">
              <span class="dot" style="background: #368a1c" />
              <span>Income</span>
            </div>
            <div class="sheet-item" :class="{ active: store.activeTab === 'taxes' }" @click="pick('taxes')">
              <span class="dot" style="background: #a51f07" />
              <span>Taxes</span>
            </div>
            <div class="sheet-item" :class="{ active: store.activeTab === 'super' }" @click="pick('super')">
              <span class="dot" style="background: #2563eb" />
              <span>Super</span>
            </div>
            <div
              v-for="tab in store.sidebarTabs"
              :key="tab.id"
              class="sheet-item"
              :class="{ active: store.activeTab === tab.id }"
              @click="pick(tab.id)"
            >
              <span class="dot" :style="{ background: tab.color }" />
              <span>{{ tab.name }}</span>
              <span class="tab-total">${{ tab.total.toFixed(0) }}</span>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </nav>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAppStore } from '@/stores/useAppStore'
import { LayoutDashboard, Layers, Plus, FileUp, Bot, X } from 'lucide-vue-next'

defineEmits(['open-add-expense', 'open-csv', 'toggle-chat'])
const store = useAppStore()
const showCats = ref(false)

const isCategory = computed(() =>
  store.activeTab !== 'overview' && store.activeTab !== 'income' && store.activeTab !== 'taxes' && store.activeTab !== 'super',
)

function pick(id) {
  store.activeTab = id
  showCats.value = false
}
</script>

<style scoped>
.bottom-nav { display: none; }
@media (max-width: 768px) {
  .bottom-nav {
    display: flex;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: var(--surface);
    border-top: 1px solid var(--border);
    z-index: 150;
    justify-content: space-around;
    align-items: center;
    padding: 0.35rem 0.5rem;
    padding-bottom: calc(0.35rem + env(safe-area-inset-bottom, 0));
  }
  .bottom-nav-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.2rem;
    background: none;
    border: none;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.65rem;
    color: var(--muted);
    cursor: pointer;
    padding: 0.35rem 0.5rem;
    transition: color 0.15s;
  }
  .bottom-nav-item.active { color: var(--accent); }
  .fab {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: var(--accent);
    border: none;
    color: #0f0f0f;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    margin-top: -18px;
    box-shadow: 0 2px 12px rgba(22,163,112,0.35);
    transition: transform 0.15s;
  }
  .fab:active { transform: scale(0.92); }
}

/* Category sheet */
.sheet-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.45); z-index: 400; opacity: 0; pointer-events: none; transition: opacity 0.2s; }
.sheet-overlay.open { opacity: 1; pointer-events: all; }
.sheet { position: fixed; bottom: 0; left: 0; right: 0; background: var(--surface); border-top-left-radius: 16px; border-top-right-radius: 16px; max-height: 70vh; overflow-y: auto; transform: translateY(100%); transition: transform 0.3s ease; }
.sheet-overlay.open .sheet { transform: translateY(0); }
.sheet-header { display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.25rem; border-bottom: 1px solid var(--border); }
.sheet-header h3 { font-family: 'DM Serif Display', serif; font-size: 1.1rem; }
.sheet-close { background: none; border: 1px solid var(--border); border-radius: 8px; padding: 0.3rem; cursor: pointer; color: var(--muted); display: inline-flex; align-items: center; }
.sheet-list { padding: 0.5rem; }
.sheet-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; border-radius: 8px; cursor: pointer; transition: background 0.15s; }
.sheet-item:hover { background: rgba(0,0,0,0.03); }
.sheet-item.active { background: rgba(22,163,112,0.08); font-weight: 600; }
.dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.tab-total { margin-left: auto; font-size: 0.75rem; color: var(--muted); }
</style>
