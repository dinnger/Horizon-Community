<template>
  <div class="space-y-4">
    <h3 class="text-lg font-semibold mb-4">Propiedades</h3>
    <NodePropertyInput v-for="(property, key) in visibleProperties" :key="key" :property="property"
      :property-key="String(key)" :model-value="property.value" :is-read-only="isReadOnly"
      @update:model-value="updateProperty(String(key), $event)" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { INodePropertiesType } from '@canvas/interfaz/node.properties.interface'
import NodePropertyInput from './NodePropertyInput.vue'

interface Props {
  properties: INodePropertiesType
  isReadOnly?: boolean
}

interface Emits {
  'update:property': [key: string, value: any]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const visibleProperties = computed(() => {
  const entries = Object.entries(props.properties)
    .filter(([_, prop]) => prop.show !== false)
  return Object.fromEntries(entries)
})

const updateProperty = (key: string, value: any) => {
  if (!props.isReadOnly) {
    emit('update:property', key, value)
  }
}
</script>
