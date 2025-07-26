<template>

  <div class="bg-base-100/70 p-2 right-0 absolute z-10 m-[15px]  backdrop-blur-md rounded-lg join">
    <template v-if="workerStore.workerInfo">
      <!-- Selector de versiones -->
      <button v-if="workerStore.workerInfo" class="btn btn-sm join-item" disabled>
        V.{{ workerStore.workerInfo?.version }}
      </button>
      <button v-if="workerStore.workerInfo" class="btn btn-sm join-item" @click="handleVersionSelection">
        <span class="mdi mdi-format-list-numbered mr-2"></span>
        Ejecutar versión
      </button>

      <!-- Información de versión actual -->

      <!-- Detener worker -->
      <button v-if="workerStore.workerInfo" class="btn btn-sm join-item" @click="handleStopWorker">
        <span class="mdi mdi-stop mr-2"></span>
        Detener
      </button>

      <!-- Reiniciar worker -->
      <button v-if="workerStore.workerInfo" class="btn btn-sm join-item" @click="handleReload"
        :disabled="!workerStore.workerInfo">
        <span class="mdi mdi-reload mr-2" :class="{ 'mdi-spin': !workerStore.workerInfo }"></span>
        {{ workerStore.workerInfo ? 'Reiniciar' : 'Reiniciando...' }}
      </button>
    </template>

    <!-- Version Selector Modal -->
  </div>
  <VersionSelectorModal v-if="showSelectedVersion" :version="workerStore.workerInfo?.version" :workflow-id="workflowId"
    @close="showSelectedVersion = false" />


</template>

<script setup lang="ts">
import { useCanvas } from '@/stores'
import { toast } from 'vue-sonner'
import { useRouter } from 'vue-router'
import { useWorkerComposable } from '@/composables/useWorker.composable'
import { useWorkerStore } from '@/stores/worker'
import { ref } from 'vue'
import VersionSelectorModal from './VersionSelectorModal.vue'

const showSelectedVersion = ref(false)

const canvasExecuteStore = useCanvas()
const router = useRouter()
const canvasStore = useCanvas()
const workerStore = useWorkerStore()
const workerComposable = useWorkerComposable()

const props = defineProps<{
  workflowId: string
}>()


const handleReload = async () => {
  workerComposable.executeWorkflow({ workflowId: props.workflowId })
}

const handleStopWorker = async () => {
  if (!workerStore.workerInfo) return
  try {
    const result = await workerComposable.stopWorker({ workerId: workerStore.workerInfo?.id })
    if (result.success) {
      canvasStore.activeTab = 'design'
      toast.success('Worker detenido correctamente')
    } else {
      toast.error(`Error al detener worker: ${result.message}`)
    }
  } catch (error) {
    toast.error('Error al detener el worker')
    console.error('Error stopping worker:', error)
  }
}

const handleVersionSelection = async () => {
  showSelectedVersion.value = true
}


</script>

<style scoped>
.tab {
  transition: all 0.2s ease;
}

.tab:hover {
  background-color: var(--fallback-b2, oklch(var(--b2)));
}

.tab-active {
  border-bottom-color: var(--fallback-p, oklch(var(--p)));
  color: var(--fallback-p, oklch(var(--p)));
}
</style>
