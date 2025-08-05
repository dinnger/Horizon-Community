<template>
  <!-- Error Icon -->

  <!-- Error Message -->
  <h1 class="text-6xl font-bold text-error mb-4 flex items-center justify-center">
    <img ref="img" :src="imgError" width="600" class="hidden">
    <canvas ref="canvas" width="400" height="400"></canvas>
  </h1>
  <h2 class="text-3xl font-semibold mb-4">Página no encontrada</h2>
  <p class="text-lg text-base-content/70 mb-6 max-w-md mx-auto">
    Lo sentimos, la página que buscas no existe o ha sido movida a otra ubicación.
  </p>


</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import imgError from '../assets/img/error.png'
const conteo = ref(0)
const canvas = ref<HTMLCanvasElement | null>(null)
const img = ref<HTMLImageElement | null>(null)

const SPRITE_WIDTH = 400
const SPRITE_HEIGHT = 400
const SPRITE_COLS = 8

function drawFrame(frame: number) {
  if (!canvas.value || !img.value) return
  const ctx = canvas.value.getContext('2d')
  if (!ctx) return
  ctx.clearRect(0, 0, SPRITE_WIDTH, SPRITE_HEIGHT)
  // Calcular columna y fila
  const col = frame % SPRITE_COLS
  const row = Math.floor(frame / SPRITE_COLS)
  ctx.drawImage(
    img.value,
    col * SPRITE_WIDTH, row * SPRITE_HEIGHT, SPRITE_WIDTH, SPRITE_HEIGHT, // src rect
    0, 0, SPRITE_WIDTH, SPRITE_HEIGHT // dest rect
  )
}

onMounted(() => {
  // Esperar a que la imagen cargue antes de dibujar
  if (img.value?.complete) {
    drawFrame(conteo.value)
  } else if (img.value) {
    img.value.onload = () => drawFrame(conteo.value)
  }
})

// Redibujar el frame cuando cambie conteo
watch(conteo, (val) => {
  drawFrame(val)
})

setInterval(() => {
  if (conteo.value >= 59) {
    conteo.value = 0
  }
  conteo.value++
}, 60)
</script>
