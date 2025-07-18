<template>
  <div v-if="isVisible" class="fixed inset-0 z-50" @click="$emit('close')">
    <div class="absolute bg-base-100 shadow-xl rounded-lg border border-base-300 min-w-48"
      :style="{ left: menuPosition.x + 'px', top: menuPosition.y + 'px' }" @click.stop>
      <div class="p-2">
        <ul class="menu menu-sm">
          <li>
            <a @click="addNote" class="flex items-center gap-2">
              <span class="mdi mdi-note-plus"></span>
              Agregar Nota
            </a>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  isVisible: boolean
  position: { x: number; y: number }
}>()

const emit = defineEmits<{
  close: []
  addNote: [{ position: { x: number; y: number } }]
}>()

const menuPosition = computed(() => {
  // Ajustar posición para que no salga de la pantalla
  const menuWidth = 200
  const menuHeight = 60

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

const addNote = () => {
  emit('addNote', { position: props.position })
  emit('close')
}
</script>
