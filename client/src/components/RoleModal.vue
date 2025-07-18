<template>
  <div v-if="show" class="modal modal-open">
    <div class="modal-box w-11/12 max-w-lg">
      <h3 class="font-bold text-lg mb-6">
        {{ role ? 'Editar Rol' : 'Nuevo Rol' }}
      </h3>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <!-- Nombre -->
        <div class="form-control">
          <label class="label">
            <span class="label-text">Nombre</span>
          </label>
          <input v-model="form.name" type="text" placeholder="Nombre del rol" class="input input-bordered w-full"
            required />
        </div>

        <!-- Descripción -->
        <div class="form-control">
          <label class="label">
            <span class="label-text">Descripción</span>
          </label>
          <textarea v-model="form.description" class="textarea textarea-bordered"
            placeholder="Descripción del rol (opcional)" rows="3"></textarea>
        </div>

        <!-- Preview -->
        <div class="form-control" v-if="form.name">
          <label class="label">
            <span class="label-text">Vista Previa</span>
          </label>
          <div class="p-4 bg-base-200 rounded-lg">
            <div class="badge badge-ghost">
              {{ form.name }}
            </div>
            <p class="text-sm text-base-content/70 mt-2" v-if="form.description">
              {{ form.description }}
            </p>
          </div>
        </div>

        <div class="modal-action">
          <button type="button" class="btn" @click="$emit('close')">
            Cancelar
          </button>
          <button type="submit" class="btn btn-primary">
            {{ role ? 'Actualizar' : 'Crear' }}
          </button>
        </div>
      </form>
    </div>
    <div class="modal-backdrop" @click="$emit('close')"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { IRole } from '../../../shared/interfaces/deployment.interface'

interface Props {
  show: boolean
  role?: IRole | null
}

interface Emits {
  (e: 'close'): void
  (e: 'save', data: Partial<IRole>): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const form = ref({
  name: '',
  description: ''
})

const handleSubmit = () => {
  emit('save', {
    name: form.value.name,
    description: form.value.description || undefined
  })
}

// Reset form when modal opens/closes
watch(() => props.show, (newShow) => {
  if (newShow) {
    if (props.role) {
      form.value = {
        name: props.role.name,
        description: props.role.description || ''
      }
    } else {
      form.value = {
        name: '',
        description: ''
      }
    }
  }
})
</script>
