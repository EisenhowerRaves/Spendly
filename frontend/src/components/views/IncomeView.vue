<template>
  <EntryTableView
    title="Income"
    color="#368a1c"
    collection="income"
    :items="store.income"
    :selected-ids="store.selectedIncomeIds"
    @update:selected-ids="store.selectedIncomeIds = $event"
    @open-add="$emit('open-add')"
    @edit="(id) => $emit('edit', id)"
  />
</template>

<script setup>
import { useAppStore } from '@/stores/useAppStore'
import EntryTableView from './EntryTableView.vue'

defineEmits(['open-add', 'edit'])
const store = useAppStore()
</script>
