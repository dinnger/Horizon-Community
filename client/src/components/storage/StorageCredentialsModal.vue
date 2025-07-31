<template>
  <div>
    <form @submit.prevent="addItem">
      <Modal :isVisible="showModal" @close="close" title="Nueva Credencial" description="Agregar una nueva credencial"
        customClass="p-2">

        <!-- Step 1: Selección de credenciales -->
        <div class="overflow-y-auto p-2" v-if="!selectedNode">
          <h3 class="card-title mb-6">
            Selección de credencial
          </h3>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 ">
            <div v-for="node in nodesList" :key="node.name" class="btn btn-primary btn-outline "
              @click="selectNode(node)">
              <span class="material-icons">{{ node.icon }}</span>
              <span class="font-medium">{{ node.name }}</span>
            </div>
            <Empty v-if="nodesList.length === 0" title="Sin credenciales disponibles"
              description="No es posible continuar" icon="mdi-alert-circle-outline" />
          </div>
        </div>

        <!-- Formulario de creación de credenciales -->
        <div v-if="selectedNode" class="flex flex-col h-full">
          <div class="card relative flex-1 ">
            <div class="bg-base-200 flex p-4 gap-4">
              <div class="material-icons text-4xl text-white">
                {{ selectedNode.icon }}
              </div>
              <div>
                <div>{{ selectedNode.name }}</div>
                <p class="text-sm opacity-70 -mt-1">{{ selectedNode.desc }}</p>
              </div>
            </div>
            <span class="mdi mdi-close absolute top-3 right-3 cursor-pointer" @click="clearSelectedNode"></span>
          </div>

          <div class="overflow-auto h-full p-2">
            <NodePropertyInput v-for="(property, key) in credentialsPropertiesNode" :key="key" :property="property"
              :property-key="String(key)" :model-value="property.value" />
          </div>

        </div>
        <template #actions>
          <button type="button" @click="close" class="btn btn-outline mr-2">Cancelar</button>
          <button type="submit" class="btn btn-primary btn-outline">Agregar</button>
        </template>
      </Modal>
    </form>
    <button class="btn btn-primary btn-sm" @click="showModal = true">
      <span class="mdi mdi-plus-thick"></span>
      Nueva Credencial
    </button>

  </div>
</template>

<script setup lang="ts">
import { useCredentialsComposable } from '@/composables/useCredentiasl.composable'
import type { infoInterface, IPropertiesType } from '@shared/interfaces'
import { defineProps, defineEmits, ref, onMounted } from 'vue'
import Modal from '../Modal.vue'
import Empty from '../Empty.vue'
import NodePropertyInput from '../NodeProperties/NodePropertyInput.vue'

interface info extends infoInterface {
  key: string
}

const showModal = ref(false)
const nodesList = ref<(info)[]>([])
const selectedNode = ref<info | null>(null)
const credentialsPropertiesNode = ref<IPropertiesType | null>(null)
const newItem = ref({
  name: '',
  description: '',
  type: 'credencial'
})

const useCredentials = useCredentialsComposable()
const emits = defineEmits(['close', 'addItem'])
const addItem = () => {
  console.log('Adding item:', selectedNode.value)
}

const selectNode = (node: info) => {
  selectedNode.value = node
  useCredentials.getCredentialsProperties(node.key).then((credentialsProperties) => {
    console.log(credentialsProperties)
    if (credentialsProperties) {
      credentialsPropertiesNode.value = credentialsProperties
    }
  })
}

const clearSelectedNode = () => {
  selectedNode.value = null
  credentialsPropertiesNode.value = null
}

const close = () => {
  selectedNode.value = null
  showModal.value = false
}

onMounted(() => {
  useCredentials.list().then((data) => {
    console.log(data)
    for (const item of data) {
      nodesList.value.push({ key: item.name, ...item.info })
    }
  })
})
</script>