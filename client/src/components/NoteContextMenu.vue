<template>
  <div v-if="isVisible" class="fixed inset-0 z-50 flex items-center justify-center bg-black/20" @click="$emit('close')"
    @contextmenu.stop.prevent="() => false" @keydown.escape="$emit('close')">
    <div class="bg-base-200 border border-base-300 rounded-lg shadow-lg  w-[250px] absolute overflow-hidden" @click.stop
      :style="{ left: menuPosition.x + 'px', top: menuPosition.y + 'px' }" p>

      <div class="p-3 border-b bg-primary">
        <span class="mdi mdi-selection-multiple text-base-content/80"></span>
        Nota
      </div>

      <button @click="editNote" class="w-full px-4 py-2 text-left hover:bg-base-300 flex items-center gap-2">
        <span class="mdi mdi-pencil"></span>
        Editar Nota
      </button>

      <button @click="deleteNote"
        class="w-full px-4 py-2 text-left hover:bg-base-300 flex items-center gap-2 text-error">
        <span class="mdi mdi-delete"></span>
        Eliminar Nota
      </button>

    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { INoteCanvas } from '@canvas/interfaz/note.interface'

const props = defineProps<{
  isVisible: boolean
  note: INoteCanvas | null
  position: { x: number; y: number }
}>()

const emit = defineEmits<{
  close: []
  edit: [INoteCanvas]
  delete: [string]
}>()

const menuPosition = computed(() => {
  // Ajustar posición para que no salga de la pantalla
  const menuWidth = 150
  const menuHeight = 100

  let x = props.position.x
  let y = props.position.y

  if (x + menuWidth > window.innerWidth) {
    x = window.innerWidth - menuWidth - 10
  }

  if (y + menuHeight > window.innerHeight) {
    y = window.innerHeight - menuHeight - 10
  }

  return { x, y }
})

const editNote = () => {
  if (!props.note) return
  emit('edit', props.note)
  emit('close')
}

const deleteNote = () => {
  if (!props.note) return

  emit('delete', props.note.id)
  emit('close')
}
</script>
