<template>
  <div class="p-2  h-[calc(100vh-55px)] w-full ">
    <div class="flex h-full rounded-xl overflow-hidden" :class="{ 'border-4 border-primary/80': name === 'execution' }">
      <canvas ref="canvasElement"></canvas>
      <div class="absolute bottom-3 right-3 flex flex-col gap-2 p-2 text-[11px] text-right">
        Pos: {{ canvasStore.currentMousePosition.x }}x, {{ canvasStore.currentMousePosition.y }}y
        <br>
        zoom: {{ canvasStore.canvasZoom }}x
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCanvas } from '@/stores';
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router';


const props = defineProps<{
  name?: 'canvas' | 'execution'
  version?: string
  isContext?: boolean
  isLocked?: boolean
}>()

const router = useRouter()
const canvasStore = useCanvas()

const emit = defineEmits<{
  canvasReady: [canvas: HTMLCanvasElement]
}>()

const canvasElement = ref<HTMLCanvasElement>()

watch(() => canvasElement.value, async (canvas) => {
  if (canvas) {
    await canvasStore.initializeCanvas({
      workflowId: router.currentRoute.value.params.id as string,
      version: props.version,
      canvas,
      isContext: props.isContext,
      isLocked: props.isLocked
    })
    emit('canvasReady', canvas)
  }
})

</script>
