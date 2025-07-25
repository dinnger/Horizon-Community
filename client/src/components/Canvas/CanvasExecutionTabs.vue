<template>
  <div v-if="isVisible" class="absolute bottom-4 left-4 right-4 z-10" :style="{ height: `${panelHeight}px` }">
    <!-- Divisor de redimensionado -->

    <div v-if="isResizing" class="fixed top-0 bottom-0 left-0 right-0  z-20 ">
    </div>


    <div
      class="absolute -top-1 left-0 right-0 h-2 z-30 cursor-row-resize bg-transparent hover:bg-blue-500/30 transition-colors duration-200  group"
      @mousedown="startResize">
      <!-- Indicador visual del divisor -->
      <div
        class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-1 bg-gray-400 rounded opacity-50 group-hover:opacity-100 transition-opacity duration-200">
      </div>
    </div>

    <div
      class="bg-base-100/70 backdrop-blur-md text-white rounded-lg shadow-2xl border border-gray-700 h-full flex flex-col">
      <!-- Header con Tabs -->
      <CanvasExecutionHeader :activeTab="activeTab" :autoScroll="autoScroll" @updateActiveTab="updateActiveTab"
        @clearCurrentTab="clearCurrentTab" @toggleAutoScroll="toggleAutoScroll" />

      <!-- Contenido de Logs -->
      <CanvasExecutionLogsTab v-show="activeTab === 'logs'" ref="logsTabRef" :panelConsole="panelConsole"
        :autoScroll="autoScroll" />

      <!-- Contenido de Traza de Ejecución -->
      <CanvasExecutionTraceTab v-show="activeTab === 'trace'" ref="traceTabRef" :panelTrace="panelTrace"
        :autoScroll="autoScroll" />

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onUnmounted } from 'vue'
import CanvasExecutionHeader from './CanvasExecutionHeader.vue'
import CanvasExecutionLogsTab from './CanvasExecutionLogsTab.vue'
import CanvasExecutionTraceTab from './CanvasExecutionTraceTab.vue'

interface PanelConsole {
  id: string
  date: Date
  level: string
  message: string
}

interface PanelTrace {
  id: string
  timestamp: Date
  nodeId: string
  connectionName: string
  executeTime: number
  length?: number
}

interface Props {
  panelConsole: PanelConsole[]
  panelTrace: PanelTrace[]
  isVisible: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  clearLogs: []
  clearTrace: []
}>()

const activeTab = ref<'logs' | 'trace'>('logs')
const autoScroll = ref(true)
const logsTabRef = ref()
const traceTabRef = ref()

// Variables para el redimensionado
const panelHeight = ref(256) // Altura inicial (h-64 = 256px)
const isResizing = ref(false)
const startY = ref(0)
const startHeight = ref(0)

// Límites de altura
const MIN_HEIGHT = 300
const getMaxHeight = () => Math.floor(window.innerHeight * 0.9)

const updateActiveTab = (tab: 'logs' | 'trace') => {
  activeTab.value = tab
}

const clearCurrentTab = () => {
  if (activeTab.value === 'logs') {
    emit('clearLogs')
  } else {
    emit('clearTrace')
  }
}

const toggleAutoScroll = () => {
  autoScroll.value = !autoScroll.value
}

// Funciones de redimensionado
const startResize = (event: MouseEvent) => {
  isResizing.value = true
  startY.value = event.clientY
  startHeight.value = panelHeight.value

  document.addEventListener('mousemove', handleResize)
  document.addEventListener('mouseup', stopResize)
  document.body.style.cursor = 'row-resize'
  document.body.style.userSelect = 'none'
}

const handleResize = (event: MouseEvent) => {
  if (!isResizing.value) return

  const deltaY = startY.value - event.clientY // Invertido porque el panel crece hacia arriba
  const newHeight = startHeight.value + deltaY

  // Aplicar límites
  const maxHeight = getMaxHeight()
  panelHeight.value = Math.max(MIN_HEIGHT, Math.min(newHeight, maxHeight))
}

const stopResize = () => {
  isResizing.value = false
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
}

// Limpiar event listeners al desmontar el componente
onUnmounted(() => {
  if (isResizing.value) {
    stopResize()
  }
})

// Auto-scroll cuando se cambia de tab
watch(activeTab, () => {
  if (autoScroll.value) {
    nextTick(() => {
      if (activeTab.value === 'logs' && logsTabRef.value) {
        logsTabRef.value.scrollToBottom()
      } else if (activeTab.value === 'trace' && traceTabRef.value) {
        traceTabRef.value.scrollToBottom()
      }
    })
  }
})

// Ajustar altura si la ventana cambia de tamaño
const handleWindowResize = () => {
  const maxHeight = getMaxHeight()
  if (panelHeight.value > maxHeight) {
    panelHeight.value = maxHeight
  }
}

onMounted(() => {
  window.addEventListener('resize', handleWindowResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleWindowResize)
})
</script>
