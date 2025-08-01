<template>
  <div>
    <form @submit.prevent="nextStep">
      <Modal :isVisible="showModal" @close="close" title="Nueva Credencial" description="Agregar una nueva credencial"
        two-panels>

        <div>
          <!-- Paso 1: Selección de credenciales -->
          <div class="bg-base-300 p-5 rounded-xl border-primary border-1" v-if="step === 1">
            <div>
              Selección de credencial
            </div>
            <p class="text-sm opacity-40 leading-[13px]">Selecciona una credencial del listado disponible.</p>
          </div>

          <!-- Paso 2: Información de la credencial -->
          <div class="bg-base-300 p-5 rounded-xl mb-2" v-if="step > 1 && selectedNode">
            <div class="flex">
              <div class="material-icons mr-2 text-white">
                {{ selectedNode.icon }}
              </div>{{ selectedNode.name }}
            </div>
            <p class="text-[12px] opacity-40 leading-[13px]">{{ selectedNode.desc }}</p>
          </div>

          <!-- Paso 3: Información de la credencial -->
          <div class="bg-base-300 p-5 rounded-xl border-primary border-1 mb-2" v-if="step === 2">
            <div class="">
              Información básica
            </div>
            <p class="text-[12px] opacity-40 leading-[13px]">Proporciona la información de la credencial seleccionada.
            </p>
          </div>

          <!-- Paso 4: Resumen de la credencial -->
          <div class=" bg-base-300 p-5 rounded-xl mb-2" v-if="step === 3">
            <div>
              Credencial
            </div>
            <div class="opacity-80 text-[12px] ">
              <div class="text-primary">Nombre:</div>
              {{ newItem.name }}
              <div class="text-primary">Descripción:</div>
              {{ newItem.description }}
            </div>
          </div>

          <!-- Paso 5: Proporcionar propiedades -->
          <div class="bg-base-300 p-5 rounded-xl border-primary border-1 mb-2" v-if="step === 3">
            <div>
              Propiedades
            </div>
            <p class="text-[12px] opacity-40 leading-[13px]">Proporciona las propiedades de la credencial seleccionada.
            </p>
          </div>
        </div>

        <!-- Paso 2: Selección de credenciales -->
        <template v-if="step === 1">
          <div v-if="!selectedNode">
            <h3 class="card-title mb-6">
              Selección de credencial
            </h3>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 ">
              <div v-for="node in nodesList" :key="node.name"
                class="hover:bg-base-300 bg-base-100 border-2 border-base-200 h-18 flex justify-center text-center items-center rounded-lg cursor-pointer"
                @click="selectNode(node)">
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
          <button type="button" v-if="step >= 2" @click="back"
            class="btn btn-secondary btn-outline mr-2">Volver</button>
          <button type="submit" v-if="step === 2" class="btn btn-primary btn-outline">Siguiente</button>
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
import { getClientCredentialContext } from '@/context'

const serverUrl = import.meta.env.VITE_SERVER_URL

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

let fnOnUpdateCredential: any = null

const back = () => {
  if (step.value === 2) {
    step.value = 1
    clearSelectedNode()
  } else if (step.value === 3) {
    step.value = 2
  }
}

const nextStep = async () => {
  if (step.value === 1) {
    step.value = 2
  } else if (step.value === 2 && selectedNode.value) {
    step.value = 3
    try {
      const credentialsScriptUrl = `${serverUrl}/api/external/nodes/credentials/${encodeURIComponent(selectedNode.value.key)}`
      const credentialsModule = await import(/* @vite-ignore */ credentialsScriptUrl)
      const onUpdateCredentialFunction = credentialsModule.onUpdateCredential
      if (typeof onUpdateCredentialFunction === 'function') {
        fnOnUpdateCredential = (properties: any) => { onUpdateCredentialFunction({ properties, context: getClientCredentialContext() }) }
        fnOnUpdateCredential(credentialsPropertiesNode.value)
      } else {
        console.warn('El script onUpdateCredential no exporta una función ejecutable')
      }
    } catch (error) {
      console.warn('No se pudo cargar el script onUpdateCredential:', error)
    }
  } else if (step.value === 3) {
    if (!selectedNode.value?.key || !credentialsPropertiesNode.value) return
    useStorageComposable().createStorage({
      name: newItem.value.name,
      description: newItem.value.description,
      type: 'credential',
      nodeType: selectedNode.value.key,
      data: credentialsPropertiesNode.value,
      metadata: credentialsPropertiesNode.value ? Object.fromEntries(Object.entries(credentialsPropertiesNode.value).map(([k, v]) => [k, v.value])) : {}
    }).then((response) => {
      if (response.success) {
        toast.success('Credencial agregada correctamente')
        // close()
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
  if (fnOnUpdateCredential) fnOnUpdateCredential(credentialsPropertiesNode.value)
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