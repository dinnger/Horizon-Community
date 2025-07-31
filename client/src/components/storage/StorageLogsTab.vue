<template>
  <div class="card bg-base-200 shadow-xl mb-8">
    <div class="card-body">
      <h2 class="card-title mb-6">Logs</h2>
      <div class="log-terminal p-4 rounded font-mono text-sm max-h-96 overflow-y-auto">
        <div v-for="log in logs" :key="log.id" class="flex items-start space-x-3 py-1">
          <span class="text-gray-500 text-xs whitespace-nowrap">{{ log.timestamp }}</span>
          <span class="px-2 py-1 rounded text-xs font-bold bg-base-300">{{ log.level }}</span>
          <span class="flex-1">{{ log.message }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps } from 'vue'
const props = defineProps<{ logs: any[] }>()
</script>

<style scoped>
.log-terminal {
  background: #0d1117;
  color: #c9d1d9;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  border-radius: 8px;
  border: 1px solid #30363d;
}
</style>
