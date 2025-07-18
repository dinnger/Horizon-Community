<template>
  <div v-if="isVisible" class="fixed inset-0 z-50 flex items-center justify-center bg-black/20" @click="closeMenu">
    <div class="bg-base-200 border border-base-300 rounded-lg shadow-lg py-2 min-w-[160px]" @click.stop>
      <!-- Opción: Editar grupo -->
      <button @click="handleEditGroup" class="w-full px-4 py-2 text-left hover:bg-base-300 flex items-center gap-2">
        <span class="mdi mdi-pencil text-sm"></span>
        Editar grupo
      </button>

      <!-- Opción: Desagrupar -->
      <button @click="handleUngroup" class="w-full px-4 py-2 text-left hover:bg-base-300 flex items-center gap-2">
        <span class="mdi mdi-group-off text-sm"></span>
        Desagrupar
      </button>

      <!-- Separador -->
      <div class="border-t border-base-300 my-1"></div>

      <!-- Opción: Eliminar grupo -->
      <button @click="handleDeleteGroup"
        class="w-full px-4 py-2 text-left hover:bg-error hover:text-error-content flex items-center gap-2 text-error">
        <span class="mdi mdi-delete text-sm"></span>
        Eliminar grupo
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { INodeGroupCanvas } from '../../canvas/interfaz/group.interface'

interface Props {
  isVisible: boolean
  selectedGroup: INodeGroupCanvas | null
}

interface Emits {
  (e: 'close'): void
  (e: 'editGroup', group: INodeGroupCanvas): void
  (e: 'ungroup', group: INodeGroupCanvas): void
  (e: 'deleteGroup', group: INodeGroupCanvas): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const closeMenu = () => {
  emit('close')
}

const handleEditGroup = () => {
  if (props.selectedGroup) {
    emit('editGroup', props.selectedGroup)
  }
  closeMenu()
}

const handleUngroup = () => {
  if (props.selectedGroup) {
    emit('ungroup', props.selectedGroup)
  }
  closeMenu()
}

const handleDeleteGroup = () => {
  if (props.selectedGroup) {
    emit('deleteGroup', props.selectedGroup)
  }
  closeMenu()
}
</script>

<style scoped>
.z-60 {
  z-index: 60;
}
</style>
