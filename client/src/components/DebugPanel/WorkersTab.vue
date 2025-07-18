<template>
  <div class="h-full flex flex-col">
    <!-- Workers Header -->
    <div class="flex items-center justify-between p-3 border-b border-base-300 bg-base-50">
      <div class="flex items-center space-x-4">
        <h3 class="font-semibold text-sm">Estado de Workers</h3>

        <!-- Status Summary -->
        <div class="flex items-center space-x-3 text-xs">
          <div class="flex items-center space-x-1">
            <div class="w-2 h-2 bg-success rounded-full"></div>
            <span>{{ activeCount }} activos</span>
          </div>
          <div class="flex items-center space-x-1">
            <div class="w-2 h-2 bg-warning rounded-full"></div>
            <span>{{ idleCount }} inactivos</span>
          </div>
          <div class="flex items-center space-x-1">
            <div class="w-2 h-2 bg-error rounded-full"></div>
            <span>{{ errorCount }} con error</span>
          </div>
        </div>
      </div>

      <div class="flex items-center space-x-2">
        <!-- Refresh button -->
        <button @click="refreshWorkers" class="btn btn-xs btn-ghost" :disabled="isRefreshing">
          <svg class="w-3 h-3" :class="{ 'animate-spin': isRefreshing }" fill="none" stroke="currentColor"
            viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>

        <!-- Auto-refresh toggle -->
        <div class="form-control">
          <label class="cursor-pointer label py-0">
            <input v-model="autoRefresh" type="checkbox" class="toggle toggle-xs" @change="toggleAutoRefresh" />
            <span class="label-text text-xs ml-2">Auto</span>
          </label>
        </div>
      </div>
    </div>

    <!-- Workers Content -->
    <div class="flex-1 overflow-y-auto">
      <!-- Overall Stats -->
      <div class="p-4 border-b border-base-200 bg-base-50">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="text-center">
            <div class="text-lg font-bold text-primary">{{ debugStore.activeWorkers }}</div>
            <div class="text-xs text-base-content/60">Workers Activos</div>
          </div>
          <div class="text-center">
            <div class="text-lg font-bold text-info">{{ debugStore.avgCpuUsage.toFixed(1) }}%</div>
            <div class="text-xs text-base-content/60">CPU Promedio</div>
          </div>
          <div class="text-center">
            <div class="text-lg font-bold text-warning">{{ debugStore.totalMemoryUsage.toFixed(1) }}MB</div>
            <div class="text-xs text-base-content/60">RAM Total</div>
          </div>
          <div class="text-center">
            <div class="text-lg font-bold text-success">{{ totalTasksCompleted }}</div>
            <div class="text-xs text-base-content/60">Tareas Completadas</div>
          </div>
        </div>
      </div>

      <!-- Workers List -->
      <div v-if="debugStore.workerStats.length === 0" class="p-8 text-center text-base-content/60">
        <svg class="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 7.172V5L8 4z" />
        </svg>
        <p>No hay workers disponibles</p>
      </div>

      <div v-else class="p-4 space-y-3">
        <div v-for="worker in debugStore.workerStats" :key="worker.id"
          class="bg-base-100 border border-base-200 rounded-lg p-4 hover:border-base-300 transition-colors">
          <!-- Worker Header -->
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center space-x-3">
              <div class="w-3 h-3 rounded-full" :class="getStatusColor(worker.status)"></div>
              <h4 class="font-medium text-sm">{{ worker.name }}</h4>
              <span class="badge badge-xs" :class="getStatusBadge(worker.status)">
                {{ worker.status }}
              </span>
            </div>

            <div class="text-xs text-base-content/60">
              Uptime: {{ formatUptime(worker.uptime) }}
            </div>
          </div>

          <!-- Worker Stats -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            <div class="text-center bg-base-200 rounded p-2">
              <div class="text-sm font-bold" :class="getCpuColor(worker.cpuUsage)">
                {{ worker.cpuUsage.toFixed(1) }}%
              </div>
              <div class="text-xs text-base-content/60">CPU</div>
            </div>

            <div class="text-center bg-base-200 rounded p-2">
              <div class="text-sm font-bold text-info">
                {{ worker.memoryUsage.toFixed(1) }}MB
              </div>
              <div class="text-xs text-base-content/60">RAM</div>
            </div>

            <div class="text-center bg-base-200 rounded p-2">
              <div class="text-sm font-bold text-success">
                {{ worker.tasksCompleted }}
              </div>
              <div class="text-xs text-base-content/60">Completadas</div>
            </div>

            <div class="text-center bg-base-200 rounded p-2">
              <div class="text-sm font-bold text-warning">
                {{ worker.tasksRunning }}
              </div>
              <div class="text-xs text-base-content/60">En ejecución</div>
            </div>
          </div>

          <!-- Progress Bars -->
          <div class="space-y-2">
            <div>
              <div class="flex justify-between text-xs mb-1">
                <span>CPU Usage</span>
                <span>{{ worker.cpuUsage.toFixed(1) }}%</span>
              </div>
              <div class="w-full bg-base-300 rounded-full h-2">
                <div class="h-2 rounded-full transition-all duration-500" :class="getCpuProgressColor(worker.cpuUsage)"
                  :style="{ width: Math.min(worker.cpuUsage, 100) + '%' }"></div>
              </div>
            </div>

            <div>
              <div class="flex justify-between text-xs mb-1">
                <span>Memory Usage</span>
                <span>{{ worker.memoryUsage.toFixed(1) }}MB</span>
              </div>
              <div class="w-full bg-base-300 rounded-full h-2">
                <div class="h-2 rounded-full bg-info transition-all duration-500"
                  :style="{ width: Math.min((worker.memoryUsage / 200) * 100, 100) + '%' }"></div>
              </div>
            </div>
          </div>

          <!-- Last Activity -->
          <div class="mt-3 text-xs text-base-content/60">
            Última actividad: {{ formatLastActivity(worker.lastActivity) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useDebugConsoleStore, type WorkerStat } from '@/stores/debugConsole'

const debugStore = useDebugConsoleStore()
const isRefreshing = ref(false)
const autoRefresh = ref(true)
const refreshInterval = ref<NodeJS.Timeout | null>(null)

const activeCount = computed(() =>
  debugStore.workerStats.filter(w => w.status === 'active').length
)

const idleCount = computed(() =>
  debugStore.workerStats.filter(w => w.status === 'idle').length
)

const errorCount = computed(() =>
  debugStore.workerStats.filter(w => w.status === 'error').length
)

const totalTasksCompleted = computed(() =>
  debugStore.workerStats.reduce((total, worker) => total + worker.tasksCompleted, 0)
)

const getStatusColor = (status: WorkerStat['status']) => {
  switch (status) {
    case 'active': return 'bg-success'
    case 'idle': return 'bg-warning'
    case 'error': return 'bg-error'
    case 'stopped': return 'bg-base-300'
    default: return 'bg-base-300'
  }
}

const getStatusBadge = (status: WorkerStat['status']) => {
  switch (status) {
    case 'active': return 'badge-success'
    case 'idle': return 'badge-warning'
    case 'error': return 'badge-error'
    case 'stopped': return 'badge-ghost'
    default: return 'badge-ghost'
  }
}

const getCpuColor = (usage: number) => {
  if (usage < 30) return 'text-success'
  if (usage < 70) return 'text-warning'
  return 'text-error'
}

const getCpuProgressColor = (usage: number) => {
  if (usage < 30) return 'bg-success'
  if (usage < 70) return 'bg-warning'
  return 'bg-error'
}

const formatUptime = (uptime: number) => {
  const hours = Math.floor(uptime / 3600000)
  const minutes = Math.floor((uptime % 3600000) / 60000)
  const seconds = Math.floor((uptime % 60000) / 1000)

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`
  }
  return `${seconds}s`
}

const formatLastActivity = (date: Date) => {
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  if (diff < 60000) {
    return 'Hace menos de 1 minuto'
  }
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000)
    return `Hace ${minutes} minuto${minutes > 1 ? 's' : ''}`
  }
  const hours = Math.floor(diff / 3600000)
  return `Hace ${hours} hora${hours > 1 ? 's' : ''}`
}

const refreshWorkers = async () => {
  isRefreshing.value = true

  // Simular actualización de datos
  setTimeout(() => {
    // Actualizar algunos valores aleatoriamente
    const updatedWorkers = debugStore.workerStats.map(worker => ({
      ...worker,
      cpuUsage: Math.max(0, worker.cpuUsage + (Math.random() - 0.5) * 10),
      memoryUsage: Math.max(0, worker.memoryUsage + (Math.random() - 0.5) * 5),
      tasksCompleted: worker.tasksCompleted + Math.floor(Math.random() * 3),
      lastActivity: new Date()
    }))

    debugStore.updateWorkerStats(updatedWorkers)
    isRefreshing.value = false
  }, 1000)
}

const toggleAutoRefresh = () => {
  if (autoRefresh.value) {
    startAutoRefresh()
  } else {
    stopAutoRefresh()
  }
}

const startAutoRefresh = () => {
  if (refreshInterval.value) return

  refreshInterval.value = setInterval(() => {
    refreshWorkers()
  }, 5000)
}

const stopAutoRefresh = () => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value)
    refreshInterval.value = null
  }
}

onMounted(() => {
  if (autoRefresh.value) {
    startAutoRefresh()
  }
})

onUnmounted(() => {
  stopAutoRefresh()
})
</script>
