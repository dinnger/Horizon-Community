<template>
  <div>
    <div class="h-screen bg-base-100 overflow-hidden flex flex-col">
      <!-- Canvas Tabs Header -->
      <CanvasTabsHeader :project-name="canvasStore.projectName" :active-tab="activeTab"
        :is-executing="canvasStore.isExecuting" :version="canvasStore.version.value"
        @show-notes-manager="showNotesManager" @update:active-tab="activeTab = $event" />

      <!-- Content Area -->
      <div class="flex-1 relative">
        <!-- Canvas Area (Design Tab) -->
        <div v-show="activeTab === 'design'" class="h-full">
          <CanvasArea />
        </div>
        <div v-if="activeTab === 'execution'">
          <CanvasArea :is-locked="true" />
        </div>

        <!-- Execution Area (Execution Tab) -->
        <div v-show="activeTab === 'execution'" class="h-full overflow-auto">
          <CanvasExecutionArea :is-executing="canvasStore.isExecuting" :version="canvasStore.version.value"
            @execute-workflow="canvasStore.handleExecuteWorkflow"
            @execute-with-version-selection="canvasStore.handleExecuteWithVersionSelection" />
        </div>
      </div>

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
import { onMounted, ref } from 'vue'
import { useCanvas } from '@/stores'
import { useCanvasEvents } from '@/stores/canvasEvents'
import CanvasTabsHeader from '@/components/Canvas/CanvasTabsHeader.vue'
import CanvasArea from '@/components/Canvas/CanvasArea.vue'
import CanvasExecutionArea from '@/components/Canvas/CanvasExecutionArea.vue'
import CanvasModalsManager from '@/components/Canvas/CanvasModalsManager.vue'
import VersionSelectorModal from '@/components/Canvas/VersionSelectorModal.vue'
import AutoDeploymentToast from '@/components/AutoDeploymentToast.vue'
import CanvasErrorState from '@/components/Canvas/CanvasErrorState.vue'
import DebugPanel from '@/components/DebugPanel.vue'
import { useRouter } from 'vue-router'

const canvasStore = useCanvas()
const canvasEvents = useCanvasEvents()
const router = useRouter()

// Estado de las pestañas
const activeTab = ref<'design' | 'execution'>('design')



const showNotesManager = () => {
  canvasEvents.emit('note:manager:open', undefined)
}

// onMounted(async () => {
//   await canvasStore.loadWorkflow(router.currentRoute.value.params.id as string)
// })
</script>
