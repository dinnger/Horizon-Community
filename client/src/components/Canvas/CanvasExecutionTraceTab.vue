<template>
  <div class="flex flex-col overflow-auto h-full">
    <div ref="traceContainer" class="flex-1 p-3 overflow-y-auto space-y-2 relative">
      <!-- Gráfico de secuencia visual -->
      <div v-for="(nodeGroup, nodeId) in groupedTraces" :key="nodeId" class="relative">
        <!-- Línea de conexión vertical -->
        <div v-if="Object.keys(groupedTraces).indexOf(nodeId) > 0" class="absolute -top-2 left-6 w-0.5 h-2 bg-gray-600">
        </div>

        <!-- Nodo principal -->
        <div @click="toggleNodeDetails(nodeId)"
          class="flex items-center gap-3 p-3 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg cursor-pointer transition-all duration-200 border border-gray-700 hover:border-gray-600">

          <!-- Indicador visual del nodo -->
          <div class="flex-shrink-0">
            <div class="w-3 h-3 rounded-full bg-blue-400 relative">
              <!-- Pulso animado si está activo -->
              <div v-if="nodeGroup.isActive"
                class="absolute inset-0 w-3 h-3 rounded-full bg-blue-400 animate-ping opacity-75">
              </div>
            </div>
          </div>

          <!-- Información del nodo -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-2">
              <span class="text-blue-300 font-semibold text-sm truncate">{{ nodeGroup.name }}</span>
              <span class="text-xs text-gray-400">{{ nodeGroup.connections.length }} conexión(es)</span>

              <!-- Indicador de tiempo con barra visual -->
              <div class="flex items-center gap-1 ml-auto">
                <div class="w-16 h-1 bg-gray-700 rounded-full overflow-hidden">
                  <div class="h-full rounded-full transition-all duration-300"
                    :class="getTimeBarColor(nodeGroup.avgTime)"
                    :style="{ width: `${Math.min(nodeGroup.avgTime / 10, 100)}%` }">
                  </div>
                </div>
                <span class="text-xs text-gray-400">{{ nodeGroup.avgTime }}ms</span>
              </div>
            </div>

            <!-- Métricas resumidas con iconos mejorados -->
            <div class="flex items-center gap-4 text-xs text-gray-400">
              <span class="flex items-center gap-1">
                <span class="mdi mdi-counter text-green-400"></span>
                {{ nodeGroup.totalExecutions }} ejecuciones
              </span>

              <span class="flex items-center gap-1" v-if="nodeGroup.isActive">
                <span class="mdi mdi-circle text-green-400 animate-pulse"></span>
                Activo
              </span>
            </div>
          </div>

          <!-- Indicador de expansión -->
          <div class="flex-shrink-0">
            <span class="mdi text-gray-400 transition-transform duration-200"
              :class="expandedNodes.has(nodeId) ? 'mdi-chevron-up' : 'mdi-chevron-down'">
            </span>
          </div>
        </div>

        <!-- Detalles expandidos -->
        <div v-if="expandedNodes.has(nodeId)" class="mt-2 ml-6 space-y-1 border-l-2 border-blue-400/30 pl-4">

          <!-- Conexiones agrupadas -->
          <div v-for="connection in nodeGroup.connections" :key="connection.name"
            class="py-2 border-b border-gray-800/50 last:border-b-0">
            <div class="flex items-center gap-2 mb-3">
              <span class="text-blue-200 font-medium text-xs">{{ connection.name }}</span>
              <span class="text-xs bg-blue-900/50 px-2 py-0.5 rounded text-blue-200">
                {{ connection.executions }} exec
              </span>

              <!-- Barra de tiempo para conexión -->
              <div class="flex items-center gap-1 ml-auto">
                <div class="w-12 h-1 bg-gray-700 rounded-full overflow-hidden">
                  <div class="h-full rounded-full transition-all duration-300"
                    :class="getTimeBarColor(connection.avgTime)"
                    :style="{ width: `${Math.min(connection.avgTime / 10, 100)}%` }">
                  </div>
                </div>
                <span class="text-xs text-gray-400">{{ connection.avgTime }}ms</span>
              </div>
            </div>

            <!-- Mini historial con scroll -->
            <div class="space-y-1 max-h-24 overflow-y-auto bg-gray-900/30 rounded p-2">
              <div v-for="execution in connection.history.slice(-5)" :key="execution.id"
                class="flex items-center gap-2 text-xs py-1">
                <span class="text-gray-500 w-12 text-[10px]">{{ formatLogTime(execution.timestamp) }}</span>

                <!-- Barra visual para tiempo individual -->
                <div class="flex-1 flex items-center gap-1">
                  <div class="w-8 h-0.5 bg-gray-700 rounded-full overflow-hidden">
                    <div class="h-full rounded-full" :class="getTimeBarColor(execution.executeTime)"
                      :style="{ width: `${Math.min(execution.executeTime / (connection.avgTime * 2), 100)}%` }">
                    </div>
                  </div>
                  <span class="text-gray-400 text-[10px]">{{ execution.executeTime }}ms</span>
                </div>

                <span v-if="execution.length !== undefined"
                  class="text-purple-300 text-[10px] bg-purple-900/30 px-1 rounded">
                  {{ execution.length }}
                </span>
              </div>

              <!-- Indicador si hay más ejecuciones -->
              <div v-if="connection.history.length > 5" class="text-center text-gray-500 text-[10px] py-1">
                ... y {{ connection.history.length - 5 }} más
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Placeholder cuando no hay trazas -->
      <div v-if="Object.keys(groupedTraces).length === 0" class="text-gray-500 text-center py-8">
        <span class="mdi mdi-timeline-outline text-2xl block mb-2"></span>
        <p>No hay trazas de ejecución disponibles</p>
        <p class="text-xs mt-1">Las trazas aparecerán aquí durante la ejecución del workflow</p>
      </div>


    </div>
    <div class="border-t border-gray-700 p-2 flex items-center justify-between text-xs text-gray-400">
      <span>Total: {{ executionTrace.length }} trazas</span>
      <div class="flex gap-4">
        <span>
          <span class="text-blue-400">●</span> Nodos: {{ uniqueNodesCount }}
        </span>
        <span>
          <span class="text-green-400">●</span> Conexiones: {{ uniqueConnectionsCount }}
        </span>
        <span>
          <span class="text-orange-400">●</span> Total ejecuciones: {{ executionTrace.length }}
        </span>
      </div>
    </div>
  </div>

