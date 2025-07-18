<!--
  Workers Dashboard Component
  
  Provides a comprehensive view of active workflow execution workers including:
  - Real-time worker status and metrics
  - Memory and CPU usage monitoring
  - Worker lifecycle management (start, stop, restart)
  - Workflow distribution across workers
  - Performance analytics and alerts
-->

<template>
  <div>
    <!-- Control Buttons -->
    <div class="flex gap-4 mb-6">
      <button @click="refreshDashboard" class="btn btn-primary" :disabled="loading">
        <span v-if="loading" class="loading loading-spinner loading-sm"></span>
        <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15">
          </path>
        </svg>
        Actualizar
      </button>
      <button @click="toggleAutoRefresh" class="btn" :class="autoRefresh ? 'btn-success' : 'btn-outline'">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        Auto-actualizar {{ autoRefresh ? 'ON' : 'OFF' }}
      </button>
    </div>

    <!-- Overview Cards -->
    <div v-if="!loading || dashboardData.overview" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div class="card bg-base-200 shadow-xl backdrop-blur-sm border border-base-300">
        <div class="card-body">
          <div class="flex items-center">
            <div class="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-content">
              <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd"
                  d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L7.586 10 5.293 7.707a1 1 0 010-1.414zM11 12a1 1 0 100 2h3a1 1 0 100-2h-3z"
                  clip-rule="evenodd"></path>
              </svg>
            </div>
            <div class="ml-4">
              <h3 class="text-2xl font-bold">{{ dashboardData.overview?.totalActive || 0 }}</h3>
              <p class="text-base-content/70 text-sm">Workers Activos</p>
            </div>
          </div>
        </div>
      </div>

      <div class="card bg-base-200 shadow-xl backdrop-blur-sm border border-base-300">
        <div class="card-body">
          <div class="flex items-center">
            <div class="w-12 h-12 rounded-full bg-success flex items-center justify-center text-success-content">
              <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                  clip-rule="evenodd"></path>
              </svg>
            </div>
            <div class="ml-4">
              <h3 class="text-2xl font-bold">{{ dashboardData.overview?.running || 0 }}</h3>
              <p class="text-base-content/70 text-sm">Ejecutándose</p>
            </div>
          </div>
        </div>
      </div>

      <div class="card bg-base-200 shadow-xl backdrop-blur-sm border border-base-300">
        <div class="card-body">
          <div class="flex items-center">
            <div class="w-12 h-12 rounded-full bg-error flex items-center justify-center text-error-content">
              <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clip-rule="evenodd"></path>
              </svg>
            </div>
            <div class="ml-4">
              <h3 class="text-2xl font-bold">{{ dashboardData.overview?.errors || 0 }}</h3>
              <p class="text-base-content/70 text-sm">Con Errores</p>
            </div>
          </div>
        </div>
      </div>

      <div class="card bg-base-200 shadow-xl backdrop-blur-sm border border-base-300">
        <div class="card-body">
          <div class="flex items-center">
            <div class="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-secondary-content">
              <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z">
                </path>
              </svg>
            </div>
            <div class="ml-4">
              <h3 class="text-2xl font-bold">{{ formatBytes(dashboardData.performance?.totalMemoryUsage || 0) }}</h3>
              <p class="text-base-content/70 text-sm">Memoria Total</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading && !dashboardData.overview" class="flex flex-col items-center justify-center py-16">
      <span class="loading loading-spinner loading-lg text-primary"></span>
      <p class="text-base-content/70 mt-4">Cargando dashboard de workers...</p>
    </div>

    <!-- Error State -->
    <div v-if="!loading && !dashboardData.overview && activeWorkers.length === 0"
      class="flex flex-col items-center justify-center py-16 text-center">
      <div class="w-24 h-24 bg-error/10 rounded-full flex items-center justify-center mb-4">
        <svg class="w-12 h-12 text-error" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
            clip-rule="evenodd"></path>
        </svg>
      </div>
      <h3 class="text-xl font-semibold mb-2">No se pudo cargar el dashboard</h3>
      <p class="text-base-content/70 mb-4">Verifique que el servidor esté ejecutándose y que tenga permisos para acceder
        al dashboard de workers.</p>
      <button @click="refreshDashboard" class="btn btn-primary">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15">
          </path>
        </svg>
        Reintentar
      </button>
    </div>

    <!-- Active Workers Table -->
    <div v-if="!loading || activeWorkers.length > 0"
      class="card bg-base-200 shadow-xl backdrop-blur-sm border border-base-300">
      <div class="card-body">
        <h3 class="card-title text-lg mb-4">Workers Activos</h3>
        <div class="overflow-x-auto">
          <table class="table table-zebra">
            <thead>
              <tr>
                <th>ID</th>
                <th>Workflow</th>
                <th>Estado</th>
                <th>Puerto</th>
                <th>Tiempo Activo</th>
                <th>Memoria</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="worker in activeWorkers" :key="worker.id">
                <td>
                  <code class="text-xs bg-base-300 px-2 py-1 rounded">{{ worker.id.substring(0, 8) }}...</code>
                </td>
                <td>
                  <span class="badge badge-outline">{{ worker.workflowId }}</span>
                </td>
                <td>
                  <span class="badge" :class="{
                    'badge-success': worker.status === 'running',
                    'badge-warning': worker.status === 'starting' || worker.status === 'stopping',
                    'badge-error': worker.status === 'error',
                    'badge-ghost': worker.status === 'stopped'
                  }">
                    {{ getStatusText(worker.status) }}
                  </span>
                </td>
                <td>
                  <code class="text-xs">{{ worker.port }}</code>
                </td>
                <td>
                  <span class="text-sm">{{ formatUptime(worker.startTime) }}</span>
                </td>
                <td>
                  <span class="text-sm">{{ formatBytes(worker.memoryUsage || 0) }}</span>
                </td>
                <td>
                  <div class="flex gap-1">
                    <button @click="sendMessageToWorker(worker.id)" class="btn btn-xs btn-info" title="Enviar Mensaje">
                      <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path>
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path>
                      </svg>
                    </button>
                    <button @click="restartWorker(worker.id)" class="btn btn-xs btn-warning" title="Reiniciar">
                      <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd"
                          d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                          clip-rule="evenodd"></path>
                      </svg>
                    </button>
                    <button @click="stopWorker(worker.id)" class="btn btn-xs btn-error" title="Detener">
                      <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z"
                          clip-rule="evenodd"></path>
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <div v-if="activeWorkers.length === 0" class="flex flex-col items-center justify-center py-16 text-center">
            <div class="w-24 h-24 bg-base-300 rounded-full flex items-center justify-center mb-4">
              <svg class="w-12 h-12 opacity-50" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd"
                  d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L7.586 10 5.293 7.707a1 1 0 010-1.414zM11 12a1 1 0 100 2h3a1 1 0 100-2h-3z"
                  clip-rule="evenodd"></path>
              </svg>
            </div>
            <h3 class="text-xl font-semibold mb-2">No hay workers activos</h3>
          </div>
        </div>
      </div>

      <!-- Workflow Distribution -->
      <div
        v-if="(!loading || dashboardData.workflows?.distribution) && Object.keys(dashboardData.workflows?.distribution || {}).length > 0"
        class="distribution-section">
        <h3>Distribución por Workflow</h3>
        <div class="workflow-distribution">
          <div v-for="(workflow, workflowId) in dashboardData.workflows?.distribution" :key="workflowId"
            class="workflow-item">
            <div class="workflow-header">
              <h4>{{ workflowId }}</h4>
              <span class="worker-count">{{ workflow.count }} workers</span>
            </div>
            <div class="workflow-workers">
              <div v-for="worker in workflow.workers" :key="worker.id" class="worker-chip" :class="worker.status">
                <span class="worker-port">:{{ worker.port }}</span>
                <span class="worker-status">{{ worker.status }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Performance Alerts -->
      <div v-if="dashboardData.performance?.highMemoryWorkers?.length > 0" class="alerts-section">
        <h3>Alertas de Rendimiento</h3>
        <div class="alert alert-warning">
          <i class="icon-alert"></i>
          <div>
            <strong>Alto uso de memoria detectado</strong>
            <p>{{ dashboardData.performance.highMemoryWorkers.length }} workers están usando más de 100MB de memoria</p>
            <ul>
              <li v-for="worker in dashboardData.performance.highMemoryWorkers" :key="worker.id">
                Worker {{ worker.id.substring(0, 8) }} ({{ formatBytes(worker.memoryUsage) }}) en puerto {{ worker.port
                }}
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Recent Activity -->
      <div
        v-if="(!loading || dashboardData.recentActivity?.recentWorkers) && dashboardData.recentActivity?.recentWorkers?.length > 0"
        class="activity-section">
        <h3>Actividad Reciente</h3>
        <div class="recent-activity">
          <div v-for="worker in dashboardData.recentActivity?.recentWorkers" :key="worker.id" class="activity-item">
            <div class="activity-icon" :class="worker.status">
              <i class="icon-server"></i>
            </div>
            <div class="activity-content">
              <p><strong>Worker {{ worker.id.substring(0, 8) }}</strong> iniciado para workflow {{ worker.workflowId }}
              </p>
              <span class="activity-time">{{ formatTime(worker.startTime) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Send Message Modal -->
      <div v-if="showMessageModal" class="modal-overlay" @click="closeMessageModal">
        <div class="modal" @click.stop>
          <div class="modal-header">
            <h3>Enviar Mensaje al Worker</h3>
            <button @click="closeMessageModal" class="btn-close">&times;</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Ruta:</label>
              <select v-model="messageForm.route">
                <option value="nodes:list">nodes:list</option>
                <option value="nodes:get">nodes:get</option>
                <option value="system:health">system:health</option>
                <option value="worker:status">worker:status</option>
              </select>
            </div>
            <div class="form-group">
              <label>Datos (JSON):</label>
              <textarea v-model="messageForm.data" rows="4" placeholder='{"key": "value"}'></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button @click="closeMessageModal" class="btn btn-secondary">Cancelar</button>
            <button @click="sendMessage" class="btn btn-primary">Enviar</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import socket from '@/services/socket'

interface WorkerInfo {
  id: string
  workflowId: string
  processId: number
  port: number
  status: 'starting' | 'running' | 'stopping' | 'stopped' | 'error'
  startTime: string
  lastActivity: string
  executionId?: string
  version?: string
  memoryUsage?: number
}

interface DashboardData {
  overview: {
    totalActive: number
    running: number
    errors: number
    starting: number
  }
  recentActivity: {
    workersStartedToday: number
    recentWorkers: WorkerInfo[]
  }
  performance: {
    totalMemoryUsage: number
    averageMemoryPerWorker: number
    highMemoryWorkers: Array<{
      id: string
      workflowId: string
      memoryUsage: number
      port: number
    }>
  }
  workflows: {
    distribution: Record<string, {
      workflowId: string
      count: number
      workers: Array<{
        id: string
        status: string
        port: number
        startTime: string
      }>
    }>
  }
}

const dashboardData = ref<DashboardData>({
  overview: { totalActive: 0, running: 0, errors: 0, starting: 0 },
  recentActivity: { workersStartedToday: 0, recentWorkers: [] },
  performance: { totalMemoryUsage: 0, averageMemoryPerWorker: 0, highMemoryWorkers: [] },
  workflows: { distribution: {} }
})

const activeWorkers = ref<WorkerInfo[]>([])
const loading = ref(false)
const autoRefresh = ref(true)
const refreshInterval = ref<NodeJS.Timeout | null>(null)

const showMessageModal = ref(false)
const selectedWorkerId = ref('')
const messageForm = ref({
  route: 'nodes:list',
  data: '{}'
})

onMounted(() => {
  refreshDashboard()
  setupAutoRefresh()

  // Listen for real-time worker updates
  const socketInstance = socket.getSocket()
  if (socketInstance) {
    socketInstance.on('workers:created', handleWorkerCreated)
    socketInstance.on('workers:stopped', handleWorkerStopped)
    socketInstance.on('workers:restarted', handleWorkerRestarted)
  }
})

onUnmounted(() => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value)
  }

  const socketInstance = socket.getSocket()
  if (socketInstance) {
    socketInstance.off('workers:created', handleWorkerCreated)
    socketInstance.off('workers:stopped', handleWorkerStopped)
    socketInstance.off('workers:restarted', handleWorkerRestarted)
  }
})

