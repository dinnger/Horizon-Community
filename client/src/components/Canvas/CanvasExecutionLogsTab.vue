<template>
  <div class="flex flex-col overflow-auto h-full">
    <div ref="logsContainer" class="flex-1 p-3 overflow-y-auto font-mono text-xs space-y-1 relative">
      <div class="absolute top-0 right-0 flex items-center gap-2">
        <button @click="$emit('clearCurrentTab')" class="btn btn-ghost btn-xs text-gray-400 hover:text-white">
          <span class="mdi mdi-delete-sweep"></span>
          Limpiar
        </button>
        <button @click="$emit('toggleAutoScroll')" class="btn btn-ghost btn-xs text-gray-400 hover:text-white"
          :class="{ 'text-emerald-400': autoScroll }">
          <span class="mdi mdi-arrow-down-bold"></span>
          Auto-scroll
        </button>
      </div>
      <div v-for="log in executionLogs" :key="log.id" class="flex items-start gap-2" :class="getLogClass(log.type)">
        <span class="text-gray-500 flex-shrink-0 w-20">
          {{ formatLogTime(log.timestamp) }}
        </span>
        <span class="flex-shrink-0 w-4 text-center" :class="getLogIconClass(log.type)">
          {{ getLogIcon(log.type) }}
        </span>
        <span class="flex-1 break-words">{{ log.message }}</span>

      </div>

      <!-- Placeholder cuando no hay logs -->
      <div v-if="executionLogs.length === 0" class="text-gray-500 text-center py-8">
        <span class="mdi mdi-information-outline text-2xl block mb-2"></span>
        <p>No hay logs de ejecución disponibles</p>
        <p class="text-xs mt-1">Los logs aparecerán aquí durante la ejecución del workflow</p>
      </div>

    </div>
    <div class="border-t border-gray-700 p-2 flex items-center justify-between text-xs text-gray-400">
      <span>Total: {{ executionLogs.length }} mensajes</span>

      <div class="flex gap-4">
        <span>
          <span class="text-emerald-400">●</span> Info: {{ logCounts.info }}
        </span>
        <span>
          <span class="text-yellow-400">●</span> Advertencia: {{ logCounts.warning }}
        </span>
        <span>
          <span class="text-red-400">●</span> Error: {{ logCounts.error }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue'

interface ExecutionLog {
  id: string
  timestamp: Date
  type: 'info' | 'warning' | 'error' | 'debug'
  message: string
  nodeId?: string
}

interface Props {
  executionLogs: ExecutionLog[]
  autoScroll: boolean
}

const props = defineProps<Props>()

const logsContainer = ref<HTMLElement>()

const getLogClass = (type: string) => {
  switch (type) {
    case 'error':
      return 'text-red-400'
    case 'warning':
      return 'text-yellow-400'
    case 'info':
      return 'text-emerald-400'
    case 'debug':
      return 'text-gray-400'
    default:
      return 'text-white'
  }
}

const getLogIconClass = (type: string) => {
  return getLogClass(type)
}

const getLogIcon = (type: string) => {
  switch (type) {
    case 'error':
      return '✕'
    case 'warning':
      return '⚠'
    case 'info':
      return 'ℹ'
    case 'debug':
      return '●'
    default:
      return '●'
  }
}

const formatLogTime = (timestamp: Date) => {
  return timestamp.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// Auto-scroll cuando se agregan nuevos logs
watch(() => props.executionLogs.length, () => {
  if (props.autoScroll) {
    nextTick(() => {
      if (logsContainer.value) {
        logsContainer.value.scrollTop = logsContainer.value.scrollHeight
      }
    })
  }
})

const logCounts = computed(() => {
  return props.executionLogs.reduce((acc, log) => {
    acc[log.type] = (acc[log.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)
})

// Exponer referencia del contenedor para auto-scroll externo
defineExpose({
  scrollToBottom: () => {
    if (logsContainer.value) {
      logsContainer.value.scrollTop = logsContainer.value.scrollHeight
    }
  }
})
</script>
