<template>
  <div v-if="isVisible" class="fixed inset-0 z-50 flex items-center justify-center bg-black/20" @click="closeMenu">
    <div class="bg-base-200 border border-base-300 rounded-lg shadow-lg py-2 min-w-[160px]" @click.stop>
      <!-- Información de la conexión -->
      <div class="px-4 py-2 border-b border-base-300 text-sm">
        <div class="font-medium text-base-content/80">Conexión</div>
        <div class="text-xs text-base-content/60 mt-1">
          {{ connectionInfo?.nodeOrigin?.info?.name || 'Origen' }} → {{ connectionInfo?.nodeDestiny?.info?.name ||
          'Destino' }}
        </div>
        <div class="text-xs text-base-content/60">
          {{ connectionInfo?.output }} → {{ connectionInfo?.input }}
        </div>
      </div>

      <!-- Opción: Eliminar conexión -->
      <button @click="handleDelete"
        class="w-full px-4 py-2 text-left hover:bg-error hover:text-error-content flex items-center gap-2 text-error">
        <span class="mdi mdi-delete text-sm"></span>
        Eliminar conexión
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { INodeCanvas } from '../../canvas/interfaz/node.interface'

interface ConnectionInfo {
  id: string
  nodeOrigin: INodeCanvas
  nodeDestiny: INodeCanvas
  input: string
  output: string
}

interface Props {
  isVisible: boolean
  connectionInfo: ConnectionInfo | null
}

interface Emits {
  (e: 'close'): void
  (e: 'delete', connectionId: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const closeMenu = () => {
  emit('close')
}

const handleDelete = () => {
  if (props.connectionInfo) {
    emit('delete', props.connectionInfo.id)
  }
  closeMenu()
}
</script>

<style scoped>
.z-60 {
  z-index: 60;
}
</style>
