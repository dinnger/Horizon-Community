<template>
  <div class="min-h-screen w-full bg-gradient-to-br from-primary/20 via-base-100 to-secondary/20"
    :data-theme="settingsStore.currentTheme">
    <!-- Header opcional con logo -->
    <header class="absolute top-0 left-0 right-0 z-10">
      <div class="container mx-auto p-6">
        <div class="flex items-center justify-end">
          <!-- Theme Switcher -->
          <div class="dropdown dropdown-end">
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
    </header>

    <!-- Main Content -->
    <main class="min-h-screen flex items-center justify-center p-4">
      <router-view />
    </main>

    <!-- Footer opcional -->
    <footer class="absolute bottom-0 left-0 right-0 p-6">
      <div class="text-center text-sm text-base-content/60">
        © 2025 Dinnger. Todos los derechos reservados.
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import IconSun from '../components/icons/IconSun.vue'
import IconMoon from '../components/icons/IconMoon.vue'
import IconPalette from '../components/icons/IconPalette.vue'
import { useSettingsStore } from '@/stores'

const settingsStore = useSettingsStore()
settingsStore.loadSettings()

const themes = [
  { value: 'light', label: 'Light', icon: IconSun },
  { value: 'dark', label: 'Dark', icon: IconMoon },
]

const themeIcon = computed(() => {
  if (settingsStore.currentTheme.includes('dark')) return IconMoon
  if (settingsStore.currentTheme === 'light' || settingsStore.currentTheme === 'crystal') return IconSun
  return IconPalette
})

const setTheme = (theme: string) => {
  settingsStore.setTheme(theme)
}


</script>
