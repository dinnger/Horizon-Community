<template>
  <form @submit.prevent="createWorkflow">
    <Modal :is-visible="showWorkflowModal" @close="emit('close')" title="Nuevo Workflow" :width="'50vw'"
      description="Agregar un nuevo workflow" custom-class="p-4">
      <div class="form-control mb-4">
        <label class="label">
          <span class="label-text">Nombre del Workflow</span>
        </label>
        <input v-model="newWorkflow.name" type="text" placeholder="Deploy Production"
          class="input input-bordered w-full" required />
      </div>

      <div class="form-control mb-6">
        <label class="label">
          <span class="label-text">Descripción</span>
        </label>
        <textarea v-model="newWorkflow.description" class="textarea textarea-bordered h-24 w-full"
          placeholder="Describe el workflow..."></textarea>
      </div>

      <template #actions>
        <button type="button" @click="emit('close')" class="btn mr-2">
          Cancelar
        </button>
        <button type="submit" class="btn btn-primary">
          Crear Workflow
        </button>
      </template>

    </Modal>
  </form>
</template>

<script setup lang="ts">
import { useProjectWorkflows } from '@/composables/useProjectWorkflows';
import { reactive, ref } from 'vue';
import { useRoute } from 'vue-router';
import Modal from '../Modal.vue';

const route = useRoute()
const projectComposable = useProjectWorkflows({ projectId: route.params.id as string })

const props = defineProps<{
  showWorkflowModal: boolean
}>()

const emit = defineEmits<{
  'close': []
}>()

const newWorkflow = reactive({
  name: '',
  description: ''
})

const createWorkflow = () => {
  projectComposable.workflows.createWorkflow({
    name: newWorkflow.name,
    description: newWorkflow.description,
    status: 'pending',
    duration: '0m 0s',
  })

  // Reset form
  newWorkflow.name = ''
  newWorkflow.description = ''
  emit('close')
}

</script>
