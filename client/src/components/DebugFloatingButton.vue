<template>
  <!-- Botón flotante para debug -->
  <div v-if="!debugStore.isVisible" class="fixed bottom-4 right-4 z-30">
    <button @click="debugStore.showPanel()"
      class="btn btn-circle btn-primary shadow-lg hover:shadow-xl transition-all duration-200"
      title="Abrir Panel de Debug (Ctrl+D)">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useDebugConsoleStore } from '@/stores/debugConsole'

const debugStore = useDebugConsoleStore()

// Manejo de teclas de acceso rápido
const handleKeydown = (event: KeyboardEvent) => {
  // Ctrl+D para toggle del panel de debug
  if (event.ctrlKey && event.key === 'd') {
    event.preventDefault()
    debugStore.togglePanel()
  }

  // Escape para cerrar el panel
  if (event.key === 'Escape' && debugStore.isVisible) {
    event.preventDefault()
    debugStore.hidePanel()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>
