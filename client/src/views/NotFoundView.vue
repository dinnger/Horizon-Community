<template>
  <!-- Error Icon -->
  <div class="mb-8">
    <div class="w-32 h-32 mx-auto bg-error/20 rounded-full flex items-center justify-center">
      <svg class="w-16 h-16 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    </div>
  </div>

  <!-- Error Message -->
  <h1 class="text-6xl font-bold text-error mb-4">404</h1>
  <h2 class="text-3xl font-semibold mb-4">Página no encontrada</h2>
  <p class="text-lg text-base-content/70 mb-6 max-w-md mx-auto">
    Lo sentimos, la página que buscas no existe o ha sido movida a otra ubicación.
  </p>

  <!-- Sugerencias -->
  <div class="bg-base-200/50 rounded-lg p-6 mb-8 max-w-md mx-auto">
    <h3 class="font-semibold mb-3">¿Qué puedes hacer?</h3>
    <ul class="text-left space-y-2 text-sm">
      <li class="flex items-center">
        <svg class="w-4 h-4 text-success mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clip-rule="evenodd" />
        </svg>
        Verificar la URL escrita
      </li>
      <li class="flex items-center">
        <svg class="w-4 h-4 text-success mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clip-rule="evenodd" />
        </svg>
        Regresar a la página anterior
      </li>
      <li class="flex items-center">
        <svg class="w-4 h-4 text-success mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clip-rule="evenodd" />
        </svg>
        Ir a la página principal
      </li>
    </ul>
  </div>
</template>
