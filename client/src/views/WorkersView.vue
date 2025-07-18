<template>
  <div class="p-8 bg-base-100 min-h-screen">
    <div class="max-w-6xl mx-auto">
      <!-- Header -->
      <div class="flex justify-between items-center mb-8">
        <div>
          <h1 class="text-3xl font-bold text-primary">Gestión de Workers</h1>
          <p class="text-base-content/70 mt-2">Monitoreo en tiempo real y gestión de procesos worker para ejecución de
            workflows</p>
        </div>
      </div>

      <WorkersDashboard />
    </div>
  </div>
</template>

<script setup lang="ts">
import WorkersDashboard from '@/components/WorkersDashboard.vue'
</script>

<style scoped>
/* Los estilos están ahora manejados por las clases de DaisyUI */
</style>
