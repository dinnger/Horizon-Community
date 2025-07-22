<template>
  <div>
    <CanvasArea name="execution" :is-locked="true" version="0.0.1" @canvas-ready="canvasReady" />
    <CanvasExecutionLog :is-visible="true" :execution-logs="list" />
  </div>
</template>

<script setup lang="ts">
import CanvasArea from '@/components/Canvas/CanvasArea.vue';
import CanvasExecutionLog from '../components/Canvas/CanvasExecutionLog.vue';
import { useCanvas } from '@/stores';
import { onUnmounted } from 'vue';

const canvasStore = useCanvas('execution')

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
  }
]

const canvasReady = () => {
  canvasStore.initializeSubscriptions()
}

onUnmounted(() => {
  canvasStore.closeSubscriptions()
})

</script>
