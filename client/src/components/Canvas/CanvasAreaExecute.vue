<template>
  <div>
    <CanvasArea v-if="canvasExecuteStore.workerInfo" name="execution" :is-locked="true" :version="version"
      @canvas-ready="canvasReady" />
    <CanvasExecutionTabs :is-visible="true" :panel-console="canvasExecuteStore.panelConsole"
      :panel-trace="canvasExecuteStore.panelTrace" @clear-logs="clearLogs" @clear-trace="clearTrace" />
    <!-- Version Selector Modal -->
    <VersionSelectorModal v-if="canvasExecuteStore.showSelectedVersion" />
  </div>
</template>

<script setup lang="ts">
import CanvasArea from '@/components/Canvas/CanvasArea.vue';
import CanvasExecutionTabs from './CanvasExecutionTabs.vue';
import { useCanvas } from '@/stores';
import { onUnmounted } from 'vue';
import VersionSelectorModal from './VersionSelectorModal.vue';

const canvasExecuteStore = useCanvas('execution')

defineProps<{
  version?: string
}>()


interface ExecutionLog {
  id: string
  timestamp: Date
  type: 'info' | 'warning' | 'error' | 'debug'
  message: string
  nodeId?: string
}

const list: ExecutionLog[] = [
  {
    id: '1',
    timestamp: new Date(),
    type: 'info',
    message: 'Iniciando ejecución del workflow...',
    nodeId: 'node_1'
  },
  {
    id: '2',
    timestamp: new Date(Date.now() + 1000),
    type: 'info',
    message: 'Procesando datos de entrada',
    nodeId: 'node_2'
  },
  {
    id: '3',
    timestamp: new Date(Date.now() + 2000),
    type: 'warning',
    message: 'Advertencia: Algunos datos pueden estar incompletos',
    nodeId: 'node_3'
  }
]

const canvasReady = () => {
  canvasExecuteStore.initSubscriptionsExecution()

}

const clearLogs = () => {
  // Limpiar logs de ejecución
  list.length = 0
}

const clearTrace = () => {
  // Limpiar trazas de ejecución
  canvasExecuteStore.clearPanelTrace()
}

onUnmounted(() => {
  canvasExecuteStore.closeSubscriptionsExecution()
})

</script>
