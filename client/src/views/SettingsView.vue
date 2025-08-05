<template>
  <div class="container mx-auto p-6 max-w-6xl">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-base-content">Configuración</h1>
      <p class="text-base-content/70 mt-2">Administra tus preferencias y configuraciones de la aplicación</p>
    </div>

    <!-- Tabs -->
    <div class="tabs bg-base-200 w-fit mb-6">
      <a v-for="tab in tabs" :key="tab.id" @click="changeTab(tab.id)"
        :class="['tab', { 'tab-active': activeTab === tab.id }]">
        <span class="mdi mr-2" :class="tab.icon"></span>
        {{ tab.label }}
      </a>
    </div>

    <!-- Tab Content -->
    <div class="bg-base-200 rounded-lg shadow-lg p-6">
      <!-- General Settings -->
      <div v-if="activeTab === 'general'" class="space-y-6">
        <h2 class="text-xl font-semibold mb-4">Configuración General</h2>

        <!-- Basic Settings -->
        <div class="card bg-base-300 shadow-xl backdrop-blur-sm border border-base-300">
          <div class="card-body">
            <h3 class="card-title mb-4">Configuración Básica</h3>

            <div class="form-control">
              <label class="label">
                <span class="label-text">Idioma de la aplicación</span>
              </label>
              <select class="select select-bordered w-full max-w-xs">
                <option value="es">Español</option>
              </select>
            </div>
            <div class="form-control ">
              <label class="cursor-pointer label ">
                <span class="label-text">Mostrar notificaciones</span>
                <input v-model="settingsStore.notifications.general" type="checkbox" class="toggle toggle-primary" />
              </label>
            </div>

            <div class="form-control">
              <label class="cursor-pointer label">
                <div>
                  <div class="label-text">Autoguardado</div>
                  <div class="label-text-alt text-[12px]">Guarda automáticamente cada 30 segundos</div>
                </div>
                <input v-model="settingsStore.performance.autoSave" type="checkbox" class="toggle toggle-primary" />
              </label>
            </div>
          </div>
        </div>

        <!-- Notifications -->
        <div class="card bg-base-300 shadow-xl backdrop-blur-sm border border-base-300">
          <div class="card-body">
            <h3 class="card-title mb-4">
              <span class="mdi mdi-bell text-secondary"></span>
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
        <div class="card bg-base-300 shadow-xl backdrop-blur-sm border border-base-300">
          <div class="card-body">
            <h3 class="card-title mb-4">
              <span class="mdi mdi-speedometer text-accent"></span>
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
                  <div>
                    <input v-model="settingsStore.performance.canvasRefreshRate" type="range" min="25" max="100"
                      class="range range-accent" />
                    <div class="label-text-alt text-[12px]">{{ settingsStore.performance.canvasRefreshRate }}ms</div>
                  </div>
                </label>

              </div>
            </div>
          </div>
        </div>

        <!-- Save Button -->
        <div class="mt-8 flex justify-end">
          <button @click="saveSettings" class="btn btn-primary ">
            <span class="mdi mdi-content-save"></span>
            Guardar Configuración
          </button>
        </div>
      </div>

      <SettingsWorkspaces v-if="activeTab === 'workspaces'" />

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

        <div class="card bg-base-300 shadow-xl backdrop-blur-sm border border-base-300">
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

        <div class="card bg-base-300 shadow-xl backdrop-blur-sm border border-base-300">
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


  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSettingsStore } from '../stores/settings'
import SettingsWorkspaces from '@/components/settings/SettingsWorkspaces.vue'
import { toast } from 'vue-sonner'

const settingsStore = useSettingsStore()
const route = useRoute()
const router = useRouter()

const tabs = [
  { id: 'general', label: 'General', icon: 'mdi-cog' },
  { id: 'workspaces', label: 'Workspaces', icon: 'mdi-folder-multiple' },
  { id: 'account', label: 'Cuenta', icon: 'mdi-account' },
  { id: 'privacy', label: 'Privacidad', icon: 'mdi-shield-account' },
  { id: 'about', label: 'Acerca de', icon: 'mdi-information' }
]

const defaultTab = 'general'
const activeTab = ref(defaultTab)

// Sincroniza el tab activo con el query param 'tab'
const setTabFromRoute = () => {
  const tabParam = route.query.tab as string
  if (tabParam && tabs.some(t => t.id === tabParam)) {
    activeTab.value = tabParam
  } else {
    activeTab.value = defaultTab
  }
}

onMounted(() => {
  setTabFromRoute()
})

watch(() => route.query.tab, () => {
  setTabFromRoute()
})

const changeTab = (tabId: string) => {
  router.replace({ query: { ...route.query, tab: tabId } })
}

const saveSettings = async () => {
  const result = await settingsStore.saveSettings()
  if (!result.success) {
    toast.error(result.message)
    return
  }
  toast.success('Configuración guardada')
}

</script>

<style scoped>
.form-control {
  padding: 10px;
  transition: ease 0.2s all;
}

.form-control:hover {
  background-color: var(--color-base-300);
}

.form-control>label {
  display: flex;
  justify-content: space-between;
}
</style>
