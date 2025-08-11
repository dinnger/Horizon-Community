<template>
  <div class="p-8 bg-base-100 min-h-screen">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="flex items-center space-x-4 mb-8">
        <button @click="$router.go(-1)" class="btn btn-ghost btn-circle">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <div class="flex-1">
          <div class="flex items-center space-x-3">
            <h1 class="text-3xl font-bold text-primary">{{ workflow?.name }}</h1>
            <div :class="['badge badge-lg', getStatusBadge(workflow?.status || '')]">
              {{ workflow?.status }}
            </div>
          </div>
          <p class="text-base-content/70 mt-1">{{ workflow?.description }}</p>
          <div class="flex items-center space-x-4 mt-2 text-sm text-base-content/60">
            <span>Proyecto: {{ (project as any)?.name || 'Cargando...' }}</span>
            <span>•</span>
            <span>Última ejecución: {{ workflow ? formatDate(workflow.lastRun) : 'N/A' }}</span>
            <span>•</span>
            <span>Duración: {{ workflow?.duration || 'N/A' }}</span>
          </div>
        </div>
        <div class="flex space-x-2">
          <button @click="runWorkflow" :disabled="workflow?.status === 'running'"
            :class="['btn', workflow?.status === 'running' ? 'btn-disabled' : 'btn-primary']">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m-6-8h1m4 0h1M9 18h6" />
            </svg>
            {{ workflow?.status === 'running' ? 'Ejecutando...' : 'Ejecutar' }}
          </button>
          <button @click="editWorkflow" class="btn btn-secondary">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Editar
          </button>
        </div>
      </div> <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="stat bg-base-200 rounded-box shadow-lg stat-hover">
          <div class="stat-figure text-primary">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div class="stat-title">Ejecuciones Totales</div>
          <div class="stat-value text-primary">{{ workflowStats.totalExecutions }}</div>
          <div class="stat-desc">{{ workflowStats.executionsThisWeek }} esta semana</div>
        </div>

        <div class="stat bg-base-200 rounded-box shadow-lg stat-hover">
          <div class="stat-figure text-success">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="stat-title">Tasa de Éxito</div>
          <div class="stat-value text-success">{{ workflowStats.successRate }}%</div>
          <div class="stat-desc">{{ workflowStats.successCount }} exitosas</div>
        </div>

        <div class="stat bg-base-200 rounded-box shadow-lg stat-hover">
          <div class="stat-figure text-info">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="stat-title">Tiempo Promedio</div>
          <div class="stat-value text-info">{{ workflowStats.avgDuration }}</div>
          <div class="stat-desc">Por ejecución</div>
        </div>

        <div class="stat bg-base-200 rounded-box shadow-lg stat-hover">
          <div class="stat-figure text-warning">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div class="stat-title">Fallos</div>
          <div class="stat-value text-warning">{{ workflowStats.failureCount }}</div>
          <div class="stat-desc">{{ workflowStats.failureRate }}% tasa de fallo</div>
        </div>
      </div>

      <!-- Tabs Navigation -->
      <div class="tabs tabs-boxed mb-6">
        <a @click="activeTab = 'gantt'" :class="['tab', activeTab === 'gantt' ? 'tab-active' : '']">
          Diagrama de Gantt
        </a>
        <a @click="activeTab = 'logs'" :class="['tab', activeTab === 'logs' ? 'tab-active' : '']">
          Logs
        </a>
        <a @click="activeTab = 'outputs'" :class="['tab', activeTab === 'outputs' ? 'tab-active' : '']">
          Outputs
        </a>
        <a @click="activeTab = 'history'" :class="['tab', activeTab === 'history' ? 'tab-active' : '']">
          Historial
        </a>
      </div>

      <!-- Tab Content -->
      <div class="card bg-base-200 shadow-xl">
        <div class="card-body">
          <!-- Gantt Chart Tab -->
          <div v-if="activeTab === 'gantt'" class="space-y-6">
            <h3 class="text-xl font-bold">Diagrama de Gantt - Última Ejecución</h3>

            <!-- Timeline Header -->
            <div class="overflow-x-auto">
              <div class="min-w-[800px]">
                <!-- Time Scale -->
                <div class="flex items-center mb-4 text-xs text-base-content/60">
                  <div class="w-48"></div>
                  <div class="flex-1 flex">
                    <div v-for="second in timeScale" :key="second"
                      class="flex-1 text-center border-l border-base-300 px-2">
                      {{ second }}s
                    </div>
                  </div>
                </div>

                <!-- Gantt Bars -->
                <div class="space-y-3">
                  <div v-for="node in ganttData" :key="node.id" class="flex items-center">
                    <!-- Node Info -->
                    <div class="w-48 pr-4">
                      <div class="font-semibold text-sm">{{ node.name }}</div>
                      <div class="text-xs text-base-content/60">{{ node.duration }}ms</div>
                    </div>
                    <!-- Timeline Bar -->
                    <div class="flex-1 relative h-8 bg-base-300 rounded gantt-timeline">
                      <div :class="[
                        'absolute h-full rounded transition-all duration-300 gantt-bar',
                        getNodeStatusColor(node.status),
                        { 'running': node.status === 'running' }
                      ]" :style="{
                        left: `${(node.startTime / totalDuration) * 100}%`,
                        width: `${(node.duration / totalDuration) * 100}%`
                      }">
                        <div
                          class="flex items-center justify-center h-full text-xs font-medium text-white relative z-10">
                          {{ node.status === 'running' ? '⚡' : node.status === 'success' ? '✓' : node.status ===
                            'failed' ? '✗' : '⏳' }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Total Duration -->
                <div class="mt-4 p-3 bg-base-300 rounded flex justify-between items-center text-sm">
                  <span class="font-semibold">Duración Total:</span>
                  <span class="badge badge-primary">{{ formatDuration(totalDuration) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Logs Tab -->
          <div v-if="activeTab === 'logs'" class="space-y-4">
            <div class="flex justify-between items-center">
              <h3 class="text-xl font-bold">Logs de Ejecución</h3>
              <div class="flex space-x-2">
                <select v-model="logLevel" class="select select-sm select-bordered">
                  <option value="all">Todos los niveles</option>
                  <option value="error">Solo errores</option>
                  <option value="warning">Advertencias</option>
                  <option value="info">Información</option>
                </select>
                <button @click="refreshLogs" class="btn btn-sm btn-ghost">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            </div>
            <div class="log-terminal p-4 rounded font-mono text-sm max-h-96 overflow-y-auto">
              <div v-for="log in filteredLogs" :key="log.id"
                :class="['flex items-start space-x-3 py-1', getLogColorClass(log.level)]">
                <span class="text-gray-500 text-xs whitespace-nowrap">{{ formatTime(log.timestamp) }}</span>
                <span :class="['px-2 py-1 rounded text-xs font-bold', getLogBadgeClass(log.level)]">
                  {{ log.level.toUpperCase() }}
                </span>
                <span class="flex-1">{{ log.message }}</span>
              </div>
            </div>
          </div> <!-- Outputs Tab -->
          <div v-if="activeTab === 'outputs'" class="space-y-6">
            <h3 class="text-xl font-bold">Outputs de Ejecución</h3>

            <!-- Workflow Global Data -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <!-- Global Input Data -->
              <div class="space-y-3">
                <h4 class="font-semibold text-lg flex items-center">
                  <svg class="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M7 11l5-5m0 0l5 5m-5-5v12" />
                  </svg>
                  Entrada Global del Workflow
                </h4>
                <div class="bg-base-300 p-4 rounded">
                  <pre class="text-sm overflow-x-auto">{{ JSON.stringify(executionData.inputs, null, 2) }}</pre>
                </div>
              </div>

              <!-- Global Output Data -->
              <div class="space-y-3">
                <h4 class="font-semibold text-lg flex items-center">
                  <svg class="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                  </svg>
                  Salida Global del Workflow
                </h4>
                <div class="bg-base-300 p-4 rounded">
                  <pre class="text-sm overflow-x-auto">{{ JSON.stringify(executionData.outputs, null, 2) }}</pre>
                </div>
              </div>
            </div>

            <!-- Node Executions -->
            <div class="space-y-4">
              <h4 class="font-semibold text-lg flex items-center">
                <svg class="w-5 h-5 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Ejecución por Nodo
              </h4>

              <div class="space-y-4">
                <div v-for="nodeExecution in executionData.nodeExecutions" :key="nodeExecution.nodeId"
                  class="card bg-base-200 shadow-lg">
                  <div class="card-body p-4">
                    <!-- Node Header -->
                    <div class="flex items-center justify-between mb-4">
                      <div class="flex items-center space-x-3">
                        <div :class="['w-3 h-3 rounded-full', getNodeStatusColor(nodeExecution.status)]"></div>
                        <h5 class="font-bold text-lg">{{ nodeExecution.nodeName }}</h5>
                        <div :class="['badge', getStatusBadge(nodeExecution.status)]">
                          {{ nodeExecution.status }}
                        </div>
                      </div>
                      <div class="text-sm text-base-content/60">
                        Duración: {{ formatDuration(nodeExecution.duration) }}
                      </div>
                    </div>

                    <!-- Node Input/Output -->
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <!-- Node Inputs -->
                      <div class="space-y-2">
                        <h6 class="font-semibold text-sm flex items-center text-blue-600">
                          <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                              d="M7 11l5-5m0 0l5 5m-5-5v12" />
                          </svg>
                          Entrada
                        </h6>
                        <div class="bg-base-300 p-3 rounded text-xs">
                          <pre class="overflow-x-auto">{{ JSON.stringify(nodeExecution.inputs, null, 2) }}</pre>
                        </div>
                      </div>

                      <!-- Node Outputs -->
                      <div class="space-y-2">
                        <h6 class="font-semibold text-sm flex items-center text-green-600">
                          <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                              d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                          </svg>
                          Salida
                        </h6>
                        <div class="bg-base-300 p-3 rounded text-xs">
                          <pre class="overflow-x-auto">{{ JSON.stringify(nodeExecution.outputs, null, 2) }}</pre>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Additional Data -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
              <!-- Environment Variables -->
              <div class="space-y-3">
                <h4 class="font-semibold text-lg flex items-center">
                  <svg class="w-5 h-5 mr-2 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Variables de Entorno
                </h4>
                <div class="overflow-x-auto">
                  <table class="table table-sm">
                    <thead>
                      <tr>
                        <th>Variable</th>
                        <th>Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(value, key) in executionData.environment" :key="key">
                        <td class="font-mono text-sm">{{ key }}</td>
                        <td class="font-mono text-sm">{{ value }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Artifacts -->
              <div class="space-y-3">
                <h4 class="font-semibold text-lg flex items-center">
                  <svg class="w-5 h-5 mr-2 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  Artefactos Generados
                </h4>
                <div class="space-y-2">
                  <div v-for="artifact in executionData.artifacts" :key="artifact.id"
                    class="flex items-center justify-between p-3 bg-base-300 rounded">
                    <div class="flex items-center space-x-3">
                      <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <div>
                        <div class="font-semibold">{{ artifact.name }}</div>
                        <div class="text-xs text-base-content/60">{{ formatFileSize(artifact.size) }} • {{ artifact.type
                          }}</div>
                      </div>
                    </div>
                    <button class="btn btn-xs btn-primary">Descargar</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- History Tab -->
          <div v-if="activeTab === 'history'" class="space-y-4">
            <h3 class="text-xl font-bold">Historial de Ejecuciones</h3>

            <div class="overflow-x-auto">
              <table class="table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Estado</th>
                    <th>Duración</th>
                    <th>Trigger</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="execution in executionHistory" :key="execution.id" class="hover">
                    <td>{{ formatDate(execution.timestamp) }}</td>
                    <td>
                      <div :class="['badge', getStatusBadge(execution.status)]">
                        {{ execution.status }}
                      </div>
                    </td>
                    <td>{{ execution.duration }}</td>
                    <td>{{ execution.trigger }}</td>
                    <td>
                      <div class="flex space-x-2">
                        <button @click="viewExecution(execution)" class="btn btn-xs btn-ghost">
                          Ver Detalles
                        </button>
                        <button @click="downloadLogs(execution)" class="btn btn-xs btn-primary">
                          Logs
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useWorkflowDetailStore } from '@/stores/workflowDetail'
import { storeToRefs } from 'pinia'
import type { Log, ExecutionHistoryItem, NodeExecution } from '@/stores/workflowDetail'
import { useProjectWorkflows } from '@/composables/useProjectWorkflows'

const route = useRoute()
const router = useRouter()

const workflowDetailStore = useWorkflowDetailStore()

const {
  workflow,
  workflowStats,
  ganttData,
  totalDuration,
  logs,
  executionData,
  executionHistory,
  loading,
  error,
  timeScale
} = storeToRefs(workflowDetailStore)

const { fetchWorkflowDetails, getNodeStatusColor } = workflowDetailStore

const activeTab = ref('gantt')
const logLevel = ref('all')

// IDs from route
const projectId = computed(() => route.params.projectId as string)
const workflowId = computed(() => route.params.workflowId as string)

const projectComposable = useProjectWorkflows({ projectId: projectId.value })

// Data
const project = computed(() => projectComposable.getProjectById())

onMounted(() => {
  projectComposable.workflows.loadWorkflows()
  fetchWorkflowDetails(workflowId.value)
})

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'running':
      return 'badge-info'
    case 'success':
      return 'badge-success'
    case 'failed':
      return 'badge-error'
    case 'pending':
      return 'badge-warning'
    default:
      return 'badge-ghost'
  }
}

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date)
}

