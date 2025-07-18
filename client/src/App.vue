<script setup lang="ts">
import { Toaster } from 'vue-sonner'
import 'vue-sonner/style.css'
import { useSettingsStore } from './stores';
import type { Theme } from 'vue-sonner/src/packages/types.js';
import { computed, watch } from 'vue';
const settingsStore = useSettingsStore()

const theme = computed(() => settingsStore.currentTheme as Theme || 'light') 
</script>

<template>
  <Toaster richColors :theme="theme" />
  <router-view />
</template>

<style scoped></style>
