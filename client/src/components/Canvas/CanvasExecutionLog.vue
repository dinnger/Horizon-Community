<template>
  <div v-if="isVisible" class="absolute bottom-4 left-4 right-4 z-10">
    <div
      class="bg-base-100/70 backdrop-blur-md text-white rounded-lg shadow-2xl border border-gray-700 h-64 flex flex-col">
      <!-- Header del Panel de Logs -->
      <div class="flex items-center justify-between p-3 border-b border-gray-700">
        <div class="flex items-center gap-2">
          <span class="mdi mdi-console-line text-emerald-400"></span>
          <h3 class="font-semibold text-sm">Logs de Ejecución</h3>
          <div class="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
        </div>
        <div class="flex items-center gap-2">
          <button @click="clearLogs" class="btn btn-ghost btn-xs text-gray-400 hover:text-white">
            <span class="mdi mdi-delete-sweep"></span>
            Limpiar
          </button>
          <button @click="toggleAutoScroll" class="btn btn-ghost btn-xs text-gray-400 hover:text-white"
            :class="{ 'text-emerald-400': autoScroll }">
            <span class="mdi mdi-arrow-down-bold"></span>
            Auto-scroll
          </button>
        </div>
      </div>

      <!-- Contenido de Logs -->
      <div ref="logsContainer" class="flex-1 p-3 overflow-y-auto font-mono text-xs space-y-1">
        <div v-for="log in executionLogs" :key="log.id" class="flex items-start gap-2" :class="getLogClass(log.type)">
          <span class="text-gray-500 flex-shrink-0 w-20">
            {{ formatLogTime(log.timestamp) }}
          </span>
          <span class="flex-shrink-0 w-4 text-center" :class="getLogIconClass(log.type)">
            {{ getLogIcon(log.type) }}
          </span>
          <span class="flex-1 break-words">{{ log.message }}</span>
          <span v-if="log.nodeId" class="flex-shrink-0 text-xs bg-gray-700 px-2 py-0.5 rounded text-gray-300">
            {{ log.nodeId }}
          </span>
        </div>

        <!-- Placeholder cuando no hay logs -->
        <div v-if="executionLogs.length === 0" class="text-gray-500 text-center py-8">
          <span class="mdi mdi-information-outline text-2xl block mb-2"></span>
          <p>No hay logs de ejecución disponibles</p>
          <p class="text-xs mt-1">Los logs aparecerán aquí durante la ejecución del workflow</p>
        </div>
      </div>

      <!-- Footer con Estadísticas -->
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
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue'

interface ExecutionLog {
  id: string
  timestamp: Date
  type: 'info' | 'warning' | 'error' | 'debug'
  message: string
  nodeId?: string
}

interface Props {
  executionLogs: ExecutionLog[]
  isVisible: boolean
}

const props = defineProps<Props>()

const logsContainer = ref<HTMLElement>()
const autoScroll = ref(true)

const logCounts = computed(() => {
  return props.executionLogs.reduce((acc, log) => {
    acc[log.type] = (acc[log.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)
})

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

const clearLogs = () => {
  // Emitir evento para limpiar logs
  // En una implementación real, esto llamaría a una función del store
  console.log('Clearing logs...')
}

const toggleAutoScroll = () => {
  autoScroll.value = !autoScroll.value
}

// Auto-scroll cuando se agregan nuevos logs
watch(() => props.executionLogs.length, () => {
  if (autoScroll.value) {
    nextTick(() => {
      if (logsContainer.value) {
        logsContainer.value.scrollTop = logsContainer.value.scrollHeight
      }
    })
  }
})
</script>