const formatTime = (date: Date) => {
  return new Intl.DateTimeFormat('es-ES', {
    timeStyle: 'medium'
  }).format(date)
}

const runWorkflow = () => {
  // Lógica para ejecutar el workflow
  console.log('Running workflow...')
}

const editWorkflow = () => {
  router.push(`/projects/${projectId.value}/workflows/${workflowId.value}/edit`)
}

const formatDuration = (ms: number) => {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`
}

const refreshLogs = () => {
  console.log('Refreshing logs...')
  // Aquí se podría llamar a una acción del store para recargar los logs
}

const filteredLogs = computed(() => {
  if (logLevel.value === 'all') {
    return logs.value
  }
  return logs.value.filter((log: Log) => log.level === logLevel.value)
})

const getLogColorClass = (level: string) => {
  switch (level) {
    case 'error':
      return 'text-red-400'
    case 'warning':
      return 'text-yellow-400'
    default:
      return 'text-base-content/80'
  }
}

const getLogBadgeClass = (level: string) => {
  switch (level) {
    case 'error':
      return 'bg-red-500/20 text-red-400'
    case 'warning':
      return 'bg-yellow-500/20 text-yellow-400'
    default:
      return 'bg-base-300'
  }
}

const viewExecution = (execution: ExecutionHistoryItem) => {
  console.log('Viewing execution:', execution.id)
}

const downloadLogs = (execution: ExecutionHistoryItem) => {
  console.log('Downloading logs for execution:', execution.id)
}
</script>

<style scoped>
.gantt-timeline {
  position: relative;
  background: linear-gradient(90deg, transparent 24px, rgba(255, 255, 255, 0.1) 25px);
}

.gantt-bar {
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.gantt-bar::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  animation: shimmer 2s infinite;
}

.gantt-bar.running::before {
  animation: shimmer 1s infinite;
}

@keyframes shimmer {
  0% {
    left: -100%;
  }

  100% {
    left: 100%;
  }
}

.log-terminal {
  background: #0d1117;
  color: #c9d1d9;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  border-radius: 8px;
  border: 1px solid #30363d;
}

.log-terminal::-webkit-scrollbar {
  width: 8px;
}

.log-terminal::-webkit-scrollbar-track {
  background: #161b22;
}

.log-terminal::-webkit-scrollbar-thumb {
  background: #484f58;
  border-radius: 4px;
}

.log-terminal::-webkit-scrollbar-thumb:hover {
  background: #6e7681;
}

.stat-hover {
  transition: transform 0.2s ease;
}

.stat-hover:hover {
  transform: translateY(-2px);
}
</style>
