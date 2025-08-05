<template>
  <div>
    <div v-if="showWorkspaceModal" class="modal modal-open">
      <SettingsWorkspacesModal :workspace-form="workspaceForm" :editing-workspace="editingWorkspace"
        :show-workspace-modal="showWorkspaceModal" :save-workspace="saveWorkspace"
        :close-workspace-modal="closeWorkspaceModal" />
    </div>

    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-semibold">Administrar Workspaces</h2>
      <button @click="openCreateModal" class="btn btn-primary">
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Nuevo Workspace
      </button>
    </div>

    <div class="grid gap-4">
      <div v-for="workspace in workspaceStore.workspaces" :key="workspace.id"
        class="card bg-base-200 border border-base-300">
        <div class="card-body p-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                :style="{ backgroundColor: workspace.color }">
                <span class="mdi mdi-folder-multiple text-xl"></span>
              </div>
              <div>
                <h3 class="font-semibold text-base-content">{{ workspace.name }}</h3>
                <p class="text-sm text-base-content/70">{{ workspace.description }}</p>
                <div class="flex items-center space-x-2 mt-1">
                  <span v-if="workspace.isDefault" class="badge badge-primary badge-sm">Por defecto</span>
                  <span v-if="workspace.id === workspaceStore.currentWorkspaceId"
                    class="badge badge-success badge-sm">Activo</span>
                </div>
              </div>
            </div>
            <div class="flex space-x-2">
              <button @click="editWorkspace(workspace)" class="btn btn-ghost btn-sm">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button v-if="!workspace.isDefault" @click="deleteWorkspace(workspace.id)"
                class="btn btn-ghost btn-sm text-error">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Workspace } from '@/types/socket'
import { useWorkspaceStore } from '@/stores'
import { reactive, ref } from 'vue'
import SettingsWorkspacesModal from './SettingsWorkspacesModal.vue'
const workspaceStore = useWorkspaceStore()

const showWorkspaceModal = ref(false)
const editingWorkspace = ref<Workspace | null>(null)
const workspaceForm = reactive({
  name: '',
  description: '',
  color: '#3b82f6',
  isDefault: false
})

const resetForm = () => {
  workspaceForm.name = ''
  workspaceForm.description = ''
  workspaceForm.color = '#3b82f6'
  workspaceForm.isDefault = false
}


const openCreateModal = () => {
  editingWorkspace.value = null
  resetForm()
  showWorkspaceModal.value = true
}

const editWorkspace = (workspace: Workspace) => {
  editingWorkspace.value = workspace
  workspaceForm.name = workspace.name
  workspaceForm.description = workspace.description || ''
  workspaceForm.color = workspace.color || ''
  workspaceForm.isDefault = workspace.isDefault
  showWorkspaceModal.value = true
}

const closeWorkspaceModal = () => {
  showWorkspaceModal.value = false
  editingWorkspace.value = null
  resetForm()
}

const saveWorkspace = () => {
  if (!workspaceForm.name.trim()) return

  if (editingWorkspace.value) {
    // Actualizar workspace existente
    workspaceStore.updateWorkspace(editingWorkspace.value.id, {
      name: workspaceForm.name,
      description: workspaceForm.description,
      color: workspaceForm.color
    })
  } else {
    // Crear nuevo workspace
    workspaceStore.createWorkspace({
      name: workspaceForm.name,
      description: workspaceForm.description,
      color: workspaceForm.color,
      icon: 'mdi-briefcase',
      isDefault: workspaceForm.isDefault,
      status: 'active'
    })
  }

  closeWorkspaceModal()
}

const deleteWorkspace = (id: string) => {
  if (confirm('¿Estás seguro de que deseas eliminar este workspace?')) {
    try {
      workspaceStore.deleteWorkspace(id)
    } catch (error) {
      alert('No se puede eliminar el workspace por defecto')
    }
  }
}

</script>