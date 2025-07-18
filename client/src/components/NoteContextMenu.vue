<template>
  <div v-if="isVisible" class="fixed inset-0 z-50" @click="$emit('close')">
    <div class="absolute bg-base-100 shadow-xl rounded-lg border border-base-300 min-w-48"
      :style="{ left: menuPosition.x + 'px', top: menuPosition.y + 'px' }" @click.stop>
      <div class="p-2">
        <ul class="menu menu-sm">
          <li>
            <a @click="editNote" class="flex items-center gap-2">
              <span class="mdi mdi-pencil"></span>
              Editar Nota
            </a>
          </li>
          <li>
            <a @click="deleteNote" class="flex items-center gap-2 text-error">
              <span class="mdi mdi-delete"></span>
              Eliminar Nota
            </a>
          </li>
        </ul>
      </div>
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

  const confirmMessage = '¿Estás seguro de que quieres eliminar esta nota?'
  if (confirm(confirmMessage)) {
    emit('delete', props.note.id)
  }
  emit('close')
}
</script>
