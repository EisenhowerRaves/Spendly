<template>
  <nav class="sidebar">
    <div class="sidebar-label">Overview</div>
    <div
      class="sidebar-item"
      :class="{ active: store.activeTab === 'overview' }"
      @click="store.activeTab = 'overview'"
    >
      <div class="dot" style="background: #e8ff47" />
      <span>Dashboard</span>
    </div>
    <div
      class="sidebar-item"
      :class="{ active: store.activeTab === 'income' }"
      @click="store.activeTab = 'income'"
    >
      <div class="dot" style="background: #368a1c" />
      <span>Income</span>
    </div>
    <div
      class="sidebar-item"
      :class="{ active: store.activeTab === 'taxes' }"
      @click="store.activeTab = 'taxes'"
    >
      <div class="dot" style="background: #a51f07" />
      <span>Taxes</span>
    </div>
    <div
      class="sidebar-item"
      :class="{ active: store.activeTab === 'super' }"
      @click="store.activeTab = 'super'"
    >
      <div class="dot" style="background: #2563eb" />
      <span>Super</span>
    </div>

    <div class="sidebar-label">Expense Categories</div>
    <div
      v-for="tab in store.sidebarTabs"
      :key="tab.id"
      class="sidebar-item"
      :class="{ active: store.activeTab === tab.id }"
      @click="store.activeTab = tab.id"
    >
      <div class="dot" :style="{ background: tab.color }" />
      <span>{{ tab.name }}</span>
      <span class="tab-total">${{ tab.total.toFixed(0) }}</span>
    </div>

    <div class="sidebar-add-tab" @click="$emit('open-new-tab-modal')">
      <span>＋</span> New Category
    </div>
  </nav>
</template>

<script setup>
import { useAppStore } from '@/stores/useAppStore'

defineEmits(['open-new-tab-modal'])

const store = useAppStore()
</script>

<style scoped>
.sidebar {
  border-right: 1px solid var(--border);
  padding: 1.5rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  position: sticky;
  top: 60px;
  height: calc(100vh - 60px);
  overflow-y: auto;
}
.sidebar-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--muted);
  padding: 0.5rem 0.75rem;
  margin-top: 0.5rem;
}
.sidebar-item {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.6rem 0.75rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.88rem;
  color: var(--muted);
  transition: all 0.15s;
  border: 1px solid transparent;
}
.sidebar-item:hover {
  background: var(--surface);
  color: var(--text);
}
.sidebar-item.active {
  background: var(--surface2);
  color: var(--text);
  border-color: var(--border);
}
.sidebar-item .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.sidebar-item .tab-total {
  margin-left: auto;
  font-size: 0.75rem;
  color: var(--muted);
}
.sidebar-add-tab {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.6rem 0.75rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.85rem;
  color: var(--muted);
  border: 1px dashed var(--border);
  transition: all 0.2s;
  margin-top: 0.25rem;
}
.sidebar-add-tab:hover {
  border-color: var(--accent);
  color: var(--accent);
}
@media (max-width: 768px) {
  .sidebar {
    display: none;
  }
}
</style>
