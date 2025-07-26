<template>
  <div class="h-full">
    <div v-if="!workerStore.isExecuting">
      <CanvasExecutionHeader :workflow-id="workflowId" />
      <CanvasArea v-if="workerStore.workerInfo" :workflow-id="workflowId" name="execution" :is-locked="true"
        :version="version" :canvas-composable="canvasComposable" @canvas-ready="canvasReady" />
      <CanvasExecutionTabs v-if="workerStore.workerInfo" :is-visible="true" :workflow-id="workflowId"
        :canvas-composable="canvasComposable" @clear-logs="clearLogs" @clear-trace="clearTrace" />
      <!-- Version Selector Modal -->
      <VersionSelectorModal v-if="canvasStore.showSelectedVersion" :workflow-id="workflowId" />
      <!-- Modals Manager - Propiedades, Manejo de Nodos, Manejo de Conexiones, Manejo de Notas, Manejo de Grupos -->
      <CanvasModalsManager v-if="canvasComposable.actions" :canvas-composable="canvasComposable" />
    </div>
    <div v-else class="flex flex-col items-center justify-center h-full">
      <span class="mdi mdi-account-hard-hat text-primary/60 text-5xl"></span>
      <p class="text-md text-base-content/60 font-medium mt-4">Iniciando Workflow</p>
      <small class="text-base-content/40">
        <span class="mdi mdi-refresh text-primary mdi-spin"></span>
        Esperando a que inicie el worker...
      </small>
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
  workflowId: string
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
