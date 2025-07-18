<template>
  <div class="flex justify-between items-center mb-8">
    <div>
      <h1 class="text-3xl font-bold text-primary">Proyectos</h1>
      <p class="text-base-content/70 mt-2">Gestiona todos tus proyectos desde aquí</p>
    </div>
    <button @click="$emit('create-project')" class="btn btn-primary">
      <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
      </svg>
      Nuevo Proyecto
    </button>
  </div>
</template>

<script setup lang="ts">
defineEmits<{
  'create-project': []
}>()
</script>
