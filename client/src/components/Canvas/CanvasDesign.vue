<template>
  <!-- Canvas Tabs Header -->
  <CanvasTabsHeader :project-name="canvasStore.projectName" :canvas-composable="canvasComposable"
    :workflow-id="workflowId" />
  <CanvasArea :canvas-composable="canvasComposable" :workflow-id="workflowId" />

  <!-- Modals Manager - Propiedades, Manejo de Nodos, Manejo de Conexiones, Manejo de Notas, Manejo de Grupos -->
  <CanvasModalsManager v-if="canvasComposable.actions" :canvas-composable="canvasComposable" />

</template>

<script setup lang="ts">
import { useCanvas } from '@/stores'
import CanvasArea from '@/components/Canvas/CanvasArea.vue'
import CanvasTabsHeader from '@/components/Canvas/CanvasTabsHeader.vue'
import { useCanvasComposable } from '@/composables/useCanvas.composable'
import CanvasModalsManager from './CanvasModalsManager.vue'

const canvasStore = useCanvas()
const canvasComposable = useCanvasComposable()

const props = defineProps<{
  workflowId: string
  version?: string
}>()

defineExpose({
  version: canvasComposable.version,
  context: canvasComposable.context
})
</script>