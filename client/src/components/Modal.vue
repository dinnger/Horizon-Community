<template>
  <div v-if="isVisible" class="fixed inset-0 z-50 flex items-center justify-center bottom-0 left-0 right-0">

    <!-- Overlay -->
    <div class="absolute inset-0 bg-black/20 backdrop-blur-sm"></div>

    <!-- Panel de command palette centrado -->
    <div
      class="relative w-[80vw] max-w-[1000px] mx-4 bg-base-100/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-base-300/70 flex flex-col max-h-[80vh] ">
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b border-base-300/50">
        <div class="flex items-center gap-3">
          <div>
            <h2 class="text-lg font-bold text-base-content">{{ title }}</h2>
            <p class="text-sm text-base-content/60">{{ description }}</p>
          </div>
        </div>
        <button @click="hidePanel" class="btn btn-ghost btn-circle btn-sm hover:bg-base-300/50">
          <span class="mdi mdi-close text-lg"></span>
        </button>
      </div>

      <div :class="`h-[60vh] overflow-auto ${customClass} ${twoPanels ?
        'flex flex-col md:gap-3 md:flex-row md:[&>*:first-child]:basis-[240px] md:[&>*:first-child]:bg-base-200  md:[&>*:first-child]:shrink-0 md:[&>*:last-child]:flex-1 md:[&>*]:overflow-auto [&>*]:p-4' :
        'p-2'}`">
        <slot />
      </div>

      <!-- Footer con atajos de teclado -->
      <div class="p-4 border-t border-base-300/30 bg-base-50/50">
        <div class="flex items-center justify-between text-xs text-base-content/50">
          <div class="flex items-center gap-1">
            <kbd class="kbd kbd-xs">ESC</kbd>
            <span>cerrar</span>
          </div>
          <div>
            <slot name="actions"></slot>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useNodesLibraryStore } from '@/stores/nodesLibrary'
import type { INodeCanvas } from '@canvas/interfaz/node.interface'

const props = defineProps<{
  title?: string
  description?: string
  isVisible: boolean,
  twoPanels?: boolean
  customClass?: string
}>()

const emit = defineEmits<{
  nodeSelected: [node: INodeCanvas]
  close: []
}>()
const nodesStore = useNodesLibraryStore()

const hidePanel = () => {
  emit('close')
}

</script>

<style scoped>
/* Efecto de vidrio mejorado */
.bg-base-100\/95 {
  background-color: hsl(var(--b1) / 0.95);
}

.backdrop-blur-xl {
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
}

/* Estilos para elementos hover mejorados */
.group:hover .group-hover\:scale-110 {
  transform: scale(1.1);
}

.group:hover .group-hover\:-translate-x-1 {
  transform: translateX(-0.25rem);
}

.group:hover .group-hover\:translate-x-1 {
  transform: translateX(0.25rem);
}

.group:hover .group-hover\:text-primary {
  color: hsl(var(--p));
}

/* Estilo para elementos seleccionados con teclado */
.selected-item {
  border-color: hsl(var(--p) / 0.5);
  background-color: hsl(var(--p) / 0.1);
  box-shadow: 0 0 0 2px hsl(var(--p) / 0.2);
}


/* Hover personalizado para preservar las animaciones */
.hover\:scale-\[1\.02\]:hover {
  transform: scale(1.02);
}

.hover\:shadow-md:hover {
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
}

/* Input focus mejorado */
.focus\:border-primary\/50:focus {
  border-color: hsl(var(--p) / 0.5);
}

/* Estilos de los badges de teclado */
.kbd {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace;
  background-color: hsl(var(--b2));
  border: 1px solid hsl(var(--b3));
  border-radius: 0.25rem;
}

.kbd-xs {
  padding: 0.125rem 0.375rem;
  font-size: 0.75rem;
}

.kbd-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
}

/* Scrollbar personalizada */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: hsl(var(--bc) / 0.2);
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: hsl(var(--bc) / 0.3);
}
</style>
