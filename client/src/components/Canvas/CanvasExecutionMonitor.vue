<template>
  <div class="card bg-base-200 shadow-md">
    <div class="card-body">
      <div class="flex items-center justify-between mb-4">
        <h4 class="card-title">
          <span class="mdi mdi-monitor-dashboard mr-2"></span>
          Monitor de Ejecución en Tiempo Real
        </h4>
        <div class="flex items-center space-x-2">
          <div class="badge" :class="isExecuting ? 'badge-warning' : 'badge-ghost'">
            <span v-if="isExecuting" class="loading loading-spinner loading-xs mr-1"></span>
            {{ isExecuting ? 'Activo' : 'Inactivo' }}
          </div>
          <button class="btn btn-ghost btn-sm" @click="toggleAutoRefresh">
            <span class="mdi" :class="autoRefresh ? 'mdi-pause' : 'mdi-play'"></span>
          </button>
        </div>
      </div>

      <!-- Progress Bar -->
      <div v-if="isExecuting" class="w-full bg-base-300 rounded-full h-2 mb-4">
        <div class="bg-primary h-2 rounded-full transition-all duration-500" :style="{ width: `${progress}%` }"></div>
      </div>

      <!-- Execution Info -->
      <div v-if="isExecuting" class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div class="stat bg-base-100 rounded-lg p-3">
          <div class="stat-title text-xs">Nodo Actual</div>
          <div class="stat-value text-sm">{{ currentNode }}</div>
          <div class="stat-desc text-xs">{{ currentNodeType }}</div>
        </div>

        <div class="stat bg-base-100 rounded-lg p-3">
          <div class="stat-title text-xs">Tiempo Transcurrido</div>
          <div class="stat-value text-sm">{{ elapsedTime }}</div>
          <div class="stat-desc text-xs">Estimado: {{ estimatedTime }}</div>
        </div>

        <div class="stat bg-base-100 rounded-lg p-3">
          <div class="stat-title text-xs">Nodos Completados</div>
          <div class="stat-value text-sm">{{ completedNodes }}/{{ totalNodes }}</div>
          <div class="stat-desc text-xs">{{ Math.round((completedNodes / totalNodes) * 100) }}% completado</div>
        </div>
      </div>

      <!-- Logs en tiempo real -->
      <div class="bg-base-300 rounded-lg p-4 h-64 overflow-y-auto">
        <div class="flex items-center justify-between mb-2">
          <h5 class="font-semibold text-sm">Logs de Ejecución</h5>
          <button class="btn btn-ghost btn-xs" @click="clearLogs">
            <span class="mdi mdi-delete-sweep"></span>
            Limpiar
          </button>
        </div>

        <div class="space-y-1 text-xs font-mono">
          <div v-for="log in logs" :key="log.id" class="flex items-start space-x-2 p-1 rounded"
            :class="getLogClass(log.level)">
            <span class="text-xs opacity-70 min-w-[60px]">{{ formatTime(log.timestamp) }}</span>
            <span class="font-semibold min-w-[50px]" :class="getLevelClass(log.level)">
              [{{ log.level.toUpperCase() }}]
            </span>
            <span class="flex-1">{{ log.message }}</span>
          </div>

          <!-- Indicador de scroll -->
          <div v-if="logs.length === 0" class="text-center text-base-content/50 py-8">
            {{ isExecuting ? 'Esperando logs...' : 'No hay ejecución activa' }}
          </div>
        </div>
      </div>

      <!-- Controles de Ejecución -->
      <div v-if="isExecuting" class="flex justify-end space-x-2 mt-4">
        <button class="btn btn-error btn-sm" @click="$emit('stop-execution')">
          <span class="mdi mdi-stop mr-1"></span>
          Detener
        </button>
        <button class="btn btn-warning btn-sm" @click="$emit('pause-execution')">
          <span class="mdi mdi-pause mr-1"></span>
          Pausar
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

interface Props {
  isExecuting: boolean
}

interface ExecutionLog {
  id: number
  timestamp: Date
  level: 'info' | 'warning' | 'error' | 'debug'
  message: string
}

const props = defineProps<Props>()

defineEmits<{
  'stop-execution': []
  'pause-execution': []
}>()

