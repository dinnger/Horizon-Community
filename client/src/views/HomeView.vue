<template>
  <div class="p-8 bg-base-100 min-h-screen">
    <div class="max-w-6xl mx-auto">
      <!-- Hero Section -->
      <div class="hero bg-gradient-to-r from-primary/20 to-secondary/20 rounded-3xl mb-[20px] backdrop-blur-sm">
        <div class="hero-content text-center py-16">
          <div class="max-w-md">
            <h1 class="text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Horizon
            </h1>
            <p class="py-6 text-lg opacity-80">
              Gestiona tus proyectos y workflows con estilo. Una interfaz moderna y elegante para tu productividad.
            </p>
            <router-link to="/projects" class="btn btn-primary btn-lg glass">
              Comenzar
            </router-link>
          </div>
        </div>
      </div>

      <!-- Feature Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="card bg-base-200 shadow-xl backdrop-blur-sm border border-base-300">
          <div class="card-body text-center">
            <div class="mx-auto w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4">
              <svg class="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h2 class="card-title justify-center">Proyectos</h2>
            <p class="opacity-70">Organiza y gestiona todos tus proyectos en un lugar centralizado.</p>
          </div>
        </div>

        <div class="card bg-base-200 shadow-xl backdrop-blur-sm border border-base-300">
          <div class="card-body text-center">
            <div class="mx-auto w-16 h-16 bg-secondary/20 rounded-full flex items-center justify-center mb-4">
              <svg class="w-8 h-8 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h2 class="card-title justify-center">Workflows</h2>
            <p class="opacity-70">Diseña y ejecuta workflows personalizados para automatizar tareas.</p>
          </div>
        </div>

        <div class="card bg-base-200 shadow-xl backdrop-blur-sm border border-base-300">
          <div class="card-body text-center">
            <div class="mx-auto w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mb-4">
              <svg class="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h2 class="card-title justify-center">Configuración</h2>
            <p class="opacity-70">Personaliza tu experiencia con temas y configuraciones avanzadas.</p>
          </div>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="card bg-base-200 shadow-xl backdrop-blur-sm border border-base-300">
        <div class="card-body">
          <h2 class="card-title mb-4">Actividad Reciente</h2>
          <div class="space-y-4">
            <div class="flex items-center space-x-4 p-4 rounded-lg bg-base-100">
              <div class="w-3 h-3 bg-success rounded-full"></div>
              <div class="flex-1">
                <p class="font-medium">Proyecto "Web App" creado</p>
                <p class="text-sm opacity-70">Hace 2 horas</p>
              </div>
            </div>
            <div class="flex items-center space-x-4 p-4 rounded-lg bg-base-100">
              <div class="w-3 h-3 bg-warning rounded-full"></div>
              <div class="flex-1">
                <p class="font-medium">Workflow "Deploy Process" actualizado</p>
                <p class="text-sm opacity-70">Hace 1 día</p>
              </div>
            </div>
            <div class="flex items-center space-x-4 p-4 rounded-lg bg-base-100">
              <div class="w-3 h-3 bg-info rounded-full"></div>
              <div class="flex-1">
                <p class="font-medium">Configuración de tema actualizada</p>
                <p class="text-sm opacity-70">Hace 3 días</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
