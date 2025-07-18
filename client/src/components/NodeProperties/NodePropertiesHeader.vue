<template>
  <div class="flex items-center justify-between p-6 border-b border-base-300">
    <div class="flex items-center space-x-3">
      <div class="w-10 h-10 rounded flex items-center justify-center text-white material-icons text-2xl"
        :style="{ backgroundColor: nodeData?.info.color || '#6b7280' }">
        {{ nodeData?.info.icon || '?' }}
      </div>
      <div>
        <h2 class="text-xl font-bold">{{ nodeData?.info.name || 'Propiedades del Nodo' }}</h2>
        <p class="text-sm opacity-70">{{ nodeData?.info.desc || 'Configura las propiedades de este nodo' }}</p>
      </div>
    </div>
    <button @click="$emit('close')" class="btn btn-ghost btn-circle">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import type { INodeCanvas } from '@canvas/interfaz/node.interface'

interface Props {
  nodeData: INodeCanvas | null
}

interface Emits {
  'close': []
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
</script>
