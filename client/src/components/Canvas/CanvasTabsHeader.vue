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

        <!-- Botón del Panel de Debug -->
        <button class="btn btn-ghost btn-sm" @click="debugStore.togglePanel()"
          :class="{ 'btn-active': debugStore.isVisible }" title="Panel de Debug y Consola">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 002 2z" />
          </svg>
          Debug
        </button>

        <!-- Botones de acción en pestaña de diseño -->
        <template v-if="activeTab === 'design'">
          <button class="btn btn-success btn-sm" @click="handleSave" :disabled="!canvasStore.changes">
            <span class="mdi mdi-content-save"></span>
            Guardar
          </button>
        </template>
        <button class="btn btn-primary btn-sm" @click="handlePublish">
          <span class="mdi mdi-upload"></span>
          Publicar
        </button>
        <!-- <div class="flex items-center space-x-2">
          <div class="dropdown dropdown-end">
            <label tabindex="0" class="btn btn-sm btn-success" :class="{ 'loading': isExecuting }">
              <span v-if="!isExecuting" class="mdi mdi-play"></span>
              {{ isExecuting ? 'Ejecutando...' : 'Ejecutar' }}
              <span v-if="!isExecuting" class="mdi mdi-chevron-down ml-1"></span>
            </label>
            <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
              <li><a @click="() => canvasStore.handleExecuteWorkflow()">Ejecutar Última Versión</a></li>
              <li><a @click="canvasStore.handleExecuteWithVersionSelection">Ejecutar Versión Específica...</a></li>
            </ul>
          </div>
        </div> -->
      </div>
    </div>

    <!-- Pestañas -->
    <div class="bg-base-100/70 p-2 absolute z-10 m-2  backdrop-blur-md rounded-lg join">
      <button class="btn btn-sm join-item"
        :class="{ 'btn-primary': activeTab === 'design', 'btn-soft': activeTab !== 'design' }"
        @click="$emit('update:activeTab', 'design')">
        <span class="mdi mdi-drawing mr-2"></span>
        Diseño
      </button>
      <button class="btn btn-sm join-item"
        :class="{ 'btn-primary': activeTab === 'execution', 'btn-soft': activeTab !== 'execution' }"
        @click="$emit('update:activeTab', 'execution')">
        <span class="mdi mdi-play mr-2"></span>
        Ejecución
        <span v-if="isExecuting" class="loading loading-spinner loading-xs ml-2"></span>
        <div v-if="isExecuting" class="badge badge-warning badge-xs ml-2">Activo</div>
      </button>
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
import { useDebugConsoleStore, useCanvas } from '@/stores'
import VersionControlPanel from '@/components/VersionControlPanel.vue'
import { toast } from 'vue-sonner'
import { useRouter } from 'vue-router'

interface Props {
  projectName: string
  activeTab: 'design' | 'execution'
  isExecuting: boolean
  version: string
}

defineProps<Props>()

const debugStore = useDebugConsoleStore()
const canvasStore = useCanvas()
const router = useRouter()

defineEmits<{
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
