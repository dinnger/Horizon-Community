<template>
  <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
    <div class="stat bg-base-200 rounded-box shadow-lg backdrop-blur-sm">
      <div class="stat-figure text-primary">
        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M3 7v4a1 1 0 001 1h3v2a1 1 0 001 1h3v2a1 1 0 001 1h3v2a1 1 0 001 1h3" />
        </svg>
      </div>
      <div class="stat-title">Credenciales</div>
      <div class="stat-value text-primary">{{ stats.credentials }}</div>
      <div class="stat-desc">Guardadas</div>
    </div>
    <div class="stat bg-base-200 rounded-box shadow-lg backdrop-blur-sm">
      <div class="stat-figure text-secondary">
        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M4 8V7a2 2 0 012-2h12a2 2 0 012 2v1M16 12H8" />
        </svg>
      </div>
      <div class="stat-title">Archivos</div>
      <div class="stat-value text-secondary">{{ stats.files }}</div>
      <div class="stat-desc">Subidos</div>
    </div>
    <div class="stat bg-base-200 rounded-box shadow-lg backdrop-blur-sm">
      <div class="stat-figure text-success">
        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 17v-5m0 0V7m0 5h5m-5 0H7" />
        </svg>
      </div>
      <div class="stat-title">Elementos protegidos</div>
      <div class="stat-value text-success">{{ stats.protectedItems }}</div>
      <div class="stat-desc">Cifrados y seguros</div>
    </div>
    <div class="stat bg-base-200 rounded-box shadow-lg backdrop-blur-sm">
      <div class="stat-figure text-info">
        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
      </div>
      <div class="stat-title">Uso de espacio</div>
      <div class="stat-value text-info">{{ stats.spaceUsed }}</div>
      <div class="stat-desc">Total</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps } from 'vue'
const props = defineProps<{ stats: { credentials: number, files: number, protectedItems: number, spaceUsed: string } }>()
</script>
