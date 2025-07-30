<template>
  <div>
    <div class="bg-base-200 border-b border-base-300">
      <!-- Header Principal -->
      <div class="h-[55px] p-2 flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <button @click="$router.go(-1)" class="btn btn-ghost btn-circle btn-sm">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <h1 class="text-xl font-bold">{{ projectName }}</h1>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-base-100/70 p-2 absolute z-10 m-[15px]  backdrop-blur-md rounded-lg join">
      <button class="btn btn-sm join-item  w-35 relative"
        :class="{ 'btn-primary': activeTab === 'design', 'btn-soft': activeTab !== 'design' }"
        @click="$emit('update:activeTab', 'design')">
        <div>
          <span class="mdi mdi-drawing mr-2"></span>
          Diseño
          <div v-if="version"
            class="absolute top-0 right-0 text-[9px] bg-warning text-warning-content pl-1 pr-1 rounded-bl-box">
            {{ version }}
          </div>
        </div>
      </button>
      <button class="btn btn-sm join-item  w-35 relative"
        :class="{ 'btn-primary': activeTab === 'execution', 'btn-soft': activeTab !== 'execution' }"
        :disabled="version === '0.0.1'" @click="handleExecute">
        <div>
          <div class="flex">
            <div v-if="!workerStore.workerInfo && !isExecuting" class="mdi mdi-play mr-2"></div>
            <div v-else-if="isExecuting" class="mdi mdi-loading mr-2 mdi-spin"></div>
            <div v-else class="w-2 h-2 rounded-full top-[5px] -left-[5px] bg-green-400 relative">
              <span class="absolute inset-0 w-2 h-2 rounded-full bg-white animate-ping opacity-75"></span>
            </div>
            {{ isExecuting ? "Ejecutando..." : !workerStore.workerInfo ? 'Ejecutar' : 'En ejecución' }}
          </div>
          <div v-if="workerStore.workerInfo"
            class="absolute top-0 right-0 text-[9px] bg-warning text-warning-content pl-1 pr-1 rounded-bl-box">
            {{ workerStore.workerInfo.version }}
          </div>
        </div>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useWorkerStore } from '@/stores/worker';
import type { IWorkerInfo } from '@shared/interfaces/worker.interface';
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

interface Props {
  version?: string
  activeTab: 'design' | 'execution'
  projectName: string

}

const router = useRouter()
const workerStore = useWorkerStore()

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:activeTab': [tab: 'design' | 'execution'],
  'execute': []
}>()


const isExecuting = computed(() => workerStore.isExecuting)

const handleExecute = async () => {
  if (props.activeTab === 'execution') return
  emit('update:activeTab', 'execution')
  emit('execute')
}
</script>
