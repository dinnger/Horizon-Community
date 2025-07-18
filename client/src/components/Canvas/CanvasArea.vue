<template>
  <div class="flex h-[calc(100vh-55px)]">
    <canvas ref="canvasElement"></canvas>
    <div class="absolute bottom-0 right-0 flex flex-col gap-2 p-2 text-[11px] text-right">
      Pos: {{ canvasPos }}
      <br>
      zoom: {{ canvasZoom }} X
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

interface Props {
  canvasPos: string
  canvasZoom: number
}

defineProps<Props>()

const emit = defineEmits<{
  canvasReady: [canvas: HTMLCanvasElement]
}>()

const canvasElement = ref<HTMLCanvasElement>()

watch(() => canvasElement.value, (canvas) => {
  if (canvas) {
    emit('canvasReady', canvas)
  }
})
</script>
