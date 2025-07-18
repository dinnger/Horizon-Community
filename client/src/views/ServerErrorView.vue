<template>
  <ErrorLayout>
    <!-- Error Icon -->
    <div class="mb-8">
      <div class="w-32 h-32 mx-auto bg-error/20 rounded-full flex items-center justify-center">
        <svg class="w-16 h-16 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    </div>

    <!-- Error Message -->
    <h1 class="text-6xl font-bold text-error mb-4">500</h1>
    <h2 class="text-3xl font-semibold mb-4">Error interno del servidor</h2>
    <p class="text-lg text-base-content/70 mb-6 max-w-md mx-auto">
      Algo salió mal en nuestro servidor. Nuestro equipo ha sido notificado y está trabajando para resolver el problema.
    </p>

    <!-- Información adicional -->
    <div class="bg-base-200/50 rounded-lg p-6 mb-8 max-w-md mx-auto">
      <h3 class="font-semibold mb-3">¿Qué puedes hacer mientras tanto?</h3>
      <ul class="text-left space-y-2 text-sm">
        <li class="flex items-center">
          <svg class="w-4 h-4 text-info mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clip-rule="evenodd" />
          </svg>
          Esperar unos minutos e intentar de nuevo
        </li>
        <li class="flex items-center">
          <svg class="w-4 h-4 text-info mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clip-rule="evenodd" />
          </svg>
          Contactar a soporte si el problema persiste
        </li>
        <li class="flex items-center">
          <svg class="w-4 h-4 text-info mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clip-rule="evenodd" />
          </svg>
          Verificar tu conexión a internet
        </li>
      </ul>
    </div>

    <!-- Botón de recargar -->
    <div class="mb-6">
      <button @click="reloadPage" class="btn btn-secondary">
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Recargar página
      </button>
    </div>
  </ErrorLayout>
</template>

<script setup lang="ts">
import ErrorLayout from '../layouts/ErrorLayout.vue'

const reloadPage = () => {
  window.location.reload()
}
</script>
