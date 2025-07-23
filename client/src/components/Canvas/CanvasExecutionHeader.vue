<template>
  <div class="flex items-center justify-between border-b border-gray-700">
    <div class="flex items-center gap-4">
      <div class="flex items-center gap-2">
        <div class="tabs tabs-boxed bg-transparent">
          <button @click="$emit('updateActiveTab', 'logs')" class="tab tab-sm"
            :class="{ 'tab-active': activeTab === 'logs' }">
            Logs de Ejecución
          </button>
          <button @click="$emit('updateActiveTab', 'trace')" class="tab tab-sm"
            :class="{ 'tab-active': activeTab === 'trace' }">
            Traza de Ejecución
          </button>
        </div>
        <div class="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
interface Props {
  activeTab: 'logs' | 'trace'
  autoScroll: boolean
}

defineProps<Props>()

defineEmits<{
  updateActiveTab: [tab: 'logs' | 'trace']
  clearCurrentTab: []
  toggleAutoScroll: []
}>()
</script>
