<template>
  <form @submit.prevent="handleSubmit" class="flex-1 overflow-auto">
    <Modal :isVisible="isOpen" @close="close" :title="isEdit ? 'Editar Proyecto' : 'Crear Nuevo Proyecto'"
      description="Información básica del proyecto" two-panels>

      <!-- Información básica -->
      <div class="w-1/3 border-r border-base-300 pr-4 space-y-4 p-2">
        <h4 class="font-semibold text-base-content">Información Básica</h4>

        <div class="form-control">
          <label class="label">
            <span class="label-text">Nombre del Proyecto</span>
          </label>
          <input v-model="formData.name" type="text" placeholder="Mi proyecto increíble"
            class="input input-bordered w-full" required />
        </div>

        <div class="form-control">
          <label class="label">
            <span class="label-text">Descripción</span>
          </label>
          <textarea v-model="formData.description" class="textarea textarea-bordered h-24 w-full"
            placeholder="Describe tu proyecto..."></textarea>
        </div>

      </div>

      <!-- Configuración de Transporte -->
      <div class="flex-1 overflow-auto p-2  flex flex-col gap-4">
        <TransportConfig :transport-type="formData.transportType" :transportConfig="formData.transportConfig"
          @update:transport-type="changeTransportType" @update:transport-config="formData.transportConfig = $event" />
      </div>


      <template #actions>
        <button type="button" @click="close" class="btn mr-2">
          Cancelar
        </button>
        <button type="submit" class="btn btn-primary">
          {{ isEdit ? 'Actualizar Proyecto' : 'Crear Proyecto' }}
        </button>
      </template>
    </Modal>
  </form>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue'
import TransportConfig from './TransportConfig.vue'
import Modal from '../Modal.vue'
import type { IProjectClient, IProjectTransportConfig, IProjectTransportType } from '@shared/interfaces/standardized'

interface Props {
  isOpen: boolean
  isEdit?: boolean
  project?: IProjectClient | null
}

const props = withDefaults(defineProps<Props>(), {
  isEdit: false,
  project: null
})

const emit = defineEmits<{
  close: []
  submit: [data: {
    name: string
    description: string
    transportType?: IProjectTransportType
    transportConfig: IProjectTransportConfig
    deploymentId?: string | null
    deploymentConfiguration?: Record<string, any>
  }]
}>()

const formData = reactive<{
  name: string
  description: string
  transportType: IProjectTransportType
  transportConfig: IProjectTransportConfig
  deploymentId?: string | null
  deploymentConfiguration?: Record<string, any>
}>({
  name: '',
  description: '',
  transportType: 'none',
  transportConfig: {},
  deploymentId: null,
  deploymentConfiguration: {}
})

// Watch for project changes to populate form
watch(() => props.project, (project) => {
  if (project && props.isEdit) {
    formData.name = project.name
    formData.description = project.description
    formData.transportType = project.transportType || 'none'
    formData.transportConfig = project.transportConfig ? { ...project.transportConfig } : {}
    formData.deploymentId = (project as any).deploymentId || null
    formData.deploymentConfiguration = (project as any).deploymentConfiguration ? { ...(project as any).deploymentConfiguration } : {}
  }
}, { immediate: true })

// Reset form when modal closes
watch(() => props.isOpen, (isOpen) => {
  if (!isOpen && !props.isEdit) {
    resetForm()
  }
})

const changeTransportType = (type: IProjectTransportType) => {
  formData.transportType = type
}

const resetForm = () => {
  formData.name = ''
  formData.description = ''
  formData.transportType = 'none'
  formData.transportConfig = {}
  formData.deploymentId = null
  formData.deploymentConfiguration = {}
}

const handleSubmit = () => {
  emit('submit', {
    name: formData.name,
    description: formData.description,
    transportType: formData.transportType,
    transportConfig: formData.transportConfig,
    deploymentId: formData.deploymentId,
    deploymentConfiguration: formData.deploymentConfiguration
  })

  if (!props.isEdit) {
    resetForm()
  }
}

const close = () => {
  resetForm()
  emit('close')
}
</script>
