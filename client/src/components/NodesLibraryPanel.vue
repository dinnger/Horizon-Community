<template>
  <div v-if="isVisible" class="fixed inset-0 z-50 flex" @click.self="hidePanel">

    <!-- Overlay -->
    <div class="absolute inset-0 bg-black/20 backdrop-blur-sm"></div>

    <!-- Panel lateral -->
    <div class="absolute right-0 w-96 h-full  bg-base-100 shadow-xl flex flex-col">
      <!-- Header -->
      <div class="flex items-center justify-between p-4 border-b border-base-300">
        <div>
          <h2 class="text-lg font-bold">Librería de Nodos</h2>
        </div>
        <button @click="hidePanel" class="btn btn-ghost  btn-sm">
          <span class="mdi mdi-close"></span>
        </button>
      </div>

      <!-- Barra de búsqueda -->
      <div class="p-4 border-b border-base-300">
        <div class="form-control">
          <div class="join w-full">
            <input v-model="searchQuery" type="text" placeholder="Buscar nodos..." class="input join-item" />
            <button class="btn rounded-r-ful  join-item">
              <span class="mdi mdi-magnify"></span>
            </button>
          </div>
        </div>
      </div>

      <!-- Lista de nodos -->
      <div class="flex-1 overflow-y-auto">
        <!-- Resultados de búsqueda -->
        <div v-if="searchQuery" class="p-4">
          <h3 class="text-sm font-semibold mb-3 opacity-70">
            Resultados ({{ searchResults.length }})
          </h3>
          <div class="space-y-2">
            <div v-for="node in searchResults" :key="node.id" @click="selectNode(node)"
              class="p-3 rounded-lg border border-base-300 hover:bg-base-200 cursor-pointer transition-colors">
              <div class="flex items-center space-x-3">
                <div class="w-8 h-8 rounded flex items-center justify-center text-white text-xl material-icons"
                  :style="{ backgroundColor: node.info.color }">
                  {{ node.info.icon }}
                </div>
                <div class="flex-1 min-w-0">
                  <h4 class="font-medium text-sm truncate">{{ node.info.name }}</h4>
                  <p class="text-xs opacity-60 truncate">{{ node.info.desc }}</p>
                  <span class="text-xs opacity-50">{{ node.info.group }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Navegación por grupos -->
        <div v-else class="p-4">
          <!-- Vista de grupos principales -->
          <div v-if="!selectedGroup" class="space-y-2">
            <h3 class="text-sm font-semibold mb-3 opacity-70">Categorías</h3>
            <div v-for="(group, groupName) in nodeGroups" :key="groupName" @click="selectGroup(String(groupName))"
              class="p-3 rounded-lg border border-base-300 hover:bg-base-200 cursor-pointer transition-colors">
              <div class="flex items-center justify-between">
                <div>
                  <h4 class="font-medium">{{ groupName }}</h4>
                  <p class="text-sm opacity-60">
                    {{ group.nodes.length }} nodos
                    <span v-if="group.subgroups && group.subgroups.length > 0">
                      • {{ group.subgroups.length }} subcategorías
                    </span>
                  </p>
                </div>
                <svg class="w-5 h-5 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>

          <!-- Vista de grupo seleccionado -->
          <div v-else>
            <!-- Botón volver -->
            <button @click="selectedGroup = null; selectedSubgroup = null"
              class="flex items-center space-x-2 mb-4 text-sm opacity-70 hover:opacity-100">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
              <span>Volver a categorías</span>
            </button>

            <h3 class="text-lg font-semibold mb-4">{{ selectedGroup }}</h3>

            <!-- Nodos directos del grupo -->
            <div v-if="nodeGroups[selectedGroup]?.nodes.length > 0 && !selectedSubgroup" class="space-y-2 mb-6">
              <h4 class="text-sm font-semibold opacity-70">Nodos</h4>
              <div v-for="node in nodeGroups[selectedGroup].nodes" :key="node.id" @click="selectNode(node)"
                class="p-3 rounded-lg border border-base-300 hover:bg-base-200 cursor-pointer transition-colors">
                <div class="flex items-center space-x-3">
                  <div class="w-8 h-8 rounded flex items-center justify-center text-white text-sm"
                    :style="{ backgroundColor: node.info.color }">
                    {{ node.info.icon }}
                  </div>
                  <div class="flex-1 min-w-0">
                    <h4 class="font-medium text-sm truncate">{{ node.info.name }}</h4>
                    <p class="text-xs opacity-60 truncate">{{ node.info.desc }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Subgrupos -->
            <div
              v-if="nodeGroups[selectedGroup]?.subgroups && nodeGroups[selectedGroup].subgroups!.length > 0 && !selectedSubgroup"
              class="space-y-2">
              <h4 class="text-sm font-semibold opacity-70">Subcategorías</h4>
              <div v-for="subgroup in nodeGroups[selectedGroup].subgroups" :key="subgroup"
                @click="selectSubgroup(subgroup)"
                class="p-3 rounded-lg border border-base-300 hover:bg-base-200 cursor-pointer transition-colors">
                <div class="flex items-center justify-between">
                  <div>
                    <h4 class="font-medium">{{ subgroup }}</h4>
                    <p class="text-sm opacity-60">
                      {{ getNodesBySubgroup(selectedGroup, subgroup).length }} nodos
                    </p>
                  </div>
                  <svg class="w-5 h-5 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>

            <!-- Nodos del subgrupo -->
            <div v-if="selectedSubgroup" class="space-y-2">
              <button @click="selectedSubgroup = null"
                class="flex items-center space-x-2 mb-4 text-sm opacity-70 hover:opacity-100">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                </svg>
                <span>Volver a {{ selectedGroup }}</span>
              </button>

              <h4 class="text-lg font-semibold mb-4">{{ selectedSubgroup }}</h4>

              <div v-for="node in getNodesBySubgroup(selectedGroup, selectedSubgroup)" :key="node.id"
                @click="selectNode(node)"
                class="p-3 rounded-lg border border-base-300 hover:bg-base-200 cursor-pointer transition-colors">
                <div class="flex items-center space-x-3">
                  <div class="w-8 h-8 rounded flex items-center justify-center text-white text-sm"
                    :style="{ backgroundColor: node.info.color }">
                    {{ node.info.icon }}
                  </div>
                  <div class="flex-1 min-w-0">
                    <h4 class="font-medium text-sm truncate">{{ node.info.name }}</h4>
                    <p class="text-xs opacity-60 truncate">{{ node.info.desc }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
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

const isVisible = computed(() => nodesStore.isNodePanelVisible)
const nodeGroups = computed(() => nodesStore.nodeGroups)
const getNodesBySubgroup = computed(() => nodesStore.getNodesBySubgroup)

const searchResults = computed(() => {
  if (!searchQuery.value) return []
  const data = nodesStore.searchNodes(searchQuery.value)
  return data
})

const hidePanel = () => {
  nodesStore.hideNodePanel()
  emit('close')
}

const selectGroup = (groupName: string) => {
  selectedGroup.value = groupName
  selectedSubgroup.value = null
}

const selectSubgroup = (subgroupName: string) => {
  selectedSubgroup.value = subgroupName
}

const selectNode = (node: INodeCanvas) => {
  emit('nodeSelected', node)
  hidePanel()
}

// Limpiar estado cuando se cierra el panel
watch(isVisible, (newVal) => {
  if (!newVal) {
    searchQuery.value = ''
    selectedGroup.value = null
    selectedSubgroup.value = null
  }
})
</script>

<style scoped>
.input-group .btn {
  border-left: none;
}
</style>
