<template>
  <div class="card bg-base-200 shadow-xl mb-8">
    <div class="card-body">
      <h2 class="card-title mb-6">Artefactos generados</h2>
      <div v-if="artifacts.length === 0" class="text-center py-8">
        <div class="w-24 h-24 bg-base-300 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-12 h-12 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 class="text-lg font-semibold mb-2">No hay artefactos</h3>
        <p class="text-base-content/70 mb-4">Aún no se han generado artefactos</p>
      </div>
      <div v-else class="space-y-2">
        <div v-for="artifact in artifacts" :key="artifact.id"
          class="flex items-center justify-between p-3 bg-base-300 rounded">
          <div class="flex items-center space-x-3">
            <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <div>
              <div class="font-semibold">{{ artifact.name }}</div>
              <div class="text-xs text-base-content/60">{{ artifact.type }} • {{ artifact.size }}</div>
            </div>
          </div>
          <button class="btn btn-xs btn-primary">Descargar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps } from 'vue'
const props = defineProps<{ artifacts: any[] }>()
</script>
