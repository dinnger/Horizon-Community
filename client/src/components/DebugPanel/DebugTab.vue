<template>
  <div class="h-full flex flex-col">
    <!-- Debug Header -->
    <div class="flex items-center justify-between p-3 border-b border-base-300 bg-base-50">
      <div class="flex items-center space-x-4">
        <h3 class="font-semibold text-sm">Información de Debug</h3>

        <div class="flex items-center space-x-2">
          <div v-if="debugStore.debugInfo" class="badge badge-success badge-sm">
            Activo
          </div>
          <div v-else class="badge badge-ghost badge-sm">
            Sin datos
          </div>
        </div>
      </div>

      <div class="flex items-center space-x-2">
        <!-- History count -->
        <span class="text-xs text-base-content/60">
          {{ debugStore.debugHistory.length }} entradas
        </span>

        <!-- Clear button -->
        <button @click="debugStore.clearDebugInfo" class="btn btn-xs btn-ghost">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Debug Content -->
    <div class="flex-1 overflow-y-auto">
      <!-- Current Debug Info -->
      <div v-if="debugStore.debugInfo" class="p-4 border-b border-base-200">
        <h4 class="font-medium text-sm mb-3 text-primary">Información Actual</h4>

        <div class="bg-base-100 rounded-lg p-4 space-y-3">
          <!-- Node Info -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="label label-text text-xs font-medium">ID del Nodo:</label>
              <code class="text-xs bg-base-200 px-2 py-1 rounded">{{ debugStore.debugInfo.nodeId }}</code>
            </div>
            <div>
              <label class="label label-text text-xs font-medium">Nombre del Nodo:</label>
              <span class="text-sm font-medium">{{ debugStore.debugInfo.nodeName }}</span>
            </div>
          </div>

          <!-- Execution Time -->
          <div v-if="debugStore.debugInfo.executionTime">
            <label class="label label-text text-xs font-medium">Tiempo de Ejecución:</label>
            <div class="flex items-center space-x-2">
              <span class="text-lg font-bold" :class="getExecutionTimeClass(debugStore.debugInfo.executionTime)">
                {{ debugStore.debugInfo.executionTime }}ms
              </span>
              <div class="text-xs text-base-content/60">
                {{ getPerformanceLabel(debugStore.debugInfo.executionTime) }}
              </div>
            </div>
          </div>

          <!-- Input Data -->
          <div v-if="debugStore.debugInfo.inputData" class="space-y-2">
            <label class="label label-text text-xs font-medium">Datos de Entrada:</label>
            <div class="collapse collapse-arrow bg-base-200">
              <input type="checkbox" />
              <div class="collapse-title text-sm font-medium">
                Ver datos de entrada
              </div>
              <div class="collapse-content">
                <pre
                  class="text-xs bg-base-300 p-3 rounded overflow-x-auto">{{ JSON.stringify(debugStore.debugInfo.inputData, null, 2) }}</pre>
              </div>
            </div>
          </div>

          <!-- Output Data -->
          <div v-if="debugStore.debugInfo.outputData" class="space-y-2">
            <label class="label label-text text-xs font-medium">Datos de Salida:</label>
            <div class="collapse collapse-arrow bg-base-200">
              <input type="checkbox" />
              <div class="collapse-title text-sm font-medium">
                Ver datos de salida
              </div>
              <div class="collapse-content">
                <pre
                  class="text-xs bg-base-300 p-3 rounded overflow-x-auto">{{ JSON.stringify(debugStore.debugInfo.outputData, null, 2) }}</pre>
              </div>
            </div>
          </div>

          <!-- Error Info -->
          <div v-if="debugStore.debugInfo.error" class="space-y-2">
            <label class="label label-text text-xs font-medium text-error">Error:</label>
            <div class="bg-error/10 border border-error/20 rounded p-3">
              <code class="text-xs text-error">{{ debugStore.debugInfo.error }}</code>
            </div>
          </div>
        </div>
      </div>

      <!-- No Current Debug Info -->
      <div v-else class="p-8 text-center text-base-content/60">
        <svg class="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p class="text-sm">No hay información de debug activa</p>
        <p class="text-xs mt-1">Los datos aparecerán cuando un nodo esté en ejecución</p>
      </div>

      <!-- Debug History -->
      <div v-if="debugStore.debugHistory.length > 0" class="p-4">
        <h4 class="font-medium text-sm mb-3 text-base-content/80">Historial de Debug</h4>

        <div class="space-y-2">
          <div v-for="(debug, index) in debugStore.debugHistory.slice(0, 10)" :key="index"
            class="bg-base-100 rounded p-3 border border-base-200 hover:border-base-300 cursor-pointer"
            @click="selectedHistoryItem = selectedHistoryItem === index ? null : index">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-3">
                <div class="text-sm font-medium">{{ debug.nodeName }}</div>
                <div class="text-xs text-base-content/60">{{ debug.nodeId }}</div>
                <div v-if="debug.executionTime" class="text-xs" :class="getExecutionTimeClass(debug.executionTime)">
                  {{ debug.executionTime }}ms
                </div>
              </div>

              <svg class="w-4 h-4 transition-transform" :class="{ 'rotate-180': selectedHistoryItem === index }"
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            <!-- Expanded Content -->
            <div v-if="selectedHistoryItem === index" class="mt-3 pt-3 border-t border-base-200 space-y-2">
              <div v-if="debug.inputData" class="text-xs">
                <strong>Input:</strong>
                <pre
                  class="bg-base-200 p-2 rounded mt-1 overflow-x-auto">{{ JSON.stringify(debug.inputData, null, 2) }}</pre>
              </div>

              <div v-if="debug.outputData" class="text-xs">
                <strong>Output:</strong>
                <pre
                  class="bg-base-200 p-2 rounded mt-1 overflow-x-auto">{{ JSON.stringify(debug.outputData, null, 2) }}</pre>
              </div>

              <div v-if="debug.error" class="text-xs">
                <strong class="text-error">Error:</strong>
                <div class="bg-error/10 border border-error/20 rounded p-2 mt-1">
                  <code class="text-error">{{ debug.error }}</code>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Show more button -->
        <div v-if="debugStore.debugHistory.length > 10" class="text-center mt-4">
          <button class="btn btn-xs btn-outline" @click="showAllHistory = !showAllHistory">
            {{ showAllHistory ? 'Mostrar menos' : `Ver ${debugStore.debugHistory.length - 10} más` }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useDebugConsoleStore } from '@/stores/debugConsole'

const debugStore = useDebugConsoleStore()
const selectedHistoryItem = ref<number | null>(null)
const showAllHistory = ref(false)

const getExecutionTimeClass = (time: number) => {
  if (time < 100) return 'text-success'
  if (time < 500) return 'text-warning'
  return 'text-error'
}

const getPerformanceLabel = (time: number) => {
  if (time < 100) return 'Excelente'
  if (time < 500) return 'Bueno'
  if (time < 1000) return 'Regular'
  return 'Lento'
}
</script>
