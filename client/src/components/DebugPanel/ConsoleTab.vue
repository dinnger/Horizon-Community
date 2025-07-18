<template>
  <div class="h-full flex flex-col">
    <!-- Console Header -->
    <div class="flex items-center justify-between p-3 border-b border-base-300 bg-base-50">
      <div class="flex items-center space-x-4">
        <h3 class="font-semibold text-sm">Consola del Sistema</h3>

        <!-- Filter Level -->
        <div class="dropdown dropdown-end">
          <label tabindex="0" class="btn btn-xs btn-outline">
            <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
            </svg>
            {{ filterLabel }}
          </label>
          <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-32">
            <li><a @click="setFilter('all')" :class="{ 'active': debugStore.filterLevel === 'all' }">Todos</a></li>
            <li><a @click="setFilter('error')" :class="{ 'active': debugStore.filterLevel === 'error' }">Errores</a>
            </li>
            <li><a @click="setFilter('warn')" :class="{ 'active': debugStore.filterLevel === 'warn' }">Advertencias</a>
            </li>
            <li><a @click="setFilter('info')" :class="{ 'active': debugStore.filterLevel === 'info' }">Info</a></li>
            <li><a @click="setFilter('debug')" :class="{ 'active': debugStore.filterLevel === 'debug' }">Debug</a></li>
          </ul>
        </div>
      </div>

      <div class="flex items-center space-x-2">
        <!-- Log count -->
        <span class="text-xs text-base-content/60">
          {{ debugStore.filteredLogs.length }} entradas
        </span>

        <!-- Clear button -->
        <button @click="debugStore.clearLogs" class="btn btn-xs btn-ghost">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Console Content -->
    <div class="flex-1 overflow-y-auto p-2 bg-base-100">
      <div v-if="debugStore.filteredLogs.length === 0" class="text-center text-base-content/60 py-8">
        <svg class="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p>No hay logs disponibles</p>
      </div>

      <div v-else class="space-y-1 font-mono text-xs">
        <div v-for="log in debugStore.filteredLogs" :key="log.id"
          class="flex items-start space-x-2 p-2 rounded hover:bg-base-200" :class="getLogClass(log.level)">
          <!-- Timestamp -->
          <span class="text-base-content/50 whitespace-nowrap">
            {{ formatTime(log.timestamp) }}
          </span>

          <!-- Level badge -->
          <span class="px-2 py-0.5 rounded text-xs font-bold whitespace-nowrap" :class="getLevelBadgeClass(log.level)">
            {{ log.level.toUpperCase() }}
          </span>

          <!-- Source -->
          <span v-if="log.source" class="text-blue-600 font-medium whitespace-nowrap">
            [{{ log.source }}]
          </span>

          <!-- Message -->
          <span class="flex-1 break-words">{{ log.message }}</span>

          <!-- Details button -->
          <button v-if="log.details" @click="showDetails(log)"
            class="btn btn-xs btn-ghost opacity-70 hover:opacity-100">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Details Modal -->
    <div v-if="selectedLog" class="modal modal-open">
      <div class="modal-box">
        <h3 class="font-bold text-lg mb-4">Detalles del Log</h3>

        <div class="space-y-3">
          <div>
            <label class="label label-text font-medium">Nivel:</label>
            <span :class="['badge', getLevelBadgeClass(selectedLog.level)]">
              {{ selectedLog.level.toUpperCase() }}
            </span>
          </div>

          <div v-if="selectedLog.source">
            <label class="label label-text font-medium">Fuente:</label>
            <span class="text-blue-600">{{ selectedLog.source }}</span>
          </div>

          <div>
            <label class="label label-text font-medium">Mensaje:</label>
            <p class="bg-base-200 p-3 rounded font-mono text-sm">{{ selectedLog.message }}</p>
          </div>

          <div>
            <label class="label label-text font-medium">Timestamp:</label>
            <span class="font-mono text-sm">{{ selectedLog.timestamp.toISOString() }}</span>
          </div>

          <div v-if="selectedLog.details">
            <label class="label label-text font-medium">Detalles:</label>
            <pre
              class="bg-base-200 p-3 rounded font-mono text-xs overflow-x-auto">{{ JSON.stringify(selectedLog.details, null, 2) }}</pre>
          </div>
        </div>

        <div class="modal-action">
          <button @click="selectedLog = null" class="btn">Cerrar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useDebugConsoleStore, type ConsoleLog } from '@/stores/debugConsole'

const debugStore = useDebugConsoleStore()
const selectedLog = ref<ConsoleLog | null>(null)

const filterLabel = computed(() => {
  const labels = {
    all: 'Todos',
    error: 'Errores',
    warn: 'Advertencias',
    info: 'Info',
    debug: 'Debug'
  }
  return labels[debugStore.filterLevel]
})

const setFilter = (level: typeof debugStore.filterLevel) => {
  debugStore.setFilterLevel(level)
}

const formatTime = (date: Date) => {
  const time = date.toLocaleTimeString('es-ES', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
  const ms = date.getMilliseconds().toString().padStart(3, '0')
  return `${time}.${ms}`
}

const getLogClass = (level: ConsoleLog['level']) => {
  switch (level) {
    case 'error':
      return 'border-l-4 border-error bg-error/5'
    case 'warn':
      return 'border-l-4 border-warning bg-warning/5'
    case 'info':
      return 'border-l-4 border-info bg-info/5'
    case 'debug':
      return 'border-l-4 border-base-300 bg-base-200/50'
    default:
      return ''
  }
}

const getLevelBadgeClass = (level: ConsoleLog['level']) => {
  switch (level) {
    case 'error':
      return 'bg-error text-error-content'
    case 'warn':
      return 'bg-warning text-warning-content'
    case 'info':
      return 'bg-info text-info-content'
    case 'debug':
      return 'bg-base-300 text-base-content'
    default:
      return 'bg-base-300 text-base-content'
  }
}

const showDetails = (log: ConsoleLog) => {
  selectedLog.value = log
}
</script>
