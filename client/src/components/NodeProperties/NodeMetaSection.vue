<template>
  <div class="space-y-4">
    <h3 class="text-lg font-semibold mb-4">Metadatos</h3>
    <div class="space-y-4">
      <div class="form-control">
        <label class="label">
          <span class="label-text font-medium">ID del Nodo</span>
        </label>
        <input :value="meta.id" type="text" class="input input-bordered" disabled />
      </div>

      <div class="form-control">
        <label class="label">
          <span class="label-text font-medium">Tipo</span>
        </label>
        <input :value="meta.type" type="text" class="input input-bordered" disabled />
      </div>

      <div class="form-control">
        <label class="label">
          <span class="label-text font-medium">Posición X</span>
        </label>
        <input :value="meta.design.x" @input="updateMeta('design.x', Number(($event.target as HTMLInputElement).value))"
          type="number" class="input input-bordered" />
      </div>

      <div class="form-control">
        <label class="label">
          <span class="label-text font-medium">Posición Y</span>
        </label>
        <input :value="meta.design.y" @input="updateMeta('design.y', Number(($event.target as HTMLInputElement).value))"
          type="number" class="input input-bordered" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface MetaData {
  id: string
  type: string
  design: { x: number; y: number }
}

interface Props {
  meta: MetaData
}

interface Emits {
  'update:meta': [path: string, value: any]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const updateMeta = (path: string, value: any) => {
  emit('update:meta', path, value)
}
</script>

<style scoped>
.form-control {
  margin-bottom: 1rem;
}
</style>
