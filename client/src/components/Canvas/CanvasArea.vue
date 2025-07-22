<template>
  <div class="flex h-[calc(100vh-55px)]">
    <canvas ref="canvasElement"></canvas>
    <div class="absolute bottom-0 right-0 flex flex-col gap-2 p-2 text-[11px] text-right">
      Pos: {{ canvasStore.currentMousePosition.x }}x, {{ canvasStore.currentMousePosition.y }}y
      <br>
      zoom: {{ canvasStore.canvasZoom }}x
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCanvas } from '@/stores';
import { onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router';


const props = defineProps<{
  name?: 'canvas' | 'execution'
  version?: string
  isLocked?: boolean
}>()

const router = useRouter()
const canvasStore = useCanvas(props.name || 'canvas')

const emit = defineEmits<{
  canvasReady: [canvas: HTMLCanvasElement]
}>()

const canvasElement = ref<HTMLCanvasElement>()

console.log(router.currentRoute.value.params.id)
watch(() => canvasElement.value, async (canvas) => {
  if (canvas) {
    await canvasStore.loadWorkflow({ workflowId: router.currentRoute.value.params.id as string, version: props.version })
    canvasStore.initializeCanvas({ canvas, isLocked: props.isLocked })
    emit('canvasReady', canvas)
  }
})

</script>
