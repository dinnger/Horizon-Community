<template>
  <Modal :isVisible="isVisible" @close="hidePanel" width="70vh" title="Nodos disponibles"
    description="Selecciona un nodo para ver sus propiedades">
    <!-- Barra de búsqueda -->
    <div class="flex flex-col h-full">
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
                  class="w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg shadow-sm group-hover:scale-110 transition-transform duration-200 material-icons"
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
        <div v-else class="px-4 ">
          <!-- Vista de grupos principales -->
          <div v-if="!selectedGroup" class="space-y-2 ">
            <h3 class="text-sm font-semibold mb-4 text-base-content/70 flex items-center gap-2 pt-2">
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
                    class="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm shadow-sm group-hover:scale-110 transition-transform duration-200 material-icons"
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
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useNodesLibraryStore } from '@/stores/nodesLibrary'
import type { INodeCanvas } from '@canvas/interfaz/node.interface'
import Modal from './Modal.vue';

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
