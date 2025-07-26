<template>

  <div class="bg-base-100/70 p-2 right-0 absolute z-10 m-[15px]  backdrop-blur-md rounded-lg join">
    <button class="btn btn-info btn-sm" @click="handlePublish">
      <span class="mdi mdi-upload"></span>
      Publicar
    </button>
    <div class="border-l border-base-300 ml-1 mr-1 h-8 relative"></div>
    <button class="btn btn-primary btn-sm" @click="handleSave" :disabled="!canvasComposable.changes.value">
      <span class="mdi mdi-content-save"></span>
      Guardar
    </button>
  </div>

</template>

<script setup lang="ts">
// import VersionControlPanel from '@/components/VersionControlPanel.vue'
import { toast } from 'vue-sonner'
import { useRouter } from 'vue-router'
import { computed, ref, watch } from 'vue'
import type { IUseCanvasType } from '@/composables/useCanvas.composable'

interface Props {
  workflowId: string
  canvasComposable: IUseCanvasType
}

const props = defineProps<Props>()


const emit = defineEmits<{
  showNotesManager: []
}>()

const handleSave = async () => {
  try {
    await props.canvasComposable.save({ workflowId: props.workflowId })
    toast.success('Workflow guardado correctamente')
  } catch (error) {
    toast.error('Error al guardar el workflow')
    console.error('Error saving workflow:', error)
  }
}

const handlePublish = async () => {
  try {
    await props.canvasComposable.publish({ workflowId: props.workflowId })

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
