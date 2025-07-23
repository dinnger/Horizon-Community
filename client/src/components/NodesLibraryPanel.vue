<template>
  <div v-if="isVisible" class="fixed inset-0 z-50 flex items-center justify-center" @click.self="hidePanel">

    <!-- Overlay -->
    <div class="absolute inset-0 bg-black/20 backdrop-blur-sm"></div>

    <!-- Panel de command palette centrado -->
    <div
      class="relative w-full max-w-2xl mx-4 bg-base-100/70 backdrop-blur-xl rounded-2xl shadow-2xl border border-base-300/70 flex flex-col max-h-[80vh] animate-in fade-in slide-in-from-bottom-4 duration-300">
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b border-base-300/50">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <span class="mdi mdi-puzzle text-primary text-xl"></span>
          </div>
          <div>
            <h2 class="text-lg font-bold text-base-content">Librería de Nodos</h2>
            <p class="text-sm text-base-content/60">Busca y agrega nodos a tu workflow</p>
          </div>
        </div>
        <button @click="hidePanel" class="btn btn-ghost btn-circle btn-sm hover:bg-base-300/50">
          <span class="mdi mdi-close text-lg"></span>
        </button>
      </div>

      <!-- Barra de búsqueda -->
      <div class="p-6 border-b border-base-300/30">
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <span class="mdi mdi-magnify text-base-content/40"></span>
          </div>
          <input v-model="searchQuery" type="text" placeholder="Buscar nodos..."
            class="input input-bordered w-full pl-12 bg-base-200/50 border-base-300/50 focus:border-primary/50 focus:bg-base-100 transition-all duration-200"
            autofocus />
          <kbd v-if="!searchQuery"
            class="absolute inset-y-0 right-0 pr-4 flex items-center text-xs text-base-content/40">
            ESC
          </kbd>
        </div>
      </div>

      <!-- Lista de nodos -->
      <div class="flex-1 overflow-y-auto px-2 pb-4">
        <!-- Resultados de búsqueda -->
        <div v-if="searchQuery" class="px-4">
          <div class="mb-4 flex items-center justify-between">
            <h3 class="text-sm font-semibold text-base-content/70">
              Resultados ({{ searchResults.length }})
            </h3>
            <span v-if="searchResults.length === 0" class="text-xs text-base-content/50">
              No se encontraron nodos
            </span>
          </div>
          <div class="space-y-1">
            <div v-for="(node, index) in searchResults" :key="node.id" @click="selectNode(node)" :class="[
              'group p-4 rounded-xl border border-base-300/30 hover:border-primary/30 hover:bg-primary/5 cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-md',
              { 'selected-item': selectedIndex === index }
            ]">
              <div class="flex items-center space-x-4">
                <div
                  class="w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg shadow-sm group-hover:scale-110 transition-transform duration-200"
                  :style="{ backgroundColor: node.info.color }">
                  {{ node.info.icon }}
                </div>
                <div class="flex-1 min-w-0">
                  <h4 class="font-semibold text-base truncate group-hover:text-primary transition-colors">
                    {{ node.info.name }}
                  </h4>
                  <p class="text-sm text-base-content/60 truncate mt-1">{{ node.info.desc }}</p>
                  <span
                    class="inline-flex items-center px-2 py-1 rounded-md bg-base-200/50 text-xs text-base-content/50 mt-2">
                    {{ node.info.group }}
                  </span>
                </div>
                <div class="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <kbd class="kbd kbd-sm">↵</kbd>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Navegación por grupos -->
        <div v-else class="px-4">
          <!-- Vista de grupos principales -->
          <div v-if="!selectedGroup" class="space-y-2">
            <h3 class="text-sm font-semibold mb-4 text-base-content/70 flex items-center gap-2">
              <span class="mdi mdi-folder-multiple"></span>
              Categorías
            </h3>
            <div v-for="(group, groupName, index) in nodeGroups" :key="groupName"
              @click="selectGroup(String(groupName))" :class="[
                'group p-4 rounded-xl border border-base-300/30 hover:border-primary/30 hover:bg-primary/5 cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-md',
                { 'selected-item': selectedIndex === index }
              ]">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div
                    class="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                    <span class="mdi mdi-folder text-primary"></span>
                  </div>
                  <div>
                    <h4 class="font-semibold group-hover:text-primary transition-colors">{{ groupName }}</h4>
                    <p class="text-sm text-base-content/60">
                      {{ group.nodes.length }} nodos
                      <span v-if="group.subgroups && group.subgroups.length > 0">
                        • {{ group.subgroups.length }} subcategorías
                      </span>
                    </p>
                  </div>
                </div>
                <div
                  class="opacity-0 group-hover:opacity-100 transition-all duration-200 transform group-hover:translate-x-1">
                  <span class="mdi mdi-chevron-right text-primary"></span>
                </div>
              </div>
            </div>
          </div>

          <!-- Vista de grupo seleccionado -->
          <div v-else>
            <!-- Botón volver -->
            <button @click="selectedGroup = null; selectedSubgroup = null"
              class="flex items-center space-x-2 mb-6 text-sm text-base-content/70 hover:text-primary transition-colors group">
              <span class="mdi mdi-arrow-left group-hover:-translate-x-1 transition-transform"></span>
              <span>Volver a categorías</span>
            </button>

            <div class="flex items-center gap-3 mb-6">
              <div
                class="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                <span class="mdi mdi-folder-open text-primary"></span>
              </div>
              <h3 class="text-lg font-bold text-base-content">{{ selectedGroup }}</h3>
            </div>

            <!-- Nodos directos del grupo -->
            <div v-if="nodeGroups[selectedGroup]?.nodes.length > 0 && !selectedSubgroup" class="space-y-2 mb-6">
              <h4 class="text-sm font-semibold text-base-content/70 mb-3">Nodos</h4>
              <div v-for="(node, index) in nodeGroups[selectedGroup].nodes" :key="node.id" @click="selectNode(node)"
                :class="[
                  'group p-4 rounded-xl border border-base-300/30 hover:border-primary/30 hover:bg-primary/5 cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-md',
                  { 'selected-item': selectedIndex === index }
                ]">
                <div class="flex items-center space-x-4">
                  <div
                    class="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm shadow-sm group-hover:scale-110 transition-transform duration-200"
                    :style="{ backgroundColor: node.info.color }">
                    {{ node.info.icon }}
                  </div>
                  <div class="flex-1 min-w-0">
                    <h4 class="font-semibold text-sm truncate group-hover:text-primary transition-colors">{{
                      node.info.name }}</h4>
                    <p class="text-xs text-base-content/60 truncate mt-1">{{ node.info.desc }}</p>
                  </div>
                  <div class="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <kbd class="kbd kbd-sm">↵</kbd>
                  </div>
                </div>
              </div>
            </div>

            <!-- Subgrupos -->
            <div
              v-if="nodeGroups[selectedGroup]?.subgroups && nodeGroups[selectedGroup].subgroups!.length > 0 && !selectedSubgroup"
              class="space-y-2">
              <h4 class="text-sm font-semibold text-base-content/70 mb-3">Subcategorías</h4>
              <div v-for="(subgroup, index) in nodeGroups[selectedGroup].subgroups" :key="subgroup"
                @click="selectSubgroup(subgroup)" :class="[
                  'group p-4 rounded-xl border border-base-300/30 hover:border-primary/30 hover:bg-primary/5 cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-md',
                  { 'selected-item': selectedIndex === (nodeGroups[selectedGroup]?.nodes?.length || 0) + index }
                ]">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div
                      class="w-8 h-8 rounded-lg bg-gradient-to-br from-secondary/20 to-secondary/10 flex items-center justify-center">
                      <span class="mdi mdi-folder text-secondary text-sm"></span>
                    </div>
                    <div>
                      <h4 class="font-semibold group-hover:text-primary transition-colors">{{ subgroup }}</h4>
                      <p class="text-sm text-base-content/60">
                        {{ getNodesBySubgroup(selectedGroup, subgroup).length }} nodos
                      </p>
                    </div>
                  </div>
                  <div
                    class="opacity-0 group-hover:opacity-100 transition-all duration-200 transform group-hover:translate-x-1">
                    <span class="mdi mdi-chevron-right text-primary"></span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Nodos del subgrupo -->
            <div v-if="selectedSubgroup" class="space-y-2">
              <button @click="selectedSubgroup = null"
                class="flex items-center space-x-2 mb-6 text-sm text-base-content/70 hover:text-primary transition-colors group">
                <span class="mdi mdi-arrow-left group-hover:-translate-x-1 transition-transform"></span>
                <span>Volver a {{ selectedGroup }}</span>
              </button>

              <div class="flex items-center gap-3 mb-6">
                <div
                  class="w-10 h-10 rounded-lg bg-gradient-to-br from-secondary/20 to-secondary/10 flex items-center justify-center">
                  <span class="mdi mdi-folder-open text-secondary"></span>
                </div>
                <h4 class="text-lg font-bold text-base-content">{{ selectedSubgroup }}</h4>
              </div>

              <div v-for="(node, index) in getNodesBySubgroup(selectedGroup, selectedSubgroup)" :key="node.id"
                @click="selectNode(node)" :class="[
                  'group p-4 rounded-xl border border-base-300/30 hover:border-primary/30 hover:bg-primary/5 cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-md',
                  { 'selected-item': selectedIndex === index }
                ]">
                <div class="flex items-center space-x-4">
                  <div
                    class="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm shadow-sm group-hover:scale-110 transition-transform duration-200"
                    :style="{ backgroundColor: node.info.color }">
                    {{ node.info.icon }}
                  </div>
                  <div class="flex-1 min-w-0">
                    <h4 class="font-semibold text-sm truncate group-hover:text-primary transition-colors">{{
                      node.info.name }}</h4>
                    <p class="text-xs text-base-content/60 truncate mt-1">{{ node.info.desc }}</p>
                  </div>
                  <div class="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <kbd class="kbd kbd-sm">↵</kbd>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer con atajos de teclado -->
      <div class="p-4 border-t border-base-300/30 bg-base-50/50">
        <div class="flex items-center justify-between text-xs text-base-content/50">
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-1">
              <kbd class="kbd kbd-xs">↑↓</kbd>
              <span>navegar</span>
            </div>
            <div class="flex items-center gap-1">
              <kbd class="kbd kbd-xs">↵</kbd>
              <span>seleccionar</span>
            </div>
            <div class="flex items-center gap-1">
              <kbd class="kbd kbd-xs">Tab</kbd>
              <span>abrir</span>
            </div>
          </div>
          <div class="flex items-center gap-1">
            <kbd class="kbd kbd-xs">ESC</kbd>
            <span>cerrar</span>
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

