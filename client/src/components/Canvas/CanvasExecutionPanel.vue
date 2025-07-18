<template>
  <div class="absolute top-[38px] right-1/2 translate-6/12 flex gap-2 p-2 bg-black/20 backdrop-blur-sm rounded-md">
    <div class="dropdown dropdown-end">
      <label tabindex="0" class="btn btn-sm btn-soft btn-primary">
        <span class="mdi mdi-play"></span>
        {{ isExecuting ? 'Ejecutando...' : 'Ejecutar' }}
        <span class="mdi mdi-chevron-down ml-1"></span>
      </label>
      <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
        <li><a @click="$emit('executeWorkflow')">Ejecutar Última Versión</a></li>
        <li><a @click="$emit('executeWithVersionSelection')">Ejecutar Versión Específica...</a></li>
      </ul>
    </div>
    <h2 class="text-[10px]">Version: {{ version }}</h2>
  </div>
</template>

<script setup lang="ts">
interface Props {
  isExecuting: boolean
  version: string
}

defineProps<Props>()

defineEmits<{
  executeWorkflow: []
  executeWithVersionSelection: []
}>()
</script>
