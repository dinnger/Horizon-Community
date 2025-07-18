<template>
  <div v-if="debugStore.isVisible"
    class="fixed bottom-0 left-0 right-0 z-40 bg-base-100 border-t border-base-300 shadow-xl">
    <!-- Panel Header -->
    <div class="flex items-center justify-between px-4 py-2 bg-base-200 border-b border-base-300">
      <div class="flex items-center space-x-4">
        <!-- Tabs -->
        <div class="tabs tabs-boxed bg-base-300">
          <a v-for="tab in tabs" :key="tab.id" @click="debugStore.setActiveTab(tab.id)"
            :class="['tab tab-sm', { 'tab-active': debugStore.activeTab === tab.id }]">
            <svg v-if="tab.id === 'console'" class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <svg v-else-if="tab.id === 'debug'" class="w-4 h-4 mr-1" fill="none" stroke="currentColor"
              viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
            <svg v-else-if="tab.id === 'workers'" class="w-4 h-4 mr-1" fill="none" stroke="currentColor"
              viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 7.172V5L8 4z" />
            </svg>
            <svg v-else-if="tab.id === 'network'" class="w-4 h-4 mr-1" fill="none" stroke="currentColor"
              viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
            </svg>
            {{ tab.label }}
            <span v-if="tab.badge?.value" class="badge badge-xs badge-primary ml-1">{{ tab.badge.value }}</span>
          </a>
        </div>

        <!-- Quick stats -->
        <div class="text-xs text-base-content/60 hidden lg:flex items-center space-x-4">
          <span>Workers: {{ debugStore.activeWorkers }}/{{ debugStore.workerStats.length }}</span>
          <span>CPU: {{ debugStore.avgCpuUsage.toFixed(1) }}%</span>
          <span>RAM: {{ debugStore.totalMemoryUsage.toFixed(1) }}MB</span>
        </div>
      </div>

      <div class="flex items-center space-x-2">
        <!-- Minimize button -->
        <button @click="debugStore.toggleMinimize" class="btn btn-ghost btn-xs"
          :title="debugStore.isMinimized ? 'Expandir' : 'Minimizar'">
          <svg v-if="debugStore.isMinimized" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
          </svg>
          <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <!-- Close button -->
        <button @click="debugStore.hidePanel" class="btn btn-ghost btn-xs">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Resize Handle -->
    <div class="absolute top-0 left-0 right-0 h-1 cursor-ns-resize bg-base-300 hover:bg-primary"
      @mousedown="startResize"></div>

    <!-- Panel Content -->
    <div v-if="!debugStore.isMinimized" :style="{ height: debugStore.panelHeight + 'px' }" class="overflow-hidden">
      <!-- Console Tab -->
      <div v-if="debugStore.activeTab === 'console'" class="h-full flex flex-col">
        <ConsoleTab />
      </div>

      <!-- Debug Tab -->
      <div v-if="debugStore.activeTab === 'debug'" class="h-full flex flex-col">
        <DebugTab />
      </div>

      <!-- Workers Tab -->
      <div v-if="debugStore.activeTab === 'workers'" class="h-full flex flex-col">
        <WorkersTab />
      </div>

      <!-- Network Tab -->
      <div v-if="debugStore.activeTab === 'network'" class="h-full flex flex-col">
        <NetworkTab />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useDebugConsoleStore } from '@/stores/debugConsole'
import ConsoleTab from './DebugPanel/ConsoleTab.vue'
import DebugTab from './DebugPanel/DebugTab.vue'
import WorkersTab from './DebugPanel/WorkersTab.vue'
import NetworkTab from './DebugPanel/NetworkTab.vue'

const debugStore = useDebugConsoleStore()

const tabs = [
  {
    id: 'console' as const,
    label: 'Consola',
    badge: computed(() => debugStore.filteredLogs.length > 0 ? debugStore.filteredLogs.length : null)
  },
  {
    id: 'debug' as const,
    label: 'Debug',
    badge: computed(() => debugStore.debugInfo ? '1' : null)
  },
  {
    id: 'workers' as const,
    label: 'Workers',
    badge: computed(() => debugStore.activeWorkers)
  },
  {
    id: 'network' as const,
    label: 'Red',
    badge: computed(() => debugStore.networkRequests.length > 0 ? debugStore.networkRequests.length : null)
  }
]

// Resize functionality
const isResizing = ref(false)

const startResize = (e: MouseEvent) => {
  isResizing.value = true
  document.addEventListener('mousemove', doResize)
  document.addEventListener('mouseup', stopResize)
  e.preventDefault()
}

const doResize = (e: MouseEvent) => {
  if (!isResizing.value) return

  const windowHeight = window.innerHeight
  const newHeight = windowHeight - e.clientY
  debugStore.setPanelHeight(newHeight)
}

const stopResize = () => {
  isResizing.value = false
  document.removeEventListener('mousemove', doResize)
  document.removeEventListener('mouseup', stopResize)
}

onMounted(() => {
  // Inicializar datos dummy
  debugStore.initializeDummyData()
})

onUnmounted(() => {
  document.removeEventListener('mousemove', doResize)
  document.removeEventListener('mouseup', stopResize)
})
</script>

<style scoped>
.tabs-boxed .tab-active {
  background-color: var(--primary);
  color: var(--primary-content);
}
</style>
