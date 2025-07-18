<template>
  <div class="h-full flex flex-col">
    <!-- Network Header -->
    <div class="flex items-center justify-between p-3 border-b border-base-300 bg-base-50">
      <div class="flex items-center space-x-4">
        <h3 class="font-semibold text-sm">Peticiones de Red</h3>

        <!-- Status Summary -->
        <div class="flex items-center space-x-3 text-xs">
          <div class="flex items-center space-x-1">
            <div class="w-2 h-2 bg-success rounded-full"></div>
            <span>{{ successCount }} éxito</span>
          </div>
          <div class="flex items-center space-x-1">
            <div class="w-2 h-2 bg-error rounded-full"></div>
            <span>{{ errorCount }} error</span>
          </div>
        </div>
      </div>

      <div class="flex items-center space-x-2">
        <!-- Total requests -->
        <span class="text-xs text-base-content/60">
          {{ debugStore.networkRequests.length }} peticiones
        </span>

        <!-- Clear button -->
        <button @click="debugStore.clearNetworkRequests" class="btn btn-xs btn-ghost">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Network Content -->
    <div class="flex-1 overflow-y-auto">
      <!-- Summary Stats -->
      <div class="p-4 border-b border-base-200 bg-base-50">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="text-center">
            <div class="text-lg font-bold text-primary">{{ debugStore.networkRequests.length }}</div>
            <div class="text-xs text-base-content/60">Total Peticiones</div>
          </div>
          <div class="text-center">
            <div class="text-lg font-bold text-success">{{ avgResponseTime.toFixed(0) }}ms</div>
            <div class="text-xs text-base-content/60">Tiempo Promedio</div>
          </div>
          <div class="text-center">
            <div class="text-lg font-bold text-info">{{ totalDataTransferred }}KB</div>
            <div class="text-xs text-base-content/60">Datos Transferidos</div>
          </div>
          <div class="text-center">
            <div class="text-lg font-bold"
              :class="successRate >= 95 ? 'text-success' : successRate >= 90 ? 'text-warning' : 'text-error'">
              {{ successRate.toFixed(1) }}%
            </div>
            <div class="text-xs text-base-content/60">Tasa de Éxito</div>
          </div>
        </div>
      </div>

      <!-- No Requests -->
      <div v-if="debugStore.networkRequests.length === 0" class="p-8 text-center text-base-content/60">
        <svg class="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
        </svg>
        <p>No hay peticiones de red registradas</p>
      </div>

      <!-- Requests List -->
      <div v-else class="divide-y divide-base-200">
        <div v-for="request in debugStore.networkRequests" :key="request.id"
          class="p-4 hover:bg-base-100 cursor-pointer"
          @click="selectedRequest = selectedRequest?.id === request.id ? null : request">
          <!-- Request Header -->
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <!-- HTTP Method -->
              <span class="px-2 py-1 rounded text-xs font-bold" :class="getMethodClass(request.method)">
                {{ request.method }}
              </span>

              <!-- Status Code -->
              <span class="px-2 py-1 rounded text-xs font-bold" :class="getStatusClass(request.status)">
                {{ request.status }}
              </span>

              <!-- URL -->
              <span class="font-medium text-sm truncate max-w-md">{{ request.url }}</span>
            </div>

            <div class="flex items-center space-x-4 text-xs text-base-content/60">
              <!-- Duration -->
              <span :class="getDurationClass(request.duration)">
                {{ request.duration }}ms
              </span>

              <!-- Size -->
              <span>{{ formatSize(request.size) }}</span>

              <!-- Timestamp -->
              <span>{{ formatTime(request.timestamp) }}</span>

              <!-- Expand icon -->
              <svg class="w-4 h-4 transition-transform" :class="{ 'rotate-180': selectedRequest?.id === request.id }"
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          <!-- Request Details (expanded) -->
          <div v-if="selectedRequest?.id === request.id" class="mt-4 pt-4 border-t border-base-200">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Request Info -->
              <div class="space-y-3">
                <h5 class="font-medium text-sm">Información de la Petición</h5>

                <div class="space-y-2 text-xs">
                  <div class="flex justify-between">
                    <span class="text-base-content/60">Método:</span>
                    <span class="font-mono">{{ request.method }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-base-content/60">URL:</span>
                    <span class="font-mono text-right break-all">{{ request.url }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-base-content/60">Estado:</span>
                    <span class="font-mono" :class="getStatusTextClass(request.status)">
                      {{ request.status }} {{ getStatusText(request.status) }}
                    </span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-base-content/60">Duración:</span>
                    <span class="font-mono" :class="getDurationClass(request.duration)">
                      {{ request.duration }}ms
                    </span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-base-content/60">Tamaño:</span>
                    <span class="font-mono">{{ formatSize(request.size) }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-base-content/60">Timestamp:</span>
                    <span class="font-mono">{{ request.timestamp.toISOString() }}</span>
                  </div>
                </div>
              </div>

              <!-- Response Info -->
              <div class="space-y-3">
                <h5 class="font-medium text-sm">Información de la Respuesta</h5>

                <div class="space-y-2 text-xs">
                  <div class="bg-base-200 rounded p-3">
                    <div class="font-medium mb-2">Headers (simulados)</div>
                    <div class="space-y-1 font-mono">
                      <div>Content-Type: application/json</div>
                      <div>Content-Length: {{ request.size }}</div>
                      <div>Cache-Control: no-cache</div>
                      <div v-if="request.status >= 200 && request.status < 300">
                        X-Response-Time: {{ request.duration }}ms
                      </div>
                    </div>
                  </div>

                  <!-- Performance Metrics -->
                  <div class="bg-base-200 rounded p-3">
                    <div class="font-medium mb-2">Métricas de Rendimiento</div>
                    <div class="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <div class="text-base-content/60">DNS Lookup</div>
                        <div class="font-mono">{{ Math.floor(request.duration * 0.1) }}ms</div>
                      </div>
                      <div>
                        <div class="text-base-content/60">TCP Connect</div>
                        <div class="font-mono">{{ Math.floor(request.duration * 0.2) }}ms</div>
                      </div>
                      <div>
                        <div class="text-base-content/60">Request Sent</div>
                        <div class="font-mono">{{ Math.floor(request.duration * 0.1) }}ms</div>
                      </div>
                      <div>
                        <div class="text-base-content/60">Response</div>
                        <div class="font-mono">{{ Math.floor(request.duration * 0.6) }}ms</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useDebugConsoleStore } from '@/stores/debugConsole'

const debugStore = useDebugConsoleStore()
const selectedRequest = ref<typeof debugStore.networkRequests[0] | null>(null)

const successCount = computed(() =>
  debugStore.networkRequests.filter(req => req.status >= 200 && req.status < 300).length
)

const errorCount = computed(() =>
  debugStore.networkRequests.filter(req => req.status >= 400).length
)

const avgResponseTime = computed(() => {
  if (debugStore.networkRequests.length === 0) return 0
  const total = debugStore.networkRequests.reduce((sum, req) => sum + req.duration, 0)
  return total / debugStore.networkRequests.length
})

const totalDataTransferred = computed(() => {
  const totalBytes = debugStore.networkRequests.reduce((sum, req) => sum + req.size, 0)
  return Math.round(totalBytes / 1024 * 100) / 100
})

const successRate = computed(() => {
  if (debugStore.networkRequests.length === 0) return 100
  return (successCount.value / debugStore.networkRequests.length) * 100
})

const getMethodClass = (method: string) => {
  switch (method) {
    case 'GET': return 'bg-blue-500 text-white'
    case 'POST': return 'bg-green-500 text-white'
    case 'PUT': return 'bg-yellow-500 text-white'
    case 'DELETE': return 'bg-red-500 text-white'
    case 'PATCH': return 'bg-purple-500 text-white'
    default: return 'bg-gray-500 text-white'
  }
}

const getStatusClass = (status: number) => {
  if (status >= 200 && status < 300) return 'bg-success text-success-content'
  if (status >= 300 && status < 400) return 'bg-info text-info-content'
  if (status >= 400 && status < 500) return 'bg-warning text-warning-content'
  if (status >= 500) return 'bg-error text-error-content'
  return 'bg-base-300 text-base-content'
}

const getStatusTextClass = (status: number) => {
  if (status >= 200 && status < 300) return 'text-success'
  if (status >= 300 && status < 400) return 'text-info'
  if (status >= 400 && status < 500) return 'text-warning'
  if (status >= 500) return 'text-error'
  return 'text-base-content'
}

const getDurationClass = (duration: number) => {
  if (duration < 200) return 'text-success'
  if (duration < 1000) return 'text-warning'
  return 'text-error'
}

const getStatusText = (status: number) => {
  const statusTexts: Record<number, string> = {
    200: 'OK',
    201: 'Created',
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    500: 'Internal Server Error'
  }
  return statusTexts[status] || 'Unknown'
}

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes}B`
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(1)}KB`
  const mb = kb / 1024
  return `${mb.toFixed(1)}MB`
}

const formatTime = (date: Date) => {
  return date.toLocaleTimeString('es-ES', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}
</script>
