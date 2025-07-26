<template>
  <div>
    <div v-if="!workerStore.isExecuting">
      <CanvasExecutionHeader />
      <CanvasArea v-if="workerStore.workerInfo" name="execution" :is-locked="true" :version="version"
        :canvas-composable="canvasComposable" @canvas-ready="canvasReady" />
      <CanvasExecutionTabs v-if="workerStore.workerInfo" :is-visible="true" :canvas-composable="canvasComposable"
        @clear-logs="clearLogs" @clear-trace="clearTrace" />
      <!-- Version Selector Modal -->
      <VersionSelectorModal v-if="canvasStore.showSelectedVersion" />
      <!-- Modals Manager - Propiedades, Manejo de Nodos, Manejo de Conexiones, Manejo de Notas, Manejo de Grupos -->
      <CanvasModalsManager v-if="canvasComposable.actions" :canvas-actions="canvasComposable.actions.value" />
    </div>
    <div v-else class="flex items-center justify-center h-screen">
      <div>En ejecución...</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCanvas } from '@/stores';
import { onMounted, onUnmounted } from 'vue';
import { useCanvasComposable } from '@/composables/useCanvas.composable';
import CanvasArea from '@/components/Canvas/CanvasArea.vue';
import CanvasExecutionTabs from './CanvasExecutionTabs.vue';
import VersionSelectorModal from './VersionSelectorModal.vue';
import CanvasExecutionHeader from './CanvasExecutionHeader.vue';
import { useWorkerComposable } from '@/composables/useWorker.composable';
import { useWorkerStore } from '@/stores/worker';
import CanvasModalsManager from './CanvasModalsManager.vue';


const props = defineProps<{
  workflowId: string
  version?: string
}>()


interface ExecutionLog {
  id: string
  timestamp: Date
  type: 'info' | 'warning' | 'error' | 'debug'
  message: string
  nodeId?: string
}

const canvasStore = useCanvas()
const workerStore = useWorkerStore()
const canvasComposable = useCanvasComposable()
const workerComposable = useWorkerComposable()

const canvasReady = () => {
  canvasComposable.closeSubscriptionsExecution({ workflowId: props.workflowId })
  canvasComposable.initSubscriptionsExecution({ workflowId: props.workflowId })

}

const clearLogs = () => {
  // Limpiar logs de ejecución
}

const clearTrace = () => {
  // Limpiar trazas de ejecución
  canvasComposable.clearPanelTrace()
}

onMounted(() => {
  // Iniciar la ejecución del workflow
  if (!props.version) {
    workerComposable.executeWorkflow({ workflowId: props.workflowId })
  }
})

onUnmounted(() => {
  canvasComposable.closeSubscriptionsExecution({ workflowId: props.workflowId })
})

</script>
