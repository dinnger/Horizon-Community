<template>
  <div class="bg-base-200 border-b border-base-300 h-[55px] p-2 flex items-center justify-between relative">
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
            d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        Debug
      </button>

      <button class="btn btn-success btn-sm" @click="handleSave" :disabled="!canvasStore.changes">
        <span class="mdi mdi-content-save"></span>
        Guardar
      </button>

      <button class="btn btn-primary btn-sm" @click="handlePublish">
        <span class="mdi mdi-upload"></span>
        Publicar
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDebugConsoleStore, useCanvas } from '@/stores'
import VersionControlPanel from '@/components/VersionControlPanel.vue'
import { toast } from 'vue-sonner';
import { useRouter } from 'vue-router';

const router = useRouter()

interface Props {
  projectName: string
}

defineProps<Props>()

defineEmits<{
  showNotesManager: []
}>()

const debugStore = useDebugConsoleStore()
const canvasStore = useCanvas()

const handleSave = async () => {
  const startTime = Date.now()
  await canvasStore.save()
  toast.success('Workflow guardado exitosamente')
}

const handlePublish = async () => {
  try {
    // Primero guardamos el workflow
    await canvasStore.publish(router.currentRoute.value.params.id as string)
    toast.success('Workflow agregado a la cola de despliegue exitosamente')
  } catch (error) {
    debugStore.addLog('error', `Error al preparar la publicación del workflow: ${error}`, 'Canvas', { error })
    toast.error('Error al preparar la publicación del workflow')
  }
}
</script>
