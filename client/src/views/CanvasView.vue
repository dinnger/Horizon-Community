<template>
  <div>
    <div class="h-screen bg-base-100 overflow-hidden flex flex-col">
      <CanvasHeader :project-name="canvasStore.projectName" :active-tab="activeTab"
        @update:active-tab="activeTab = $event" />

      <!-- Content Area -->
      <div class="flex-1 relative">
        <!-- Canvas Area (Design Tab) -->
        <div v-show="activeTab === 'design'" class="h-full">
          <CanvasDesign :workflowId="workflowId" />
        </div>
        <div v-if="activeTab === 'execution'">
          <CanvasExecution :workflowId="workflowId" :version="version" />
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
import CanvasModalsManager from '@/components/Canvas/CanvasModalsManager.vue'
import AutoDeploymentToast from '@/components/AutoDeploymentToast.vue'
import CanvasErrorState from '@/components/Canvas/CanvasErrorState.vue'
import CanvasExecution from '@/components/Canvas/CanvasExecution.vue'
import { useRouter } from 'vue-router'
import CanvasHeader from '@/components/Canvas/CanvasHeader.vue'
import CanvasDesign from '@/components/Canvas/CanvasDesign.vue'

const router = useRouter()
const workflowStore = useWorkflowsStore()
const canvasStore = useCanvas()
const canvasExecuteStore = useCanvas('execution')
const canvasEvents = useCanvasEvents()

// Estado de las pestañas
const activeTab = ref<'design' | 'execution'>('design')

const version = computed(() => {
  return canvasExecuteStore.workerInfo?.version && workflowStore.context?.info.version !== canvasExecuteStore.workerInfo?.version ? canvasExecuteStore.workerInfo?.version : undefined
})

const workflowId = computed(() => router.currentRoute.value.params.id as string)



onUnmounted(() => {
  canvasExecuteStore.closeSubscriptionsCanvas()
})
</script>
