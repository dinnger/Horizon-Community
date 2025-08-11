<template>
  <div v-if="isVisible" class="fixed inset-0 z-50  justify-center bg-black/20" @click="closeMenu"
    @contextmenu.stop.prevent="() => false" @keydown.escape="closeMenu">
    <div class="bg-base-200 border border-base-300 rounded-lg shadow-lg  w-[250px] absolute overflow-hidden" @click.stop
      :style="{ left: menuPosition.x + 'px', top: menuPosition.y + 'px' }">
      <!-- Opción: Cambiar nombre (solo si es un nodo) -->
      <div v-if="isSingleNode" class="p-3 border-b border-base-300"
        :style="{ backgroundColor: selectedNodes[0].info.color }">
        <span class="material-icons text-base-content/80">{{ selectedNodes[0].info.icon }}</span>
        {{ selectedNodes[0].info.name }}
      </div>
      <div v-else="isSingleNode" class="p-3 border-b bg-primary">
        <span class="mdi mdi-selection-multiple text-base-content/80"></span>
        Selección Multiple
      </div>

      <button v-if="isSingleNode" @click="handleRename"
        class="w-full px-4 py-2 text-left hover:bg-base-300 flex items-center gap-2">
        <span class="mdi mdi-pencil text-sm"></span>
        Cambiar nombre
      </button>

      <!-- Opción: Duplicar (solo si es un nodo) -->
      <button @click="handleDuplicate" class="w-full px-4 py-2 text-left hover:bg-base-300 flex items-center gap-2">
        <span class="mdi mdi-content-copy text-sm"></span>
        Duplicar{{ selectedNodes.length > 1 ? ` (${selectedNodes.length})` : '' }}
      </button>

      <!-- Separador -->
      <div class="border-t border-base-300 my-1"></div>

      <!-- Opción: Crear grupo (solo si hay múltiples nodos seleccionados) -->
      <button v-if="hasMultipleNodes" @click="handleCreateGroup"
        class="w-full px-4 py-2 text-left hover:bg-base-300 flex items-center gap-2">
        <span class="mdi mdi-group text-sm"></span>
        Crear grupo ({{ selectedNodes.length }} nodos)
      </button>

      <!-- Separador -->
      <div v-if="hasMultipleNodes" class="border-t border-base-300 my-1"></div>

      <!-- Opción: Eliminar -->
      <button @click="handleDelete"
        class="w-full px-4 py-2 text-left hover:bg-error hover:text-error-content flex items-center gap-2 text-error">
        <span class="mdi mdi-delete text-sm"></span>
        Eliminar{{ selectedNodes.length > 1 ? ` (${selectedNodes.length})` : '' }}
      </button>
    </div>

    <!-- Modal para cambiar nombre -->
    <div v-if="showRenameModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-60"
      @click="closeRenameModal">
      <div class="bg-base-100 rounded-lg p-6 w-96 max-w-[90vw]" @click.stop>
        <h3 class="text-lg font-semibold mb-4">Cambiar nombre del nodo</h3>

        <div class="form-control mb-4">
          <label class="label">
            <span class="label-text">Nuevo nombre</span>
          </label>
          <input ref="nameInput" v-model="newNodeName" type="text" class="input input-bordered w-full"
            @keyup.enter="confirmRename" @keyup.escape="closeRenameModal" />
        </div>

        <div class="flex justify-end gap-2">
          <button @click="closeRenameModal" class="btn btn-ghost">
            Cancelar
          </button>
          <button @click="confirmRename" class="btn btn-primary" :disabled="!newNodeName.trim()">
            Guardar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'
import type { INodeCanvas } from '../../canvas/interfaz/node.interface'

interface Props {
  isVisible: boolean
  selectedNodes: INodeCanvas[]
  position: { x: number; y: number }
}

interface Emits {
  (e: 'close'): void
  (e: 'delete', nodes: INodeCanvas[]): void
  (e: 'duplicate', node: INodeCanvas[]): void
  (e: 'rename', node: INodeCanvas, newName: string): void
  (e: 'createGroup', nodeIds: string[]): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const nameInput = ref<HTMLInputElement>()
const showRenameModal = ref(false)
const newNodeName = ref('')

const isSingleNode = computed(() => props.selectedNodes.length === 1)
const hasMultipleNodes = computed(() => props.selectedNodes.length > 1)

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

const closeMenu = () => {
  emit('close')
}

const handleCreateGroup = () => {
  if (hasMultipleNodes.value) {
    const nodeIds = props.selectedNodes
      .map(node => node.id)
      .filter((id): id is string => Boolean(id))
    emit('createGroup', nodeIds)
  }
  closeMenu()
}

const handleDelete = () => {
  emit('delete', props.selectedNodes)
  closeMenu()
}

const handleDuplicate = () => {
  emit('duplicate', props.selectedNodes)
  closeMenu()
}

const handleRename = () => {
  if (isSingleNode.value) {
    newNodeName.value = props.selectedNodes[0].info.name
    showRenameModal.value = true
    nextTick(() => {
      nameInput.value?.focus()
      nameInput.value?.select()
    })
  }
}

const closeRenameModal = () => {
  showRenameModal.value = false
  newNodeName.value = ''
}

const confirmRename = () => {
  if (isSingleNode.value && newNodeName.value.trim()) {
    emit('rename', props.selectedNodes[0], newNodeName.value.trim())
    closeRenameModal()
    closeMenu()
  }
}

// Cerrar el modal cuando se oculta el menú principal
watch(() => props.isVisible, (visible) => {
  if (!visible) {
    closeRenameModal()
  }
})
</script>

<style scoped>
.z-60 {
  z-index: 60;
}
</style>