const logs = ref<ExecutionLog[]>([])
const autoRefresh = ref(true)
const progress = ref(0)
const currentNode = ref('Webhook Receiver')
const currentNodeType = ref('webhook')
const completedNodes = ref(2)
const totalNodes = ref(5)
const startTime = ref<Date | null>(null)
const elapsedTime = ref('00:00')
const estimatedTime = ref('05:23')

// Simular logs en tiempo real cuando está ejecutando
let logInterval: NodeJS.Timeout | null = null
let timeInterval: NodeJS.Timeout | null = null

const toggleAutoRefresh = () => {
  autoRefresh.value = !autoRefresh.value
}

const clearLogs = () => {
  logs.value = []
}

const getLogClass = (level: string) => {
  switch (level) {
    case 'error': return 'bg-error/10 border-l-2 border-error'
    case 'warning': return 'bg-warning/10 border-l-2 border-warning'
    case 'info': return 'bg-info/10 border-l-2 border-info'
    case 'debug': return 'bg-base-content/5 border-l-2 border-base-content/20'
    default: return ''
  }
}

const getLevelClass = (level: string) => {
  switch (level) {
    case 'error': return 'text-error'
    case 'warning': return 'text-warning'
    case 'info': return 'text-info'
    case 'debug': return 'text-base-content/60'
    default: return ''
  }
}

const formatTime = (timestamp: Date) => {
  return timestamp.toLocaleTimeString('es-ES', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const updateElapsedTime = () => {
  if (startTime.value) {
    const now = new Date()
    const diff = now.getTime() - startTime.value.getTime()
    const minutes = Math.floor(diff / 60000)
    const seconds = Math.floor((diff % 60000) / 1000)
    elapsedTime.value = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }
}

const simulateExecutionProgress = () => {
  // Simular progreso y logs durante la ejecución
  const sampleLogs = [
    { level: 'info', message: 'Iniciando ejecución del workflow...' },
    { level: 'info', message: 'Procesando webhook recibido' },
    { level: 'debug', message: 'Validando payload JSON' },
    { level: 'info', message: 'Ejecutando transformación de datos' },
    { level: 'warning', message: 'Campo opcional "description" no encontrado' },
    { level: 'info', message: 'Conectando con base de datos' },
    { level: 'debug', message: 'Query ejecutada exitosamente' },
    { level: 'info', message: 'Enviando notificación por email' },
    { level: 'error', message: 'Error temporal en servicio de email' },
    { level: 'info', message: 'Reintentando envío de notificación...' },
    { level: 'info', message: 'Notificación enviada exitosamente' },
  ]

  let logIndex = 0

  logInterval = setInterval(() => {
    if (logIndex < sampleLogs.length) {
      const logEntry = sampleLogs[logIndex]
      logs.value.push({
        id: Date.now() + Math.random(),
        timestamp: new Date(),
        level: logEntry.level as any,
        message: logEntry.message
      })

      // Auto scroll to bottom
      setTimeout(() => {
        const logContainer = document.querySelector('.overflow-y-auto')
        if (logContainer) {
          logContainer.scrollTop = logContainer.scrollHeight
        }
      }, 100)

      // Actualizar progreso
      progress.value = Math.min(95, (logIndex / sampleLogs.length) * 100)
      completedNodes.value = Math.floor((logIndex / sampleLogs.length) * totalNodes.value)

      logIndex++
    }
  }, 1500)
}

watch(() => props.isExecuting, (isExecuting) => {
  if (isExecuting) {
    startTime.value = new Date()
    progress.value = 0
    completedNodes.value = 0
    logs.value = []

    if (autoRefresh.value) {
      simulateExecutionProgress()
    }

    timeInterval = setInterval(updateElapsedTime, 1000)
  } else {
    if (logInterval) {
      clearInterval(logInterval)
      logInterval = null
    }
    if (timeInterval) {
      clearInterval(timeInterval)
      timeInterval = null
    }
    startTime.value = null
    progress.value = 0
  }
})

onUnmounted(() => {
  if (logInterval) clearInterval(logInterval)
  if (timeInterval) clearInterval(timeInterval)
})
</script>

<style scoped>
.font-mono {
  font-family: 'Courier New', monospace;
}

.overflow-y-auto::-webkit-scrollbar {
  width: 4px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: var(--fallback-bc, oklch(var(--bc) / 0.3));
  border-radius: 2px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: var(--fallback-bc, oklch(var(--bc) / 0.5));
}
</style>
