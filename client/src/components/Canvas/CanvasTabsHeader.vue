<template>
  <div class="bg-base-200 border-b border-base-300">
    <!-- Header Principal -->
    <div class="h-[55px] p-2 flex items-center justify-between">
      <div class="flex items-center space-x-4">
        <button @click="$router.go(-1)" class="btn btn-ghost btn-circle btn-sm">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <div>
          <h1 class="text-xl font-bold">{{ projectName }}</h1>
        </div>
      </div>

      <div class="flex items-center space-x-2">
        <!-- Panel de historial -->
        <VersionControlPanel />

        <!-- Administrador de notas -->
        <button class="btn btn-ghost btn-sm" @click="$emit('showNotesManager')" title="Administrar notas">
          <span class="mdi mdi-note-multiple"></span>
          Notas
        </button>


        <!-- Botones de acción en pestaña de diseño -->


      </div>
    </div>

    <!-- Pestañas -->
    <div class="bg-base-100/70 p-2 absolute z-10 m-[15px]  backdrop-blur-md rounded-lg join">
      <button class="btn btn-sm join-item h-12 w-30"
        :class="{ 'btn-primary': activeTab === 'design', 'btn-soft': activeTab !== 'design' }"
        @click="$emit('update:activeTab', 'design')">
        <div>
          <div>
            <span class="mdi mdi-drawing mr-2"></span>
            Diseño
          </div>
          <div>
            <div v-if="workflowStore.context" class="badge badge-warning badge-xs ml-2">
              {{ workflowStore.context?.info.version }}
            </div>
          </div>
        </div>
      </button>
      <button class="btn btn-sm join-item h-12 w-30"
        :class="{ 'btn-primary': activeTab === 'execution', 'btn-soft': activeTab !== 'execution' }"
        @click="handleExecute">
        <div>
          <div class="flex">
            <span v-if="!canvasExecuteStore.workerInfo" class="mdi mdi-play mr-2"></span>
            <div v-else class="w-2 h-2 rounded-full top-[5px] -left-[5px] bg-red-400 relative">
              <span class="absolute inset-0 w-2 h-2 rounded-full bg-red-400 animate-ping opacity-75"></span>
            </div>
            {{ isExecuting ? "Ejecutando..." : !canvasExecuteStore.workerInfo ? 'Ejecutar' : 'En ejecución' }}
          </div>
          <div v-if="canvasExecuteStore.workerInfo" class="badge badge-warning badge-xs ml-2">
            {{ canvasExecuteStore.workerInfo.version }}
          </div>
        </div>
      </button>
    </div>

    <div v-if="activeTab === 'design'"
      class="bg-base-100/70 p-2 right-0 absolute z-10 m-[15px]  backdrop-blur-md rounded-lg join">
      <button class="btn btn-info btn-sm" @click="handlePublish">
        <span class="mdi mdi-upload"></span>
        Publicar
      </button>
      <div class="border-l border-base-300 ml-1 mr-1 h-8 relative"></div>
      <button class="btn btn-primary btn-sm" @click="handleSave" :disabled="!canvasStore.changes">
        <span class="mdi mdi-content-save"></span>
        Guardar
      </button>
    </div>

    <div v-if="activeTab === 'execution'"
      class="bg-base-100/70 p-2 right-0 absolute z-10 m-[15px]  backdrop-blur-md rounded-lg join">
      <template v-if="canvasExecuteStore.workerInfo || !isReloading">
        <!-- Selector de versiones -->
        <button class="btn btn-sm join-item" v-if="canvasExecuteStore.workerInfo" disabled>
          V.{{ canvasExecuteStore.workerInfo?.version }}
        </button>
        <button class="btn btn-sm join-item" @click="handleVersionSelection">
          <span class="mdi mdi-format-list-numbered mr-2"></span>
          Ejecutar versión
        </button>

        <!-- Información de versión actual -->

        <!-- Detener worker -->
        <button v-if="canvasExecuteStore.workerInfo" class="btn btn-error btn-sm join-item" @click="handleStopWorker">
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

    <!-- Panel de Ejecución (solo visible en pestaña de ejecución) -->
    <!-- <div v-if="activeTab === 'execution'" class="bg-base-100 p-4 border-b border-base-300">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <h3 class="text-lg font-semibold">Panel de Ejecución</h3>
          <div class="badge badge-outline">Versión: {{ version }}</div>
        </div>

        
      </div>
    </div> -->
  </div>
</template>

<script setup lang="ts">
import { useCanvas, useWorkflowsStore } from '@/stores'
import VersionControlPanel from '@/components/VersionControlPanel.vue'
import { toast } from 'vue-sonner'
import { useRouter } from 'vue-router'
import { computed, ref, watch } from 'vue'

interface Props {
  projectName: string
  activeTab: 'design' | 'execution'
  isExecuting: boolean
  version: string
}

const props = defineProps<Props>()

const canvasStore = useCanvas()
const canvasExecuteStore = useCanvas('execution')
const router = useRouter()
const workflowStore = useWorkflowsStore()

const isReloading = ref(false)

const workflowId = computed(() => router.currentRoute.value.params.id as string)

const emit = defineEmits<{
  showNotesManager: []
  'update:activeTab': [tab: 'design' | 'execution']
}>()

const handleSave = async () => {
  try {
    await canvasStore.save()
    toast.success('Workflow guardado correctamente')
  } catch (error) {
    toast.error('Error al guardar el workflow')
    console.error('Error saving workflow:', error)
  }
}

const handlePublish = async () => {
  try {
    await canvasStore.publish(router.currentRoute.value.params.id as string)
    toast.success('Workflow publicado correctamente')
  } catch (error) {
    toast.error('Error al publicar el workflow')
    console.error('Error publishing workflow:', error)
  }
}

const handleExecute = async () => {
  if (props.activeTab === 'execution') return
  emit('update:activeTab', 'execution')
  if (!canvasExecuteStore.workerInfo) canvasExecuteStore.handleExecuteWorkflow({ workflowId: workflowId.value })
}

const handleReload = async () => {
  isReloading.value = true
  canvasExecuteStore.handleExecuteWorkflow({ workflowId: workflowId.value })
}

const handleStopWorker = async () => {
  try {
    const result = await canvasExecuteStore.stopWorker()
    if (result.success) {
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

watch(() => canvasStore.workerInfo, () => {
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