const refreshDashboard = async () => {
  if (loading.value) return

  loading.value = true
  try {
    const socketInstance = socket.getSocket()
    if (!socketInstance) {
      console.error('Socket not connected')
      return
    }

    // Get dashboard data
    const dashboardResponse = await new Promise((resolve) => {
      socketInstance.emit('workers:dashboard', {}, resolve)
    }) as any

    if (dashboardResponse.success) {
      dashboardData.value = dashboardResponse.dashboard
    }

    // Get active workers list
    const workersResponse = await new Promise((resolve) => {
      socketInstance.emit('workers:list', {}, resolve)
    }) as any

    if (workersResponse.success) {
      activeWorkers.value = workersResponse.workers
    }
  } catch (error) {
    console.error('Error refreshing dashboard:', error)
  } finally {
    loading.value = false
  }
}

const setupAutoRefresh = () => {
  if (autoRefresh.value) {
    refreshInterval.value = setInterval(refreshDashboard, 5000) // Every 5 seconds
  }
}

const toggleAutoRefresh = () => {
  autoRefresh.value = !autoRefresh.value

  if (refreshInterval.value) {
    clearInterval(refreshInterval.value)
    refreshInterval.value = null
  }

  if (autoRefresh.value) {
    setupAutoRefresh()
  }
}

