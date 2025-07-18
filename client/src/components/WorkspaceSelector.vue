<template>
  <div class="p-4 border-b border-base-300">
    <div class="dropdown dropdown-rigth w-full">
      <div tabindex="0" role="button" class="btn btn-ghost w-full justify-start text-left p-2">
        <div class="flex items-center space-x-3 w-full">
          <div class="w-8 h-8 rounded-lg flex items-center justify-center text-white flex-shrink-0"
            :style="{ backgroundColor: currentWorkspace?.color || '#3b82f6' }">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M10 2v2a6 6 0 0 0 6 6h2a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h4Z" />
            </svg>
          </div>
          <div :class="['flex-1 min-w-0', !isExpanded && 'hidden']">
            <p class="font-medium text-sm truncate">
              {{ currentWorkspace?.name || 'Sin workspace' }}
            </p>
            <p class="text-xs opacity-70 truncate">
              {{ currentWorkspace?.description || 'Selecciona un workspace' }}
            </p>
          </div>
          <svg :class="['w-4 h-4 transition-transform', !isExpanded && 'hidden']" fill="none" stroke="currentColor"
            viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      <ul tabindex="0"
        class="dropdown-content  z-[1] menu p-2 shadow bg-base-100 rounded-box w-72 max-h-80 overflow-y-auto">
        <li class="menu-title">
          <span>Workspaces disponibles</span>
        </li>
        <li v-for="workspace in workspaceStore.workspaces" :key="workspace.id">
          <a @click="switchWorkspace(workspace.id)"
            :class="{ 'active': workspace.id === workspaceStore.currentWorkspaceId }"
            class="flex items-center space-x-3 p-3">
            <div class="w-6 h-6 rounded-md flex items-center justify-center text-white flex-shrink-0"
              :style="{ backgroundColor: workspace.color }">
              <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M10 2v2a6 6 0 0 0 6 6h2a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h4Z" />
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center space-x-2">
                <span class="font-medium text-sm truncate">{{ workspace.name }}</span>
                <span v-if="workspace.isDefault" class="badge badge-primary badge-xs">Por defecto</span>
              </div>
              <p class="text-xs opacity-70 truncate">{{ workspace.description }}</p>
            </div>
            <svg v-if="workspace.id === workspaceStore.currentWorkspaceId" class="w-4 h-4 text-success flex-shrink-0"
              fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </a>
        </li>
        <div class="divider my-2"></div>
        <li>
          <router-link to="/settings" class="flex items-center space-x-3 p-3 text-primary">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            <span class="font-medium">Administrar workspaces</span>
          </router-link>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useWorkspaceStore } from '../stores/workspace'

interface Props {
  isExpanded: boolean
}

defineProps<Props>()

const workspaceStore = useWorkspaceStore()

const currentWorkspace = computed(() => workspaceStore.currentWorkspace)

const switchWorkspace = (workspaceId: string) => {
  workspaceStore.switchWorkspace(workspaceId)
  // Cerrar el dropdown
  if (document.activeElement) {
    (document.activeElement as HTMLElement).blur()
  }
}

onMounted(async () => {
  await workspaceStore.initWorkspaces()
})
</script>