const emit = defineEmits<{
  nodeSelected: [node: INodeCanvas]
  close: []
}>()

const nodesStore = useNodesLibraryStore()
const searchQuery = ref('')
const selectedGroup = ref<string | null>(null)
const selectedSubgroup = ref<string | null>(null)
const selectedIndex = ref(0)

const isVisible = computed(() => nodesStore.isNodePanelVisible)
const nodeGroups = computed(() => nodesStore.nodeGroups)
const getNodesBySubgroup = computed(() => nodesStore.getNodesBySubgroup)

const searchResults = computed(() => {
  if (!searchQuery.value) return []
  const data = nodesStore.searchNodes(searchQuery.value)
  return data
})

// Lista de elementos navegables
const navigableItems = computed(() => {
  if (searchQuery.value) {
    return searchResults.value
  }

  if (!selectedGroup.value) {
    return Object.keys(nodeGroups.value)
  }

  if (selectedSubgroup.value) {
    return getNodesBySubgroup.value(selectedGroup.value, selectedSubgroup.value)
  }

  const items = []
  // Añadir nodos directos
  if (nodeGroups.value[selectedGroup.value]?.nodes) {
    items.push(...nodeGroups.value[selectedGroup.value].nodes)
  }
  // Añadir subgrupos
  if (nodeGroups.value[selectedGroup.value]?.subgroups) {
    items.push(...(nodeGroups.value[selectedGroup.value].subgroups || []))
  }
  return items
})

