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
          <CanvasExecution :workflowId="workflowId" />
        </div>
      </div>

      <!-- Modals Manager - Propiedades, Manejo de Nodos, Manejo de Conexiones, Manejo de Notas, Manejo de Grupos -->
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
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useCanvas } from '@/stores'
import CanvasModalsManager from '@/components/Canvas/CanvasModalsManager.vue'
import AutoDeploymentToast from '@/components/AutoDeploymentToast.vue'
import CanvasErrorState from '@/components/Canvas/CanvasErrorState.vue'
import CanvasExecution from '@/components/Canvas/CanvasExecution.vue'
import { useRouter } from 'vue-router'
import CanvasHeader from '@/components/Canvas/CanvasHeader.vue'
import CanvasDesign from '@/components/Canvas/CanvasDesign.vue'

const router = useRouter()
const canvasStore = useCanvas()
const canvasExecuteStore = useCanvas()

// Estado de las pestañas
const activeTab = ref<'design' | 'execution'>('design')


const workflowId = computed(() => router.currentRoute.value.params.id as string)

onMounted(() => {
  canvasExecuteStore.initSubscriptionsCanvas({ workflowId: workflowId.value })
})

onUnmounted(() => {
  canvasExecuteStore.closeSubscriptionsCanvas({ workflowId: workflowId.value })
})
</script>
