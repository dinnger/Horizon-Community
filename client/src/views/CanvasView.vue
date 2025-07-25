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
          <CanvasArea @canvas-ready="canvasReady" :is-context="true" />
        </div>
        <div v-if="activeTab === 'execution'">
          <CanvasAreaExecute :version="version" />
        </div>
      </div>

      <!-- Modals Manager - Sistema refactorizado -->
      <CanvasModalsManager />

      <!-- Auto Deployment Toast -->
      <AutoDeploymentToast :show="canvasStore.showAutoDeploymentToast"
        :workflow-name="canvasStore.autoDeploymentInfo?.workflowName || ''"
        :deployment-name="canvasStore.autoDeploymentInfo?.deploymentName || ''" />
    </div>

    <!-- Error State -->
    <CanvasErrorState v-if="canvasStore.isError" />

  </div>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import { useCanvas, useWorkflowsStore } from '@/stores'
import { useCanvasEvents } from '@/stores/canvasEvents'
import CanvasTabsHeader from '@/components/Canvas/CanvasTabsHeader.vue'
import CanvasArea from '@/components/Canvas/CanvasArea.vue'
import CanvasModalsManager from '@/components/Canvas/CanvasModalsManager.vue'
import AutoDeploymentToast from '@/components/AutoDeploymentToast.vue'
import CanvasErrorState from '@/components/Canvas/CanvasErrorState.vue'
import CanvasAreaExecute from '@/components/Canvas/CanvasAreaExecute.vue'

const workflowStore = useWorkflowsStore()
const canvasStore = useCanvas()
const canvasExecuteStore = useCanvas('execution')
const canvasEvents = useCanvasEvents()

// Estado de las pestañas
const activeTab = ref<'design' | 'execution'>('design')

const version = computed(() => {
  return canvasExecuteStore.workerInfo?.version && workflowStore.context?.info.version !== canvasExecuteStore.workerInfo?.version ? canvasExecuteStore.workerInfo?.version : undefined
})

const showNotesManager = () => {
  canvasEvents.emit('note:manager:open', undefined)
}

const canvasReady = () => {
  canvasExecuteStore.initSubscriptionsCanvas()
}

onUnmounted(() => {
  canvasExecuteStore.closeSubscriptionsCanvas()
})
</script>
