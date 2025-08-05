<template>
  <div v-if="showAddModal" class="modal modal-open">
    <div class="modal-box">
      <h3 class="font-bold text-lg mb-4">Agregar nuevo elemento</h3>
      <form @submit.prevent="addItem">
        <div class="form-control mb-4">
          <label class="label">
            <span class="label-text">Nombre</span>
          </label>
          <input v-model="newItem.name" type="text" placeholder="Nombre" class="input input-bordered w-full" required />
        </div>
        <div class="form-control mb-4">
          <label class="label">
            <span class="label-text">Descripción</span>
          </label>
          <textarea v-model="newItem.description" class="textarea textarea-bordered h-20"
            placeholder="Descripción..."></textarea>
        </div>
        <div class="form-control mb-6">
          <label class="label">
            <span class="label-text">Tipo</span>
          </label>
          <select v-model="newItem.type" class="select select-bordered w-full">
            <option value="credencial">Credencial</option>
            <option value="archivo">Archivo</option>
          </select>
        </div>
        <div class="modal-action">
          <button type="button" @click="$emit('close')" class="btn">Cancelar</button>
          <button type="submit" class="btn btn-primary">Agregar</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'
const props = defineProps<{ showAddModal: boolean, newItem: any }>()
const emits = defineEmits(['close', 'addItem'])
function addItem() {
  emits('addItem')
}
</script>
