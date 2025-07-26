<template>
  <!-- Canvas Tabs Header -->
  <CanvasTabsHeader :project-name="canvasStore.projectName" :canvas-composable="canvasComposable"
    :version="canvasStore.version.value" />
  <CanvasArea :canvas-composable="canvasComposable" />

  <!-- Modals Manager - Propiedades, Manejo de Nodos, Manejo de Conexiones, Manejo de Notas, Manejo de Grupos -->
  <CanvasModalsManager v-if="canvasComposable.actions" :canvas-actions="canvasComposable.actions.value" />

</template>

<script setup lang="ts">
import { useCanvas, useWorkflowsStore } from '@/stores'
import CanvasArea from '@/components/Canvas/CanvasArea.vue'
import CanvasTabsHeader from '@/components/Canvas/CanvasTabsHeader.vue'
import { useCanvasComposable } from '@/composables/useCanvas.composable'
import CanvasModalsManager from './CanvasModalsManager.vue'

const canvasStore = useCanvas()
const canvasComposable = useCanvasComposable()
</script>