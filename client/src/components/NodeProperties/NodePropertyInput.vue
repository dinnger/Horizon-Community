<template>
  <div class="form-control">
    <label class="label">
      <span class="label-text font-medium">{{ property.name || propertyKey }}</span>
      <span v-if="property.required" class="text-error">*</span>
    </label>

    <!-- Box input -->
    <div v-if="property.type === 'box'" class="p-2 border-1 border-base-content/20 rounded-md"
      :class="{ 'input-error': property.required && !property.value }">
      <div v-for="item in property.value" :key="item.label" class="flex flex-col  gap-2">
        <div class="text-sm text-base-content/70">{{ item.label }}</div>
        <div class="-mt-3 w-full truncate whitespace-nowrap overflow-hidden text-ellipsis">
          {{ item.value }}
        </div>
      </div>
    </div>

    <!-- Credentials -->
    <template v-else-if="property.type === 'credential'">
      <div class="flex gap-2">
        <select v-model="localValue" class="select select-bordered flex-1" :disabled="property.disabled || isReadOnly"
          :class="{ 'select-error': property.required && !property.value }">
          <option value="" disabled>Selecciona una credencial</option>
          <option v-for="credential in availableCredentials" :key="credential.id" :value="credential.id">
            {{ credential.name }}
          </option>
        </select>
        <button @click="refreshCredentials" :disabled="isLoadingCredentials || property.disabled || isReadOnly"
          class="btn btn-square btn-outline" :class="{ 'loading': isLoadingCredentials }">
          <svg v-if="!isLoadingCredentials" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
    </template>

    <!-- String input -->
    <template v-else-if="property.type === 'string'" class="form-control">
      <label class="input input-bordered  w-full" :class="{ 'validator': property.pattern }">
        <input v-model="localValue" type="text" :placeholder="property.placeholder"
          :disabled="property.disabled || isReadOnly" :pattern="validPattern(property.pattern)"
          :required="property.required" :class="{ 'input-error': property.required && !property.value }" />
      </label>
      <p class="validator-hint hidden">{{ property.patternHint }}</p>
    </template>

    <!-- Number input -->
    <template v-else-if="property.type === 'number'">
      <label class="input input-bordered w-full" :class="{ 'validator': property.pattern }">
        <input v-model.number="localValue" type="number" :min="property.min" :max="property.max" :step="property.step"
          :disabled="property.disabled || isReadOnly"
          :class="{ 'input-error': property.required && !property.value }" />
      </label>
      <p class="validator-hint hidden">{{ property.patternHint }}</p>
    </template>

    <!-- Textarea for long text -->
    <template v-else-if="property.type === 'textarea'">
      <label lass="textarea textarea-bordered validator w-full">
        <textarea :value="String(localValue || '')" @input="localValue = ($event.target as HTMLTextAreaElement).value"
          :disabled="property.disabled || isReadOnly" :rows="property.rows || 3"
          :class="{ 'textarea-error': property.required && !property.value }" />
      </label>
      <p class="validator-hint hidden">{{ property.patternHint }}</p>
    </template>

    <!-- Code Editor -->
    <NodeCodeEditor v-else-if="property.type === 'code'" :property="property" :property-key="propertyKey"
      :model-value="localValue" :is-read-only="isReadOnly" @update:model-value="localValue = $event" />

    <!-- Password input -->
    <input v-else-if="property.type === 'password'" v-model="localValue" type="password"
      :disabled="property.disabled || isReadOnly" class="input input-bordered"
      :class="{ 'input-error': property.required && !property.value }" />

    <!-- Boolean switch -->
    <div v-else-if="property.type === 'switch'" class="form-control">
      <label class="label cursor-pointer justify-start space-x-3">
        <input v-model="localValue" type="checkbox" class="toggle toggle-primary"
          :disabled="property.disabled || isReadOnly" />
        <span class="label-text">{{ localValue ? 'Activado' : 'Desactivado' }}</span>
      </label>
    </div>

    <!-- Options dropdown -->
    <select v-else-if="property.type === 'options'" v-model="localValue" class="select select-bordered w-full"
      :disabled="property.disabled || isReadOnly" :class="{ 'select-error': property.required && !property.value }">
      <option value="" disabled>Selecciona una opción</option>
      <option v-for="option in property.options" :key="option.value" :value="option.value" :disabled="option.disabled">
        {{ option.label }}
      </option>
    </select>

    <!-- List property -->
    <div v-else-if="property.type === 'list'" class="space-y-4">
      <div class="flex items-center justify-between">
        <span class="text-sm font-medium">Elementos de la lista</span>
        <button @click="addListItem" :disabled="property.disabled || isReadOnly" class="btn btn-sm btn-primary">
          <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Agregar
        </button>
      </div>

      <div v-if="!listItems.length"
        class="text-center py-8 text-base-content/60 border-2 border-dashed border-base-content/20 rounded-lg">
        No hay elementos en la lista
      </div>

      <div v-else class="space-y-3">
        <div v-for="(item, index) in listItems" :key="index"
          class="p-4 border border-base-content/20 rounded-lg bg-base-100">
          <div class="flex items-center justify-between mb-3">
            <span class="text-sm font-medium">Elemento {{ index + 1 }}</span>
            <button @click="removeListItem(index)" :disabled="property.disabled || isReadOnly"
              class="btn btn-sm btn-ghost text-error hover:bg-error/10">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>

          <div class="grid gap-3">
            <NodePropertyInput v-for="(propDef, propKey) of item" :key="`${index}-${propKey}`" :property="propDef"
              :property-key="String(propKey)" :model-value="item[propKey].value" :is-read-only="isReadOnly"
              :node-type="nodeType" @update:model-value="updateListItemProperty(index, propKey, $event)" />
          </div>
        </div>
      </div>
    </div>

    <!-- Default fallback -->
    <div v-else class="alert alert-warning">
      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd"
          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
          clip-rule="evenodd" />
      </svg>
      <span>Tipo de propiedad no soportado: {{ property.type }}</span>
    </div>

    <!-- Description -->
    <div v-if="property.description" class="label">
      <span class="label-text-alt opacity-60">{{ property.description }}</span>
    </div>


  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue'