const stopWorker = async (workerId: string) => {
  if (!confirm('¿Estás seguro de que quieres detener este worker?')) return

  try {
    const socketInstance = socket.getSocket()
    if (!socketInstance) {
      alert('Socket no conectado')
      return
    }

    const response = await new Promise((resolve) => {
      socketInstance.emit('workers:stop', { workerId }, resolve)
    }) as any

    if (response.success) {
      refreshDashboard()
    } else {
      alert(`Error deteniendo worker: ${response.message}`)
    }
  } catch (error) {
    console.error('Error stopping worker:', error)
    alert('Error deteniendo worker')
  }
}

const restartWorker = async (workerId: string) => {
  if (!confirm('¿Estás seguro de que quieres reiniciar este worker?')) return

  try {
    const socketInstance = socket.getSocket()
    if (!socketInstance) {
      alert('Socket no conectado')
      return
    }

    const response = await new Promise((resolve) => {
      socketInstance.emit('workers:restart', { workerId }, resolve)
    }) as any

    if (response.success) {
      refreshDashboard()
    } else {
      alert(`Error reiniciando worker: ${response.message}`)
    }
  } catch (error) {
    console.error('Error restarting worker:', error)
    alert('Error reiniciando worker')
  }
}

const sendMessageToWorker = (workerId: string) => {
  selectedWorkerId.value = workerId
  showMessageModal.value = true
}

