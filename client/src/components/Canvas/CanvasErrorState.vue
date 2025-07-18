<template>
  <div class="text-center py-8">
    <div class="w-24 h-24 bg-base-300 rounded-full flex items-center justify-center mx-auto mb-4">
      <svg class="w-12 h-12 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    </div>
    <h3 class="text-lg font-semibold mb-2">Hubo un error al cargar el flujo</h3>
    <p class="text-base-content/70 mb-4">Verifique si el flujo existe y si tiene permisos de lectura</p>
    <router-link to="/projects" class="btn btn-primary">
      Volver a proyectos
    </router-link>
  </div>
</template>

<script setup lang="ts">
// Este componente no necesita props ni emits, es puramente estático
</script>
