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
      <label lass="input input-bordered validator w-full">
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
import { computed } from 'vue'
import NodeCodeEditor from './NodeCodeEditor.vue'
import type { propertiesType } from '@shared/interfaces'

interface Props {
  property: propertiesType
  propertyKey: string
  modelValue: any
  isReadOnly?: boolean
}

interface Emits {
  'update:modelValue': [value: any]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

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

</script>

<style scoped>
.form-control {
  margin-bottom: 1rem;
}

.textarea {
  resize: vertical;
}
</style>