const closeMessageModal = () => {
  showMessageModal.value = false
  selectedWorkerId.value = ''
  messageForm.value = { route: 'nodes:list', data: '{}' }
}

const sendMessage = async () => {
  try {
    const data = JSON.parse(messageForm.value.data)
    const socketInstance = socket.getSocket()
    if (!socketInstance) {
      alert('Socket no conectado')
      return
    }

    const response = await new Promise((resolve) => {
      socketInstance.emit('workers:send-message', {
        workerId: selectedWorkerId.value,
        route: messageForm.value.route,
        messageData: data
      }, resolve)
    }) as any

    if (response.success) {
      alert(`Mensaje enviado exitosamente:\n${JSON.stringify(response.response, null, 2)}`)
    } else {
      alert(`Error enviando mensaje: ${response.message}`)
    }
  } catch (error) {
    alert('Error en formato JSON o enviando mensaje')
  }

  closeMessageModal()
}

// Event handlers for real-time updates
const handleWorkerCreated = (data: any) => {
  refreshDashboard()
}

const handleWorkerStopped = (data: any) => {
  refreshDashboard()
}

const handleWorkerRestarted = (data: any) => {
  refreshDashboard()
}

// Utility functions
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`
}

const formatUptime = (startTime: string): string => {
  const now = new Date()
  const start = new Date(startTime)
  const diff = now.getTime() - start.getTime()

  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}d ${hours % 24}h`
  if (hours > 0) return `${hours}h ${minutes % 60}m`
  return `${minutes}m`
}

const formatTime = (timestamp: string): string => {
  return new Date(timestamp).toLocaleString()
}

const getStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    'starting': 'Iniciando',
    'running': 'Ejecutando',
    'stopping': 'Deteniendo',
    'stopped': 'Detenido',
    'error': 'Error'
  }
  return statusMap[status] || status
}

const getWorkerRowClass = (worker: WorkerInfo): string => {
  return `worker-row status-${worker.status}`
}
</script>

<style scoped>
/* Estilos mínimos complementarios para DaisyUI */
.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}
</style>
