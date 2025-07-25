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


const canvasReady = () => {
  canvasExecuteStore.closeSubscriptionsExecution({ workflowId: props.workflowId })
  canvasExecuteStore.initSubscriptionsExecution({ workflowId: props.workflowId })

}

const clearLogs = () => {
  // Limpiar logs de ejecución
}

const clearTrace = () => {
  // Limpiar trazas de ejecución
  canvasExecuteStore.clearPanelTrace()
}

onUnmounted(() => {
  canvasExecuteStore.closeSubscriptionsExecution({ workflowId: props.workflowId })
})

</script>
