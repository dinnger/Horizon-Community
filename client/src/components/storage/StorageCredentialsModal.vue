<template>
  <div>
    <form @submit.prevent="nextStep">
      <Modal :isVisible="showModal" @close="close" title="Nueva Credencial" description="Agregar una nueva credencial"
        two-panels>

        <div>
          <div class="bg-base-300 p-5 rounded-xl border-primary border-1 mb-2" v-if="step === 3">
            <div class="text-lg">
              Propiedades
            </div>
            <p class="text-sm opacity-40 leading-4">Proporciona las propiedades de la credencial seleccionada.</p>
          </div>

          <div class=" bg-base-300 p-5 rounded-xl mb-2" v-if="step === 3">
            <div class="text-lg">
              Credencial
            </div>
            Nombre:<br />
            <input type="text" :value="newItem.name" class="input input-bordered w-full mb-2"
              placeholder="Nombre de la credencial" disabled />
            Descripción:
            <textarea name="" class="textarea textarea-bordered w-full resize-none"
              placeholder="Descripción de la credencial" rows="3" disabled>{{ newItem.description }}</textarea>
          </div>

          <div class="bg-base-300 p-5 rounded-xl border-primary border-1 mb-2" v-if="step === 2">
            <div class="text-lg">
              Información de la credencial
            </div>
            <p class="text-sm opacity-40 leading-4">Proporciona la información de la credencial seleccionada.</p>
          </div>


          <div class="bg-base-300 p-5 rounded-xl border-primary border-1" v-if="step === 1">
            <h3 class="card-title ">
              Selección de credencial
            </h3>
            <p class="text-sm opacity-40">Selecciona una credencial del listado disponible.</p>
          </div>

          <div class="bg-base-300 p-5 rounded-xl" v-if="step > 1 && selectedNode">
            <div class="flex gap-2">
              <div class="material-icons text-4xl text-white">
                {{ selectedNode.icon }}
              </div>
              <div>
                <div class="text-lg">{{ selectedNode.name }}</div>
                <p class="text-sm opacity-40 leading-4">{{ selectedNode.desc }}</p>
              </div>
            </div>
            <span class="mdi mdi-close absolute top-3 right-3 cursor-pointer" @click="clearSelectedNode"></span>
          </div>


        </div>

        <!-- Paso 2: Selección de credenciales -->
        <template v-if="step === 1">
          <div v-if="!selectedNode">
            <h3 class="card-title mb-6">
              Selección de credencial
            </h3>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 ">
              <div v-for="node in nodesList" :key="node.name" class="btn  bg-base-300  h-18 " @click="selectNode(node)">
                <div>
                  <div class="material-icons text-2xl" :style="{ color: node.color }">{{ node.icon }}</div>
                  <div class="font-medium">{{ node.name }}</div>
                </div>
              </div>
            </div>
            <Empty v-if="nodesList.length === 0" title="Sin credenciales disponibles"
              description="No es posible continuar" icon="mdi-alert-circle-outline" />
          </div>
        </template>


        <!-- Paso 1: Información de la credencial -->
        <template v-if="step === 2">
          <div>
            <div class="form-control">
              <label class="label">
                <span class="label-text">Nombre</span>
              </label>
              <input type="text" v-model="newItem.name" class="input input-bordered w-full"
                placeholder="Nombre de la credencial" required />
            </div>
            <div class="form-control mt-2">
              <label class="label">
                <span class="label-text">Descripción</span>
              </label>
              <textarea v-model="newItem.description" class="textarea textarea-bordered w-full"
                placeholder="Descripción de la credencial" rows="3"></textarea>
            </div>
          </div>
        </template>


        <!-- Paso 3: Confirmación de credenciales  -->
        <template v-if="step === 3">
          <div v-if="selectedNode" class="flex flex-col h-full">
            <NodePropertyInput v-for="(property, key) in credentialsPropertiesNode" :key="key" :property="property"
              :property-key="String(key)" :model-value="property.value"
              @update:model-value="updateProperty(String(key), $event)" />
          </div>
        </template>

        <template #actions>
          <button type="button" @click="close" class="btn btn-outline mr-2">Cancelar</button>
          <button type="button" v-if="step >= 2" @click="back" class="btn btn-secondary mr-2">Volver</button>
          <button type="submit" v-if="step === 2" class="btn btn-primary">Siguiente</button>
          <button type="submit" v-if="step === 3" class="btn btn-primary btn-outline"
            :disabled="!selectedNode">Agregar</button>
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
import { useStorageComposable } from '@/composables/useStorage.composable'
import type { infoInterface, IPropertiesType } from '@shared/interfaces'
import { defineProps, defineEmits, ref, onMounted } from 'vue'
import Modal from '../Modal.vue'
import Empty from '../Empty.vue'
import NodePropertyInput from '../NodeProperties/NodePropertyInput.vue'
import { toast } from 'vue-sonner'

interface info extends infoInterface {
  key: string
}

const step = ref(1)
const showModal = ref(false)
const nodesList = ref<(info)[]>([])
const selectedNode = ref<info | null>(null)
const credentialsPropertiesNode = ref<IPropertiesType | null>(null)
const newItem = ref({
  name: '',
  description: '',
  type: 'credencial'
})

const useStore = useStorageComposable()
const emits = defineEmits(['close', 'addItem'])

const back = () => {
  if (step.value === 2) {
    step.value = 1
    clearSelectedNode()
  } else if (step.value === 3) {
    step.value = 2
  }
}

const nextStep = () => {
  if (step.value === 1) {
    step.value = 2
  } else if (step.value === 2 && selectedNode.value) {
    step.value = 3
  } else if (step.value === 3) {
    if (!selectedNode.value?.key) return
    useStorageComposable().createStorage({
      name: newItem.value.name,
      description: newItem.value.description,
      type: 'credential',
      nodeType: selectedNode.value.key,
      data: credentialsPropertiesNode.value ? JSON.stringify(credentialsPropertiesNode.value) : '',
      metadata: credentialsPropertiesNode.value ? Object.fromEntries(Object.entries(credentialsPropertiesNode.value).map(([k, v]) => [k, v.value])) : {}
    }).then((response) => {
      if (response.success) {
        toast.success('Credencial agregada correctamente')
        close()
      } else {
        toast.error(`Error al agregar la credencial: ${response.message}`)
        console.error('Error adding item:', response.message)
      }
    })

  }

}

const selectNode = (node: info) => {
  step.value = 2
  selectedNode.value = node
  useStore.getCredentialsProperties(node.key).then((credentialsProperties) => {
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
  step.value = 1
  newItem.value = {
    name: '',
    description: '',
    type: 'credencial'
  }
  clearSelectedNode()
  showModal.value = false
}

const updateProperty = (key: string, value: any) => {
  if (credentialsPropertiesNode.value) {
    credentialsPropertiesNode.value[key].value = value
  }
}

onMounted(() => {
  useStore.getCredentialsList().then((data) => {
    console.log(data)
    for (const item of data) {
      nodesList.value.push({ key: item.name, ...item.info })
    }
  })
})
</script>