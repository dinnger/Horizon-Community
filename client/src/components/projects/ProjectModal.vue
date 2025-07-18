<template>
  <div v-if="isOpen" class="modal modal-open">
    <div class="modal-box w-11/12 h-[90vh] max-w-6xl flex flex-col">
      <h3 class="font-bold text-lg mb-4">
        {{ isEdit ? 'Editar Proyecto' : 'Crear Nuevo Proyecto' }}
      </h3>

      <form @submit.prevent="handleSubmit" class="flex-1 overflow-auto">
        <div class="overflow-auto flex flex-col h-full">
          <div class="flex-1 flex h-full gap-4 overflow-auto">
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
              <!-- Configuración de Deployments -->

              <TransportConfig v-model:transport-type="formData.transportType"
                v-model:transport-config="formData.transportConfig" />
            </div>
          </div>

          <div class="modal-action mt-6">
            <button type="button" @click="$emit('close')" class="btn">
              Cancelar
            </button>
            <button type="submit" class="btn btn-primary">
              {{ isEdit ? 'Actualizar Proyecto' : 'Crear Proyecto' }}
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue'
import TransportConfig from './TransportConfig.vue'
import type { Project, ProjectTransportConfig } from '@/stores'

interface Props {
  isOpen: boolean
  isEdit?: boolean
  project?: Project | null
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
    transportType?: 'none' | 'tcp' | 'rabbitmq' | 'kafka' | 'nats' | 'http' | 'websocket' | 'mqtt'
    transportConfig: ProjectTransportConfig
    deploymentId?: string | null
    deploymentConfiguration?: Record<string, any>
  }]
}>()

const formData = reactive<{
  name: string
  description: string
  transportType?: 'none' | 'tcp' | 'rabbitmq' | 'kafka' | 'nats' | 'http' | 'websocket' | 'mqtt'
  transportConfig: ProjectTransportConfig
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
</script>
