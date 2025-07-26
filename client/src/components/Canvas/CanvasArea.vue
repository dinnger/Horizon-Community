<template>
  <div class="p-2  h-[calc(100vh-55px)] w-full ">
    <div class="flex h-full rounded-xl overflow-hidden" :class="{ 'border-4 border-primary/80': name === 'execution' }">
      <canvas ref="canvasElement"></canvas>
      <div class="absolute bottom-3 right-3 flex flex-col gap-2 p-2 text-[11px] text-right">
        Pos: {{ canvasComposable.currentMousePosition.value.x }}x, {{ canvasComposable.currentMousePosition.value.y }}y
        <br>
        zoom: {{ canvasComposable.canvasZoom }}x
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { IUseCanvasType } from '@/composables/useCanvas.composable';
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router';


const props = defineProps<{
  name?: 'canvas' | 'execution'
  version?: string
  isLocked?: boolean
  canvasComposable: IUseCanvasType
}>()

const router = useRouter()


const emit = defineEmits<{
  canvasReady: [canvas: HTMLCanvasElement]
}>()

const canvasElement = ref<HTMLCanvasElement>()

watch(() => canvasElement.value, async (canvas) => {
  if (canvas) {
    console.warn('version', props.version)
    await props.canvasComposable.initializeCanvas({
      workflowId: router.currentRoute.value.params.id as string,
      version: props.version,
      canvas,
      isLocked: props.isLocked
    })
    emit('canvasReady', canvas)
  }
})

</script>