import NodeCodeEditor from './NodeCodeEditor.vue'
import type { propertiesType } from '@shared/interfaces'
import socketService from '@/services/socket'
import { useWorkspaceStore } from '@/stores'

interface Props {
  property: propertiesType
  propertyKey: string
  modelValue: any
  isReadOnly?: boolean
  nodeType?: string // Nuevo prop para identificar el tipo de nodo
}

interface Emits {
  'update:modelValue': [value: any]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const workspaceStore = useWorkspaceStore()

// Estados para credentials
const availableCredentials = ref<any[]>([])
const isLoadingCredentials = ref(false)

const localValue = computed({
  get: () => props.modelValue,
  set: (value) => {
    if (!props.isReadOnly) {
      emit('update:modelValue', value)
    }
  }
})

const validPattern = (pattern?: string) => {
  if (!pattern) return undefined
  // remove first and last slashes if they exist
  if (pattern.startsWith('/') && pattern.endsWith('/')) {
    return pattern.slice(1, -1)
  }
}

// Función para cargar credenciales filtradas por tipo de nodo y workspace
const loadCredentials = async () => {
  if (props.property.type !== 'credential') return

  isLoadingCredentials.value = true
  try {
    const storageService = socketService.storage()
    const credentials = await storageService.getStorageList({
      type: 'credential'
    })

    // Filtrar por tipo de nodo si está especificado
    let filteredCredentials = credentials
    if (props.nodeType) {
      filteredCredentials = credentials.filter((cred: any) =>
        cred.nodeType === props.nodeType
      )
    }

    availableCredentials.value = filteredCredentials.map((cred: any) => ({
      id: cred.id,
      name: cred.name,
      nodeType: cred.nodeType,
      description: cred.description
    }))
  } catch (error) {
    console.error('Error loading credentials:', error)
    availableCredentials.value = []
  } finally {
    isLoadingCredentials.value = false
  }
}

// Función para refrescar credenciales
const refreshCredentials = async () => {
  await loadCredentials()
}

// Cargar credenciales al montar el componente
onMounted(() => {
  if (props.property.type === 'credential') {
    loadCredentials()
  }
})

// Observar cambios en el workspace para recargar credenciales
watch(() => workspaceStore.currentWorkspaceId, () => {
  if (props.property.type === 'credential') {
    loadCredentials()
  }
})

// Observar cambios en el tipo de nodo
watch(() => props.nodeType, () => {
  if (props.property.type === 'credential') {
    loadCredentials()
  }
})

// Lógica para propiedades de tipo list
const listItems = computed({
  get: () => {
    if (props.property.type === 'list') {
      return props.modelValue || []
    }
    return []
  },
  set: (value) => {
    if (!props.isReadOnly && props.property.type === 'list') {
      emit('update:modelValue', value)
    }
  }
})

// Computed para obtener el objeto de propiedades de la lista
const listPropertyObject = computed(() => {
  if (props.property.type === 'list') {
    const listProperty = props.property as Extract<propertiesType, { type: 'list' }>
    return listProperty.object
  }
  return {}
})

// Función para agregar un nuevo elemento a la lista
const addListItem = () => {
  if (props.property.type !== 'list' || props.isReadOnly) return
  const listProperty = props.property as Extract<propertiesType, { type: 'list' }>
  const currentItems = listItems.value
  listItems.value = [...currentItems, JSON.parse(JSON.stringify(listProperty.object))]
}

// Función para eliminar un elemento de la lista
const removeListItem = (index: number) => {
  if (props.property.type !== 'list' || props.isReadOnly) return
  const currentItems = listItems.value
  const newItems = currentItems.filter((_: any, i: number) => i !== index)
  listItems.value = newItems
}

// Función para actualizar una propiedad específica de un elemento de la lista
const updateListItemProperty = (itemIndex: number, propertyKey: string | number, value: any) => {
  if (props.property.type !== 'list' || props.isReadOnly) return
  const currentItems = [...listItems.value]
  if (currentItems[itemIndex]) {
    currentItems[itemIndex][propertyKey].value = value
    listItems.value = currentItems
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
</style>
