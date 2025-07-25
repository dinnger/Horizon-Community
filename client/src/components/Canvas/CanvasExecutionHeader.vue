<template>

  <div class="bg-base-100/70 p-2 right-0 absolute z-10 m-[15px]  backdrop-blur-md rounded-lg join">
    <template v-if="canvasExecuteStore.workerInfo || isReloading">
      <!-- Selector de versiones -->
      <button v-if="canvasExecuteStore.workerInfo" class="btn btn-sm join-item" disabled>
        V.{{ canvasExecuteStore.workerInfo?.version }}
      </button>
      <button v-if="canvasExecuteStore.workerInfo" class="btn btn-sm join-item" @click="handleVersionSelection">
        <span class="mdi mdi-format-list-numbered mr-2"></span>
        Ejecutar versión
      </button>

      <!-- Información de versión actual -->

      <!-- Detener worker -->
      <button v-if="canvasExecuteStore.workerInfo" class="btn btn-sm join-item" @click="handleStopWorker">
        <span class="mdi mdi-stop mr-2"></span>
        Detener
      </button>

      <!-- Reiniciar worker -->
      <button v-if="canvasExecuteStore.workerInfo || isReloading" class="btn btn-sm join-item" @click="handleReload"
        :disabled="!canvasExecuteStore.workerInfo">
        <span class="mdi mdi-reload mr-2" :class="{ 'mdi-spin': !canvasExecuteStore.workerInfo }"></span>
        {{ canvasExecuteStore.workerInfo ? 'Reiniciar' : 'Reiniciando...' }}
      </button>
    </template>
  </div>


</template>

<script setup lang="ts">
import { useCanvas, useWorkflowsStore } from '@/stores'
import { toast } from 'vue-sonner'
import { useRouter } from 'vue-router'
import { computed, ref, watch } from 'vue'

const canvasExecuteStore = useCanvas('execution')
const router = useRouter()

const isReloading = ref(false)

const workflowId = computed(() => router.currentRoute.value.params.id as string)

const emit = defineEmits<{
  showNotesManager: []
  'update:activeTab': [tab: 'design' | 'execution']
}>()



const handleExecute = async () => {
  emit('update:activeTab', 'execution')
  if (!canvasExecuteStore.workerInfo) canvasExecuteStore.handleExecuteWorkflow({ workflowId: workflowId.value })
}

const handleReload = async () => {
  isReloading.value = true
  canvasExecuteStore.handleExecuteWorkflow({ workflowId: workflowId.value })
}

const handleStopWorker = async () => {
  if (!canvasExecuteStore.workerInfo) return
  try {
    const result = await canvasExecuteStore.stopWorker({ workerId: canvasExecuteStore.workerInfo?.id })
    if (result.success) {
      emit('update:activeTab', 'design')
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
  canvasExecuteStore.showSelectedVersion = true
}

watch(() => canvasExecuteStore.workerInfo, () => {
  isReloading.value = false
})

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
