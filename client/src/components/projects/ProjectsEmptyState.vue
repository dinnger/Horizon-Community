<template>
  <div class="col-span-full flex flex-col items-center justify-center py-16 text-center">
    <div class="w-24 h-24 bg-base-300 rounded-full flex items-center justify-center mb-4">
      <svg class="w-12 h-12 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    </div>
    <h3 class="text-xl font-semibold mb-2">No tienes proyectos aún</h3>
    <p class="text-base-content/70 mb-4">Crea tu primer proyecto para comenzar</p>
    <button @click="$emit('create-project')" class="btn btn-primary">
      Crear Proyecto
    </button>
  </div>
</template>

<script setup lang="ts">
defineEmits<{
  'create-project': []
}>()
</script>
