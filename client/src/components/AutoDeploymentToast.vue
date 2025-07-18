<template>
  <div v-if="show" class="toast toast-top toast-center z-50">
    <div class="alert alert-success shadow-lg max-w-md">
      <div class="flex items-center space-x-3">
        <span class="mdi mdi-check-circle text-2xl"></span>
        <div>
          <h4 class="font-semibold">Publicación Automática</h4>
          <p class="text-sm">
            Usando despliegue del proyecto: <strong>{{ deploymentName }}</strong>
          </p>
          <p class="text-xs text-base-content/70 mt-1">
            {{ workflowName }} se está encolando para despliegue...
          </p>
        </div>
      </div>
      <div class="flex items-center space-x-2 mt-2">
        <div class="loading loading-spinner loading-sm"></div>
        <span class="text-xs">Procesando...</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  show: boolean
  workflowName: string
  deploymentName: string
}

defineProps<Props>()
</script>