</template>

<script setup lang="ts">
import { useCanvas } from '@/stores'
import { computed, ref, watch, nextTick } from 'vue'

const canvasStore = useCanvas()

interface ExecutionTrace {
  id: string
  timestamp: Date
  nodeId: string
  connectionName: string
  executeTime: number
  length?: number
}

interface Props {
  executionTrace: ExecutionTrace[]
  autoScroll: boolean
}

const props = defineProps<Props>()

const traceContainer = ref<HTMLElement>()
const expandedNodes = ref<Set<string>>(new Set())

// Interfaz para los datos agrupados de trazas
interface NodeGroup {
  name: string
  totalExecutions: number
  avgTime: number
  totalData: number
  isActive: boolean
  connections: {
    name: string
    executions: number
    avgTime: number
    history: ExecutionTrace[]
  }[]
}

const uniqueNodesCount = computed(() => {
  const uniqueNodes = new Set(props.executionTrace.map(trace => trace.nodeId))
  return uniqueNodes.size
})

const uniqueConnectionsCount = computed(() => {
  const uniqueConnections = new Set(
    props.executionTrace.map(trace => `${trace.nodeId}-${trace.connectionName}`)
  )
  return uniqueConnections.size
})

// Agrupar trazas por nodo y conexión
const groupedTraces = computed(() => {
  const groups: Record<string, NodeGroup> = {}

  for (const trace of props.executionTrace) {
    if (!groups[trace.nodeId]) {
      groups[trace.nodeId] = {
        name: canvasStore.getCanvasInstance.nodes.getNode({ id: trace.nodeId }).info.name,
        totalExecutions: 0,
        avgTime: 0,
        totalData: 0,
        isActive: false,
        connections: []
      }
    }

    const nodeGroup = groups[trace.nodeId]

    // Buscar o crear conexión
    let connection = nodeGroup.connections.find(c => c.name === trace.connectionName)
    if (!connection) {
      connection = {
        name: trace.connectionName,
        executions: 0,
        avgTime: 0,
        history: []
      }
      nodeGroup.connections.push(connection)
    }

    // Agregar traza al historial
    connection.history.push(trace)
    connection.executions++

    // Calcular tiempo promedio de la conexión
    const totalTime = connection.history.reduce((sum, t) => sum + t.executeTime, 0)
    connection.avgTime = Math.round(totalTime / connection.executions)

    // Actualizar totales del nodo
    nodeGroup.totalExecutions++
    nodeGroup.totalData += trace.length || 0

    // Calcular tiempo promedio del nodo
    const allNodeTimes = nodeGroup.connections.flatMap(c => c.history.map(h => h.executeTime))
    nodeGroup.avgTime = Math.round(allNodeTimes.reduce((sum, time) => sum + time, 0) / allNodeTimes.length)

    // Marcar como activo si la ejecución fue reciente (últimos 5 segundos)
    const fiveSecondsAgo = Date.now() - 5000
    nodeGroup.isActive = trace.timestamp.getTime() > fiveSecondsAgo
  }

  return groups
})

const formatLogTime = (timestamp: Date) => {
  return timestamp.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const toggleNodeDetails = (nodeId: string) => {
  if (expandedNodes.value.has(nodeId)) {
    expandedNodes.value.delete(nodeId)
  } else {
    expandedNodes.value.add(nodeId)
  }
}

const getTimeBarColor = (avgTime: number) => {
  if (avgTime < 100) return 'bg-green-400'
  if (avgTime < 500) return 'bg-yellow-400'
  if (avgTime < 1000) return 'bg-orange-400'
  return 'bg-red-400'
}

// Auto-scroll cuando se agregan nuevas trazas
watch(() => props.executionTrace.length, () => {
  if (props.autoScroll) {
    nextTick(() => {
      if (traceContainer.value) {
        traceContainer.value.scrollTop = traceContainer.value.scrollHeight
      }
    })
  }
})

// Exponer referencia del contenedor para auto-scroll externo
defineExpose({
  scrollToBottom: () => {
    if (traceContainer.value) {
      traceContainer.value.scrollTop = traceContainer.value.scrollHeight
    }
  }
})
</script>
