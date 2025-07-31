<template>
  <div class="text-center py-8">
    <div class="w-24 h-24 bg-base-300 rounded-full flex items-center justify-center mx-auto mb-4">
      <span class="mdi  text-5xl" :class="icon || 'mdi-clipboard-remove-outline'"></span>
    </div>
    <h3 class="text-lg font-semibold mb-2">{{ title }}</h3>
    <p class="text-base-content/70 mb-4">{{ description }}</p>
    <button v-if="action" @click="action" class="btn btn-primary">
      Crear Workflow
    </button>
  </div>
</template>

<script setup lang="ts">
import { defineProps } from 'vue'
const props = defineProps<{ action?: () => void, title: string, description: string, icon?: string }>()

</script>
