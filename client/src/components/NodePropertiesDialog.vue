<template>
  <div v-if="isVisible" class="fixed inset-0 z-50 flex items-center justify-center" @click.self="closeDialog">
    <!-- Overlay -->
    <div class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>

    <!-- Dialog -->
    <div class="relative bg-base-100 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] mx-4 flex flex-col">
      <!-- Header -->
      <NodePropertiesHeader :node-data="nodeData" @close="closeDialog" />

      <!-- Content -->
      <div class="flex-1 overflow-hidden flex">
        <!-- Sidebar -->
        <NodePropertiesSidebar :sections="sections" :active-section="activeSection"
          @section-change="activeSection = $event" />

        <!-- Main content -->
        <div class="flex-1 overflow-y-auto p-6">
          <NodePropertiesSection v-if="activeSection === 'properties'" :properties="editableProperties"
            :is-read-only="props.isReadOnly" @update:property="updateProperty" />

          <NodeCredentialsSection v-else-if="activeSection === 'credentials'" :credentials="editableCredentials"
            :is-read-only="props.isReadOnly" @update:credential="updateCredential" />

          <NodeMetaSection v-else-if="activeSection === 'meta'" :meta="editableMeta" :is-read-only="props.isReadOnly"
            @update:meta="updateMeta" />
        </div>
      </div>

      <!-- Footer -->
      <NodePropertiesFooter :has-changes="hasChanges" :is-saving="isSaving" :is-read-only="props.isReadOnly"
        @cancel="closeDialog" @reset="resetChanges" @save="saveChanges" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive } from 'vue'
import type { INodeCanvas } from '@canvas/interfaz/node.interface'
import type { INodePropertiesType } from '@canvas/interfaz/node.properties.interface'
import { useNodesLibraryStore } from '@/stores'
import socketService from '@/services/socket'

// Importar componentes
import NodePropertiesHeader from './NodeProperties/NodePropertiesHeader.vue'
import NodePropertiesSidebar from './NodeProperties/NodePropertiesSidebar.vue'
import NodePropertiesSection from './NodeProperties/NodePropertiesSection.vue'
import NodeCredentialsSection from './NodeProperties/NodeCredentialsSection.vue'
import NodeMetaSection from './NodeProperties/NodeMetaSection.vue'
import NodePropertiesFooter from './NodeProperties/NodePropertiesFooter.vue'

interface Props {
  isVisible: boolean
  nodeData: INodeCanvas | null
  isReadOnly?: boolean
}

interface Emits {
  close: []
  save: [nodeData: INodeCanvas]
}

const nodesLibraryStore = useNodesLibraryStore()

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

let fnOnCreate: any = null

const activeSection = ref('properties')
const isSaving = ref(false)

// Estados editables - se inicializan cuando se abre el diálogo
const editableProperties = ref<INodePropertiesType>({})
const editableCredentials = ref<INodePropertiesType>({})
const editableMeta = ref({
  id: '',
  type: '',
  design: { x: 0, y: 0 }
})

// Estados originales para comparar cambios
const originalProperties = ref<INodePropertiesType>({})
const tempProperties = ref<INodePropertiesType>({})
const originalCredentials = ref<INodePropertiesType>({})
const originalMeta = ref({
  id: '',
  type: '',
  design: { x: 0, y: 0 }
})

const sections = computed(() => [
  {
    key: 'properties',
    label: 'Propiedades',
    count: Object.keys(editableProperties.value).length
  },
  {
    key: 'credentials',
    label: 'Credenciales',
    count: Object.keys(editableCredentials.value).length
  },
  {
    key: 'meta',
    label: 'Metadatos',
    count: 4 // ID, tipo, x, y
  }
])

const properties = computed(() => {
  const entries = Object.entries(editableProperties.value)
    .filter(([_, prop]) => prop.show !== false)
  return Object.fromEntries(entries)
})

const hasChanges = computed(() => {
  return JSON.stringify(editableProperties.value) !== JSON.stringify(originalProperties.value) ||
    JSON.stringify(editableCredentials.value) !== JSON.stringify(originalCredentials.value) ||
    JSON.stringify(editableMeta.value) !== JSON.stringify(originalMeta.value)
})

// Métodos para actualizar datos
const updateProperty = (key: string, value: any) => {
  if (editableProperties.value[key]) {
    editableProperties.value[key].value = value
  }
  if (fnOnCreate) fnOnCreate(editableProperties.value)
}

const updateCredential = (key: string, value: any) => {
  if (editableCredentials.value[key]) {
    editableCredentials.value[key].value = value
  }
}

const updateMeta = (path: string, value: any) => {
  if (path === 'design.x') {
    editableMeta.value.design.x = value
  } else if (path === 'design.y') {
    editableMeta.value.design.y = value
  }
}

