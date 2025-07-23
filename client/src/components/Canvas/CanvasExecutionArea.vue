<template>
  <div class="bg-base-100 p-6 space-y-6">
    <!-- Información General de Ejecución -->
    <div class="card bg-base-200 shadow-md">
      <div class="card-body">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <div class="avatar placeholder">
              <div class="bg-primary text-primary-content rounded-full w-12">
                <span class="text-xl mdi mdi-rocket-launch"></span>
              </div>
            </div>
            <div>
              <h3 class="text-lg font-semibold">Estado de Ejecución</h3>
              <p class="text-sm opacity-70">Monitoreo en tiempo real del workflow</p>
            </div>
          </div>

          <!-- Estado actual -->
          <div class="flex items-center space-x-2">
            <div class="badge" :class="getExecutionStatusClass(isExecuting)">
              <span v-if="isExecuting" class="loading loading-spinner loading-xs mr-1"></span>
              {{ isExecuting ? 'Ejecutando...' : 'Listo' }}
            </div>
            <div class="text-sm opacity-70">v{{ version }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Panel de Control de Ejecución -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Opciones de Ejecución -->
      <div class="card bg-base-200 shadow-md">
        <div class="card-body">
          <h4 class="card-title">
            <span class="mdi mdi-play-circle mr-2"></span>
            Opciones de Ejecución
          </h4>

          <div class="space-y-4">
            <!-- Ejecución Simple -->
            <button class="btn btn-primary w-full" :class="{ 'loading': isExecuting }" :disabled="isExecuting"
              @click="$emit('execute-workflow')">
              <span v-if="!isExecuting" class="mdi mdi-play mr-2"></span>
              {{ isExecuting ? 'Ejecutando...' : 'Ejecutar Última Versión' }}
            </button>

            <!-- Ejecución con Selección de Versión -->
            <button class="btn btn-secondary w-full" :disabled="isExecuting"
              @click="$emit('execute-with-version-selection')">
              <span class="mdi mdi-history mr-2"></span>
              Ejecutar Versión Específica
            </button>

            <!-- Ejecución Programada -->
            <button class="btn btn-outline w-full" :disabled="isExecuting" @click="showScheduleModal = true">
              <span class="mdi mdi-clock-outline mr-2"></span>
              Programar Ejecución
            </button>
          </div>
        </div>
      </div>

      <!-- Estadísticas de Ejecución -->
      <div class="card bg-base-200 shadow-md">
        <div class="card-body">
          <h4 class="card-title">
            <span class="mdi mdi-chart-line mr-2"></span>
            Estadísticas
          </h4>

          <div class="grid grid-cols-2 gap-4">
            <div class="stat bg-base-100 rounded-lg p-3">
              <div class="stat-title text-xs">Total Ejecuciones</div>
              <div class="stat-value text-lg">152</div>
              <div class="stat-desc text-xs">+12% vs mes anterior</div>
            </div>

            <div class="stat bg-base-100 rounded-lg p-3">
              <div class="stat-title text-xs">Tasa de Éxito</div>
              <div class="stat-value text-lg text-success">95%</div>
              <div class="stat-desc text-xs">8 fallos este mes</div>
            </div>

            <div class="stat bg-base-100 rounded-lg p-3">
              <div class="stat-title text-xs">Duración Promedio</div>
              <div class="stat-value text-lg">5m 10s</div>
              <div class="stat-desc text-xs">-30s vs promedio</div>
            </div>

            <div class="stat bg-base-100 rounded-lg p-3">
              <div class="stat-title text-xs">Última Ejecución</div>
              <div class="stat-value text-lg text-info">2h</div>
              <div class="stat-desc text-xs">Exitosa</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Historial de Ejecuciones Recientes -->
    <div class="card bg-base-200 shadow-md">
      <div class="card-body">
        <div class="flex items-center justify-between mb-4">
          <h4 class="card-title">
            <span class="mdi mdi-history mr-2"></span>
            Historial Reciente
          </h4>
          <button class="btn btn-ghost btn-sm">
            <span class="mdi mdi-refresh mr-1"></span>
            Actualizar
          </button>
        </div>

        <div class="overflow-x-auto">
          <table class="table table-sm">
            <thead>
              <tr>
                <th>Estado</th>
                <th>Fecha</th>
                <th>Duración</th>
                <th>Trigger</th>
                <th>Versión</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="execution in recentExecutions" :key="execution.id">
                <td>
                  <div class="badge" :class="getStatusBadgeClass(execution.status)">
                    {{ execution.status }}
                  </div>
                </td>
                <td>{{ formatDate(execution.date) }}</td>
                <td>{{ execution.duration }}</td>
                <td>
                  <div class="badge badge-outline">{{ execution.trigger }}</div>
                </td>
                <td>v{{ execution.version }}</td>
                <td>
                  <div class="flex space-x-1">
                    <button class="btn btn-ghost btn-xs" title="Ver detalles">
                      <span class="mdi mdi-eye"></span>
                    </button>
                    <button class="btn btn-ghost btn-xs" title="Volver a ejecutar" :disabled="isExecuting">
                      <span class="mdi mdi-replay"></span>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Monitor de Ejecución en Tiempo Real -->
    <CanvasExecutionMonitor :is-executing="isExecuting" @stop-execution="$emit('stop-execution')"
      @pause-execution="$emit('pause-execution')" />

    <!-- Modal de Programación (placeholder) -->
    <div v-if="showScheduleModal" class="modal modal-open">
      <div class="modal-box">
        <h3 class="font-bold text-lg">Programar Ejecución</h3>
        <p class="py-4">Esta funcionalidad estará disponible próximamente.</p>
        <div class="modal-action">
          <button class="btn" @click="showScheduleModal = false">Cerrar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import CanvasExecutionMonitor from './CanvasExecutionMonitor.vue'

interface Props {
  isExecuting: boolean
  version: string
}

defineProps<Props>()

defineEmits<{
  'execute-workflow': []
  'execute-with-version-selection': []
  'stop-execution': []
  'pause-execution': []
}>()

const showScheduleModal = ref(false)

// Mock data para el historial
const recentExecutions = ref([
  {
    id: 'exec-1',
    status: 'success',
    date: new Date('2025-01-21T14:30:00Z'),
    duration: '5m 23s',
    trigger: 'Manual',
    version: '1.2.0'
  },
  {
    id: 'exec-2',
    status: 'success',
    date: new Date('2025-01-21T11:00:00Z'),
    duration: '5m 10s',
    trigger: 'Scheduled',
    version: '1.2.0'
  },
  {
    id: 'exec-3',
    status: 'failed',
    date: new Date('2025-01-20T09:15:00Z'),
    duration: '2m 5s',
    trigger: 'API',
    version: '1.1.9'
  }
])

const getExecutionStatusClass = (executing: boolean) => {
  return executing ? 'badge-warning' : 'badge-success'
}

const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case 'success': return 'badge-success'
    case 'failed': return 'badge-error'
    case 'running': return 'badge-warning'
    default: return 'badge-ghost'
  }
}

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(date)
}
</script>

<style scoped>
.card {
  transition: all 0.2s ease;
}

.card:hover {
  transform: translateY(-1px);
}

.stat {
  transition: all 0.2s ease;
}

.stat:hover {
  background-color: var(--fallback-b3, oklch(var(--b3)));
}
</style>
