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
          <textarea v-model="form.description" class="textarea textarea-bordered" placeholder="Descripción del rol"
            rows="3" required></textarea>
        </div>

        <!-- Nivel (solo informativo para edición) -->
        <div v-if="role" class="form-control">
          <label class="label">
            <span class="label-text">Nivel de Acceso</span>
          </label>
          <input :value="role.level" type="number" class="input input-bordered w-full" disabled />
          <label class="label">
            <span class="label-text-alt">El nivel determina la jerarquía de permisos (menor número = mayor nivel)</span>
          </label>
        </div>

        <!-- Estado -->
        <div class="form-control">
          <label class="label cursor-pointer">
            <span class="label-text">Rol Activo</span>
            <input v-model="form.isActive" type="checkbox" class="toggle toggle-primary" />
          </label>
        </div>

        <!-- Preview -->
        <div class="form-control" v-if="form.name">
          <label class="label">
            <span class="label-text">Vista Previa</span>
          </label>
          <div class="p-4 bg-base-200 rounded-lg">
            <div class="flex items-center justify-between mb-2">
              <span class="font-semibold">{{ form.name }}</span>
              <div class="badge badge-outline badge-sm">
                Nivel {{ role?.level || 'Nuevo' }}
              </div>
            </div>
            <p class="text-sm text-base-content/70 mb-2">
              {{ form.description }}
            </p>
            <div class="badge" :class="form.isActive ? 'badge-success' : 'badge-error'">
              {{ form.isActive ? 'Activo' : 'Inactivo' }}
            </div>
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

interface Role {
  id: string
  name: string
  description: string
  level: number
  status: 'active' | 'inactive'
}

interface Props {
  show: boolean
  role?: Role | null
}

interface Emits {
  (e: 'close'): void
  (e: 'save', data: { name: string; description: string; status: 'active' | 'inactive' }): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const form = ref({
  name: '',
  description: '',
  isActive: true
})

const handleSubmit = () => {
  emit('save', {
    name: form.value.name,
    description: form.value.description,
    status: form.value.isActive ? 'active' : 'inactive'
  })
}

// Reset form when modal opens/closes
watch(() => props.show, (newShow) => {
  if (newShow) {
    if (props.role) {
      form.value = {
        name: props.role.name,
        description: props.role.description,
        isActive: props.role.status === 'active'
      }
    } else {
      form.value = {
        name: '',
        description: '',
        isActive: true
      }
    }
  }
})
</script>