const hidePanel = () => {
  nodesStore.hideNodePanel()
  emit('close')
}

const selectGroup = (groupName: string) => {
  selectedGroup.value = groupName
  selectedSubgroup.value = null
  selectedIndex.value = 0
}

const selectSubgroup = (subgroupName: string) => {
  selectedSubgroup.value = subgroupName
  selectedIndex.value = 0
}

const selectNode = (node: INodeCanvas) => {
  emit('nodeSelected', node)
  hidePanel()
}

// Navegación con teclado
const handleKeyDown = (event: KeyboardEvent) => {
  if (!isVisible.value) return

  switch (event.key) {
    case 'Escape':
      event.preventDefault()
      if (selectedSubgroup.value) {
        selectedSubgroup.value = null
        selectedIndex.value = 0
      } else if (selectedGroup.value) {
        selectedGroup.value = null
        selectedIndex.value = 0
      } else {
        hidePanel()
      }
      break

    case 'ArrowDown':
      event.preventDefault()
      selectedIndex.value = Math.min(selectedIndex.value + 1, navigableItems.value.length - 1)
      break

    case 'ArrowUp':
      event.preventDefault()
      selectedIndex.value = Math.max(selectedIndex.value - 1, 0)
      break

    case 'Enter':
      event.preventDefault()
      {
        const currentItem = navigableItems.value[selectedIndex.value]
        if (!currentItem) return

        if (searchQuery.value) {
          // En búsqueda, seleccionar nodo
          selectNode(currentItem as INodeCanvas)
        } else if (!selectedGroup.value) {
          // En vista de grupos principales
          selectGroup(currentItem as string)
        } else if (selectedSubgroup.value) {
          // En subgrupo, seleccionar nodo
          selectNode(currentItem as INodeCanvas)
        } else {
          // En grupo, determinar si es nodo o subgrupo
          if (typeof currentItem === 'string') {
            selectSubgroup(currentItem)
          } else {
            selectNode(currentItem as INodeCanvas)
          }
        }
      }
      break
  }
}

// Limpiar estado cuando se cierra el panel
watch(isVisible, (newVal) => {
  if (!newVal) {
    searchQuery.value = ''
    selectedGroup.value = null
    selectedSubgroup.value = null
    selectedIndex.value = 0
  } else {
    // Enfocar en la barra de búsqueda cuando se abre
    nextTick(() => {
      const searchInput = document.querySelector('input[placeholder="Buscar nodos..."]') as HTMLInputElement
      if (searchInput) {
        searchInput.focus()
      }
    })
  }
})

// Resetear índice cuando cambian los elementos navegables
watch([searchQuery, selectedGroup, selectedSubgroup], () => {
  selectedIndex.value = 0
})

onMounted(() => {
  document.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
})
</script>

<style scoped>
/* Animaciones de entrada */
@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@keyframes slideInFromBottom {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.animate-in {
  animation: slideInFromBottom 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-in {
  animation: fadeIn 0.2s ease-out;
}

.slide-in-from-bottom-4 {
  animation: slideInFromBottom 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

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

/* Mejores transiciones */
.transition-all {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 200ms;
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
