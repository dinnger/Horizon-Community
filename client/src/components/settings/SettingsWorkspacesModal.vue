<template>
  <div>
    <div class="modal-box">
      <h3 class="font-bold text-lg mb-4">
        {{ editingWorkspace ? 'Editar Workspace' : 'Crear Workspace' }}
      </h3>

      <form @submit.prevent="saveWorkspace" class="space-y-4">
        <div class="form-control">
          <label class="label">
            <span class="label-text">Nombre</span>
          </label>
          <input v-model="workspaceForm.name" type="text" placeholder="Nombre del workspace"
            class="input input-bordered" required />
        </div>

        <div class="form-control">
          <label class="label">
            <span class="label-text">Descripción</span>
          </label>
          <textarea v-model="workspaceForm.description" placeholder="Descripción opcional"
            class="textarea textarea-bordered"></textarea>
        </div>

        <div class="form-control">
          <label class="label">
            <span class="label-text">Color</span>
          </label>
          <div class="flex space-x-2">
            <button v-for="color in colors" :key="color" type="button" @click="workspaceForm.color = color" :class="[
              'w-8 h-8 rounded-lg border-2',
              workspaceForm.color === color ? 'border-base-content' : 'border-transparent'
            ]" :style="{ backgroundColor: color }"></button>
          </div>
        </div>

        <div class="form-control" v-if="!editingWorkspace">
          <label class="cursor-pointer label">
            <span class="label-text">Establecer como predeterminado</span>
            <input v-model="workspaceForm.isDefault" type="checkbox" class="checkbox" />
          </label>
        </div>
      </form>

      <div class="modal-action">
        <button @click="closeWorkspaceModal" class="btn">Cancelar</button>
        <button @click="saveWorkspace" class="btn btn-primary">
          {{ editingWorkspace ? 'Actualizar' : 'Crear' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Workspace } from '@/types/socket';


const props = defineProps<{
  workspaceForm: any
  showWorkspaceModal: boolean
  editingWorkspace: Workspace | null,
  saveWorkspace: () => void,
  closeWorkspaceModal: () => void
}>()

const colors = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
  '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
]




</script>