// Inicializar datos cuando se abre el diálogo
watch(() => props.isVisible, (newValue) => {
  if (newValue && props.nodeData) {
    initializeEditableData()
    activeSection.value = 'properties'
  }
})



const initializeEditableData = async () => {
  if (!props.nodeData) return

  // Clonar propiedades
  editableProperties.value = JSON.parse(JSON.stringify(props.nodeData.properties || {}))
  originalProperties.value = JSON.parse(JSON.stringify(props.nodeData.properties || {}))
  tempProperties.value = JSON.parse(JSON.stringify(props.nodeData.properties || {}))

  // Inicializar propiedades en el store
  nodesLibraryStore.propertiesInitialized(props.nodeData)

  // Clonar credenciales
  editableCredentials.value = JSON.parse(JSON.stringify(props.nodeData.credentials || {}))
  originalCredentials.value = JSON.parse(JSON.stringify(props.nodeData.credentials || {}))

  // Clonar metadatos
  editableMeta.value = {
    id: props.nodeData.id || '',
    type: props.nodeData.type || '',
    design: { ...props.nodeData.design }
  }
  originalMeta.value = JSON.parse(JSON.stringify(editableMeta.value))

  await importNodeOnCreate()
  if (fnOnCreate) fnOnCreate(editableProperties.value)
}

const resetChanges = () => {
  if (!props.nodeData) return
  nodesLibraryStore.getNodeInfo(props.nodeData.type).then((node) => {
    editableProperties.value = JSON.parse(JSON.stringify(node?.properties || {}))
  })
}

/**
 * Función para importar nodos usando el endpoint REST
 * Verifica que el socket esté activo y obtiene el script onCreate
 */
const importNodeOnCreate = async () => {
  fnOnCreate = null
  if (!props.nodeData) return

  try {
    // Obtener el socket ID del servicio de socket
    const socket = socketService.getSocket()
    if (!socket) return console.error('No hay socket conectado para importar nodos')


    const socketId = socket.id
    const nodeType = props.nodeData.type

    // Construir las URLs del endpoint REST
    const serverUrl = import.meta.env.VITE_SERVER_URL
    const validateUrl = `${serverUrl}/api/nodes/${socketId}/${encodeURIComponent(nodeType)}/validate`
    const scriptUrl = `${serverUrl}/api/nodes/${socketId}/${encodeURIComponent(nodeType)}`

    // Primero validar que tenemos acceso al script
    const validateResponse = await fetch(validateUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!validateResponse.ok) {
      if (validateResponse.status === 404) {
        console.log(`No se encontró script onCreate para el tipo de nodo: ${nodeType}`)
      } else if (validateResponse.status === 401) {
        console.log('Socket no autenticado o inactivo')
      }
      return
    }
    // Crear un contexto mock para la función onCreate
    const mockContext = {
      info: {
        uid: props.nodeData.id || 'mock-uid'
      },
      properties: {
        basic: {
          router: '/api'
        }
      },
      getEnvironment: (key: string) => {
        const envMap: Record<string, string> = {
          serverUrl: 'http://localhost:3001',
          baseUrl: '/webhook'
        }
        return envMap[key] || ''
      }
    }
    const module = await import(scriptUrl)
    const onCreateFunction = module.default

    // Ejecutar la función con las propiedades actuales y el contexto mock
    if (typeof onCreateFunction === 'function') {
      console.log('Ejecutando función onCreate con propiedades actuales...')

      fnOnCreate = (properties: any) => {
        onCreateFunction(properties, { context: mockContext })
      }
      // Ejecutar la función onCreate
    } else {
      console.warn('El script onCreate no exporta una función default ejecutable')
    }



  } catch (error) {
    console.error('Error de red al importar nodo:', error)
  }
}

const closeDialog = () => {
  emit('close')
}

const saveChanges = async () => {
  if (!props.nodeData || !hasChanges.value) return

  isSaving.value = true

  try {
    // Crear nodo actualizado
    const updatedNode: INodeCanvas = {
      ...props.nodeData,
      properties: { ...editableProperties.value },
      credentials: { ...editableCredentials.value },
      id: editableMeta.value.id,
      type: editableMeta.value.type,
      design: { ...editableMeta.value.design }
    }

    // Emitir evento de guardado
    emit('save', updatedNode)

    // Actualizar estados originales
    originalProperties.value = JSON.parse(JSON.stringify(editableProperties.value))
    originalCredentials.value = JSON.parse(JSON.stringify(editableCredentials.value))
    originalMeta.value = JSON.parse(JSON.stringify(editableMeta.value))

    // Cerrar diálogo
    closeDialog()
  } catch (error) {
    console.error('Error al guardar cambios:', error)
    alert('Error al guardar los cambios. Por favor, inténtalo de nuevo.')
  } finally {
    isSaving.value = false
  }
}
</script>

<style scoped>
.form-control {
  margin-bottom: 1rem;
}

.textarea {
  resize: vertical;
}

.font-mono {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
}
</style>