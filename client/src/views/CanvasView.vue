<template>
  <div>
    <div v-if="!canvasStore.isLoading && !canvasStore.isError" class="h-screen bg-base-100 overflow-hidden">
      <!-- Canvas Header -->
      <CanvasHeader :project-name="canvasStore.projectName" @show-notes-manager="showNotesManager" />

      <!-- Execution Panel -->
      <CanvasExecutionPanel :is-executing="canvasStore.isExecuting" :version="canvasStore.version.value" />

      <!-- Canvas Area -->
      <CanvasArea @canvas-ready="handleCanvasReady" />

      <!-- Modals Manager - Sistema refactorizado -->
      <CanvasModalsManager />

      <!-- Version Selector Modal -->
      <VersionSelectorModal :is-visible="canvasStore.showVersionSelector"
        :available-versions="canvasStore.availableVersions" :selected-version="canvasStore.selectedVersion"
        @execute-selected-version="canvasStore.executeSelectedVersion" @close="canvasStore.closeVersionSelector" />

      <!-- Auto Deployment Toast -->
      <AutoDeploymentToast :show="canvasStore.showAutoDeploymentToast"
        :workflow-name="canvasStore.autoDeploymentInfo?.workflowName || ''"
        :deployment-name="canvasStore.autoDeploymentInfo?.deploymentName || ''" />
    </div>

    <!-- Error State -->
    <CanvasErrorState v-if="canvasStore.isError" />

    <!-- Panel de Debug/Consola -->
    <DebugPanel />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useCanvas } from '@/stores'
import { useCanvasEvents } from '@/stores/canvasEvents'
import CanvasHeader from '@/components/Canvas/CanvasHeader.vue'
import CanvasExecutionPanel from '@/components/Canvas/CanvasExecutionPanel.vue'
import CanvasArea from '@/components/Canvas/CanvasArea.vue'
import CanvasModalsManager from '@/components/Canvas/CanvasModalsManager.vue'
import VersionSelectorModal from '@/components/Canvas/VersionSelectorModal.vue'
import AutoDeploymentToast from '@/components/AutoDeploymentToast.vue'
import CanvasErrorState from '@/components/Canvas/CanvasErrorState.vue'
import DebugPanel from '@/components/DebugPanel.vue'
import { useRouter } from 'vue-router'

const canvasStore = useCanvas()
const canvasEvents = useCanvasEvents()
const router = useRouter()

const handleCanvasReady = (canvas: HTMLCanvasElement) => {
  // Inicializar el canvas
  canvasStore.initializeCanvas(canvas)

}

const showNotesManager = () => {
  canvasEvents.emit('note:manager:open', undefined)
}

onMounted(async () => {
  await canvasStore.loadWorkflow(router.currentRoute.value.params.id as string)
})
</script>

<style scoped>
.canvas-container {
  background-color: var(--fallback-b1, oklch(var(--b1)));
}
</style>
