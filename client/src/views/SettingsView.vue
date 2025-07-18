<template>
  <div class="container mx-auto p-6 max-w-6xl">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-base-content">Configuración</h1>
      <p class="text-base-content/70 mt-2">Administra tus preferencias y configuraciones de la aplicación</p>
    </div>

    <!-- Tabs -->
    <div class="tabs bg-base-200 w-fit mb-6">
      <a v-for="tab in tabs" :key="tab.id" @click="activeTab = tab.id"
        :class="['tab', { 'tab-active': activeTab === tab.id }]">
        <span class="mdi mr-2" :class="tab.icon"></span>
        {{ tab.label }}
      </a>
    </div>

    <!-- Tab Content -->
    <div class="bg-base-100 rounded-lg shadow-lg p-6">
      <!-- General Settings -->
      <div v-if="activeTab === 'general'" class="space-y-6">
        <h2 class="text-xl font-semibold mb-4">Configuración General</h2>

        <!-- Appearance Section -->
        <div class="card bg-base-200 shadow-xl backdrop-blur-sm border border-base-300">
          <div class="card-body">
            <h3 class="card-title mb-4">
              <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
              </svg>
              Apariencia
            </h3>


            <!-- Font Size -->
            <div class="form-control"> <label class="label">
                <span class="label-text">Tamaño de fuente</span>
                <span class="label-text-alt">{{ settingsStore.fontSize }}px</span>
              </label>
              <input v-model="settingsStore.fontSize" type="range" min="12" max="20" class="range range-primary"
                @input="settingsStore.setFontSize(settingsStore.fontSize)" />
              <div class="w-full flex justify-between text-xs px-2">
                <span>Pequeño</span>
                <span>Mediano</span>
                <span>Grande</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Basic Settings -->
        <div class="card bg-base-200 shadow-xl backdrop-blur-sm border border-base-300">
          <div class="card-body">
            <h3 class="card-title mb-4">Configuración Básica</h3>

            <div class="form-control">
              <label class="label">
                <span class="label-text">Idioma de la aplicación</span>
              </label>
              <select class="select select-bordered w-full max-w-xs">
                <option value="es">Español</option>
                <option value="en">English</option>
              </select>
            </div>
            <div class="form-control">
              <label class="cursor-pointer label">
                <span class="label-text">Mostrar notificaciones</span>
                <input v-model="settingsStore.notifications.general" type="checkbox" class="toggle toggle-primary" />
              </label>
            </div>

            <div class="form-control">
              <label class="cursor-pointer label">
                <span class="label-text">Autoguardado</span>
                <input v-model="settingsStore.performance.autoSave" type="checkbox" class="toggle toggle-primary" />
              </label>
              <label class="label">
                <span class="label-text-alt">Guarda automáticamente cada 30 segundos</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Notifications -->
        <div class="card bg-base-200 shadow-xl backdrop-blur-sm border border-base-300">
          <div class="card-body">
            <h3 class="card-title mb-4">
              <svg class="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M15 17h5l-5 5v-5zM10.07 4.93l1.41 1.41A8 8 0 0119.93 14H22a10 10 0 11-11.93-9.07z" />
              </svg>
              Notificaciones
            </h3>
            <div class="space-y-4">
              <div class="form-control">
                <label class="cursor-pointer label">
                  <span class="label-text">Notificaciones de ejecución de workflows</span>
                  <input v-model="settingsStore.notifications.workflowExecution" type="checkbox"
                    class="toggle toggle-primary" />
                </label>
              </div>

              <div class="form-control">
                <label class="cursor-pointer label">
                  <span class="label-text">Notificaciones de errores</span>
                  <input v-model="settingsStore.notifications.errors" type="checkbox" class="toggle toggle-error" />
                </label>
              </div>

              <div class="form-control">
                <label class="cursor-pointer label">
                  <span class="label-text">Actualizaciones del sistema</span>
                  <input v-model="settingsStore.notifications.systemUpdates" type="checkbox"
                    class="toggle toggle-info" />
                </label>
              </div>

              <div class="form-control">
                <label class="cursor-pointer label">
                  <span class="label-text">Recordatorios de proyectos</span>
                  <input v-model="settingsStore.notifications.projectReminders" type="checkbox"
                    class="toggle toggle-warning" />
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- Performance -->
        <div class="card bg-base-200 shadow-xl backdrop-blur-sm border border-base-300">
          <div class="card-body">
            <h3 class="card-title mb-4">
              <svg class="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Rendimiento
            </h3>
            <div class="space-y-4">
              <div class="form-control">
                <label class="cursor-pointer label">
                  <span class="label-text">Animaciones reducidas</span>
                  <input v-model="settingsStore.performance.reducedAnimations" type="checkbox" class="toggle" />
                </label>
                <label class="label">
                  <span class="label-text-alt">Mejora el rendimiento en dispositivos lentos</span>
                </label>
              </div>

              <div class="form-control">
                <label class="label">
                  <span class="label-text">Intervalo de actualización del canvas</span>
                  <span class="label-text-alt">{{ settingsStore.canvasRefreshRate }}ms</span>
                </label>
                <input v-model="settingsStore.canvasRefreshRate" type="range" min="16" max="100"
                  class="range range-accent"
                  @input="settingsStore.setCanvasRefreshRate(settingsStore.canvasRefreshRate)" />
                <div class="w-full flex justify-between text-xs px-2">
                  <span>Rápido</span>
                  <span>Balanceado</span>
                  <span>Lento</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Workspace Settings -->
      <div v-if="activeTab === 'workspaces'" class="space-y-6">
        <div class="flex justify-between items-center">
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
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path
                        d="M10 2v2a6 6 0 0 0 6 6h2a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h4Z" />
                    </svg>
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

      <!-- Account Settings -->
      <div v-if="activeTab === 'account'" class="space-y-6">
        <h2 class="text-xl font-semibold mb-4">Configuración de Cuenta</h2>

        <div class="form-control">
          <label class="label">
            <span class="label-text">Nombre completo</span>
          </label>
          <input type="text" placeholder="Tu nombre" class="input input-bordered w-full max-w-md" />
        </div>

        <div class="form-control">
          <label class="label">
            <span class="label-text">Email</span>
          </label>
          <input type="email" placeholder="tu@email.com" class="input input-bordered w-full max-w-md" />
        </div>

        <div class="form-control">
          <label class="label">
            <span class="label-text">Cambiar contraseña</span>
          </label>
          <input type="password" placeholder="Nueva contraseña" class="input input-bordered w-full max-w-md" />
        </div>

        <button class="btn btn-primary">Guardar cambios</button>
      </div>

      <!-- Data & Privacy -->
      <div v-if="activeTab === 'privacy'" class="space-y-6">
        <h2 class="text-xl font-semibold mb-4">Datos y Privacidad</h2>

        <div class="card bg-base-200 shadow-xl backdrop-blur-sm border border-base-300">
          <div class="card-body">
            <h3 class="card-title mb-4">
              <svg class="w-6 h-6 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Configuración de Privacidad
            </h3>
            <div class="space-y-4">
              <div class="form-control">
                <label class="cursor-pointer label">
                  <span class="label-text">Telemetría anónima</span>
                  <input v-model="settingsStore.privacy.telemetry" type="checkbox" class="toggle" />
                </label>
                <label class="label">
                  <span class="label-text-alt">Ayuda a mejorar la aplicación</span>
                </label>
              </div>

              <div class="form-control">
                <label class="cursor-pointer label">
                  <span class="label-text">Caché local</span>
                  <input v-model="settingsStore.privacy.localCache" type="checkbox" class="toggle toggle-info" />
                </label>
                <label class="label">
                  <span class="label-text-alt">Almacena datos localmente para mejor rendimiento</span>
                </label>
              </div>

              <div class="divider"></div>

              <div class="flex space-x-4">
                <button @click="settingsStore.exportData" class="btn btn-outline">
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Exportar Datos
                </button>
                <button @click="settingsStore.clearData" class="btn btn-error btn-outline">
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Limpiar Datos
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- About -->
      <div v-if="activeTab === 'about'" class="space-y-6">
        <h2 class="text-xl font-semibold mb-4">Acerca de la Aplicación</h2>

        <div class="card bg-base-200 shadow-xl backdrop-blur-sm border border-base-300">
          <div class="card-body">
            <h3 class="card-title mb-4">
              <svg class="w-6 h-6 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Información del Sistema
            </h3>

            <div class="text-sm space-y-2">
              <div class="flex justify-between">
                <span>Versión:</span>
                <span class="font-mono">1.0.0</span>
              </div>
              <div class="flex justify-between">
                <span>Build:</span>
                <span class="font-mono">2024.06.24</span>
              </div>
              <div class="flex justify-between">
                <span>Tecnologías:</span>
                <span>Vue 3, TypeScript, Vite</span>
              </div>
            </div>

            <div class="divider"></div>

            <div class="flex space-x-4">
              <button class="btn btn-outline btn-sm">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Documentación
              </button>
              <button class="btn btn-outline btn-sm">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
                Soporte
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit Workspace Modal -->
    <div v-if="showWorkspaceModal" class="modal modal-open">
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

    <!-- Save Button -->
    <div class="mt-8 text-center">
      <button @click="settingsStore.saveSettings" class="btn btn-primary btn-lg">
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
        </svg>
        Guardar Configuración
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useWorkspaceStore } from '../stores/workspace'
import { useSettingsStore } from '../stores/settings'
import type { Workspace } from '@/types/socket'

const workspaceStore = useWorkspaceStore()
const settingsStore = useSettingsStore()
const activeTab = ref('general')
const showWorkspaceModal = ref(false)
const editingWorkspace = ref<Workspace | null>(null)


const tabs = [
  { id: 'general', label: 'General', icon: 'mdi-cog' },
  { id: 'workspaces', label: 'Workspaces', icon: 'mdi-folder-multiple' },
  { id: 'account', label: 'Cuenta', icon: 'mdi-account' },
  { id: 'privacy', label: 'Privacidad', icon: 'mdi-shield-account' },
  { id: 'about', label: 'Acerca de', icon: 'mdi-information' }
]

const colors = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
  '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
]

const workspaceForm = reactive({
  name: '',
  description: '',
  color: '#3b82f6',
  isDefault: false
})

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

const resetForm = () => {
  workspaceForm.name = ''
  workspaceForm.description = ''
  workspaceForm.color = '#3b82f6'
  workspaceForm.isDefault = false
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

onMounted(() => {
  workspaceStore.initWorkspaces()

})
</script>
