<template>
  <div>
    <div class="h-screen bg-base-100 overflow-hidden flex flex-col">
      <CanvasHeader :project-name="canvasStore.projectName" :active-tab="canvasStore.activeTab"
        @update:active-tab="updateTab" :version="canvasDesign?.version.value" />

      <!-- Content Area -->
      <div class="flex-1 relative">
        <!-- Canvas Area (Design Tab) -->
        <div v-show="canvasStore.activeTab === 'design'" class="h-full">
          <CanvasDesign ref="canvasDesign" :workflowId="workflowId" :version="canvasStore.version.value" />
        </div>
        <div v-if="canvasStore.activeTab === 'execution'" class="h-full">
          <CanvasExecution :workflowId="workflowId" :version="workerStore.workerInfo?.version" />
        </div>
      </div>


      <!-- Auto Deployment Toast -->
      <!-- <AutoDeploymentToast :show="canvasStore.showAutoDeploymentToast"
        :workflow-name="canvasStore.autoDeploymentInfo?.workflowName || ''"
        :deployment-name="canvasStore.autoDeploymentInfo?.deploymentName || ''" /> -->
    </div>

    <!-- Error State -->
    <CanvasErrorState v-if="canvasStore.isError" />

  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useCanvas } from '@/stores'
import { useRouter } from 'vue-router'
import CanvasErrorState from '@/components/Canvas/CanvasErrorState.vue'
import CanvasExecution from '@/components/Canvas/CanvasExecution.vue'
import CanvasHeader from '@/components/Canvas/CanvasHeader.vue'
// biome-ignore lint/style/useImportType: <explanation>
import CanvasDesign from '@/components/Canvas/CanvasDesign.vue'
import { useWorkerComposable } from '@/composables/useWorker.composable'
import { useWorkerStore } from '@/stores/worker'

const router = useRouter()
const canvasStore = useCanvas()
const workerStore = useWorkerStore()
const workerComposable = useWorkerComposable()

const canvasDesign = ref<InstanceType<typeof CanvasDesign> | null>(null)

const workflowId = computed(() => router.currentRoute.value.params.id as string)

const updateTab = (tab: 'design' | 'execution') => {
  canvasStore.activeTab = tab
}

onMounted(() => {
  canvasStore.activeTab = 'design'
  workerStore.workerInfo = null
  workerComposable.initSubscriptionsWorker({ workflowId: workflowId.value })
})

onUnmounted(() => {
  workerComposable.closeSubscriptionsWorker({ workflowId: workflowId.value })
})
</script>
