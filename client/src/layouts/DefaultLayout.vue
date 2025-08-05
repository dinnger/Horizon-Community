<template>
  <div class="flex h-screen w-full bg-base-100" :data-theme="settingsStore.currentTheme">
    <!-- Sidebar -->
    <div :class="[
      'transition-all duration-300 flex flex-col bg-base-200  border-r border-base-300',
      isExpanded ? 'w-64' : 'w-16'
    ]">
      <!-- Header -->
      <div class="flex items-center justify-between p-4 border-b border-base-300">
        <h1 :class="['font-bold text-xl text-primary', !isExpanded && 'hidden']">
          Horizon
        </h1>
        <button @click="toggleSidebar" class="btn btn-ghost btn-sm">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      <WorkspaceSelector :is-expanded="isExpanded" />

      <!-- Menu Items -->
      <nav class="flex-1 p-2">
        <ul class="space-y-2">
          <li v-for="item in availableMenuItems" :key="item.path">
            <router-link :to="item.path"
              class="flex items-center p-3 rounded-lg hover:bg-base-300 transition-colors group"
              :class="{ 'bg-primary text-primary-content': route.path === item.path || (item.path.length > 2 && route.path.startsWith(item.path)) }">
              <span class="mdi text-lg ml-1" :class="item.icon"></span>
              <span :class="[
                'ml-3 font-medium transition-opacity',
                !isExpanded && 'opacity-0 hidden'
              ]">
                {{ item.label }}
              </span>
            </router-link>
          </li>
        </ul>
      </nav>

      <!-- User Profile -->
      <div class="p-4 border-t border-base-300" v-if="authStore.user">
        <div class="flex items-center space-x-3">
          <div class="avatar">
            <div class="w-10 h-10 rounded-full border-3" :class="[isConnected ? 'border-green-700' : 'border-red-800']">
              <img :src="authStore.user.avatar" :alt="authStore.user.name" />
            </div>
          </div>
          <div :class="['flex-1', !isExpanded && 'hidden']">
            <p class="font-medium text-sm">{{ authStore.user.name }}</p>
            <p class="text-xs opacity-70">{{ authStore.user.email }}</p>
          </div>
          <div class="dropdown dropdown-top dropdown-end">
            <div tabindex="0" role="button" class="btn btn-ghost btn-sm btn-circle">
              <span class="mdi mdi-dots-vertical"></span>
            </div>
            <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-48">
              <li>
                <a @click="editProfile">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Perfil
                </a>
              </li>
              <li>
                <a @click="handleLogout" class="text-error">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Cerrar Sesión
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Theme Switcher -->
      <div class="p-4 border-t border-base-300">
        <div class="flex items-center justify-between">
          <span :class="['text-sm font-medium', !isExpanded && 'hidden']">
            Tema
          </span>
          <div class="dropdown dropdown-top dropdown-end">
            <div tabindex="0" role="button" class="btn btn-ghost btn-sm">
              <component :is="themeIcon" class="w-5 h-5" />
            </div>
            <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
              <li v-for="theme in themes" :key="theme.value">
                <a @click="setTheme(theme.value)" :class="{ 'active': settingsStore.currentTheme === theme.value }">
                  <component :is="theme.icon" class="w-4 h-4" />
                  {{ theme.label }}
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="flex-1 overflow-auto">
      <router-view v-if="isWorkspaceLoaded && isConnected" />
      <div v-else-if="!isWorkspaceLoaded" class="flex items-center justify-center h-full">
        <svg class="w-12 h-12 animate-spin text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </div>
      <div v-else class="flex flex-col items-center justify-center h-full">
        <span class="mdi mdi-lan-disconnect text-primary/60 text-5xl"></span>
        <p class="text-md text-base-content/60 font-medium mt-4">No se ha conectado al servidor</p>
        <small class="text-base-content/40">
          <span class="mdi mdi-refresh text-primary mdi-spin"></span>
          Intentando conectar...
        </small>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useRoleStore } from '../stores/role'
import { useNavigation } from '../composables/useNavigation'

import IconSun from '../components/icons/IconSun.vue'
import IconMoon from '../components/icons/IconMoon.vue'
import IconPalette from '../components/icons/IconPalette.vue'
import WorkspaceSelector from '@/components/WorkspaceSelector.vue'
import { useSettingsStore, useWorkspaceStore } from '@/stores'
import socketService from '@/services/socket'


const settingsStore = useSettingsStore()
const workspaceStore = useWorkspaceStore()
const roleStore = useRoleStore()
const { availableMenuItems } = useNavigation()

socketService.connect()


const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const isExpanded = ref(true)
const isWorkspaceLoaded = ref(false)

const themes = [
  { value: 'light', label: 'Light', icon: IconSun },
  { value: 'dark', label: 'Dark', icon: IconMoon },
]

const themeIcon = computed(() => {
  const currentTheme = settingsStore.currentTheme
  if (currentTheme.includes('dark')) return IconMoon
  if (currentTheme === 'light' || currentTheme === 'crystal') return IconSun
  return IconPalette
})

const toggleSidebar = () => {
  isExpanded.value = !isExpanded.value
}

const setTheme = (theme: string) => {
  settingsStore.setTheme(theme)
}

const isConnected = computed(() => socketService.isConnected.value)

const handleLogout = async () => {
  await authStore.logout()
  router.push('/auth/login')
}

const editProfile = () => {
  console.log('Editar perfil - por implementar')
}

watch(() => workspaceStore.currentWorkspaceId, () => {
  isWorkspaceLoaded.value = false
  setTimeout(() => {
    isWorkspaceLoaded.value = true
  }, 500)
}, { immediate: true })

// Cargar permisos del usuario cuando se monta el componente
onMounted(async () => {
  settingsStore.loadSettings()
  await roleStore.fetchUserPermissions()
})

</script>
