<template>
  <div class="space-y-4">
    <h3 class="text-lg font-semibold mb-4">Credenciales</h3>
    <div v-if="Object.keys(credentials).length === 0" class="text-center py-8 opacity-60">
      Este nodo no requiere credenciales
    </div>
    <div v-else v-for="(credential, key) in credentials" :key="key" class="form-control">
      <label class="label">
        <span class="label-text font-medium">{{ credential.name || key }}</span>
        <span v-if="credential.required" class="text-error">*</span>
      </label>

      <input v-if="credential.type === 'password'" :value="credential.value"
        @input="updateCredential(String(key), ($event.target as HTMLInputElement).value)" type="password"
        :disabled="credential.disabled || isReadOnly" class="input input-bordered"
        :class="{ 'input-error': credential.required && !credential.value }" />

      <input v-else :value="credential.value"
        @input="updateCredential(String(key), ($event.target as HTMLInputElement).value)" type="text"
        :disabled="credential.disabled || isReadOnly" class="input input-bordered"
        :class="{ 'input-error': credential.required && !credential.value }" />

      <div v-if="credential.description" class="label">
        <span class="label-text-alt opacity-60">{{ credential.description }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { INodePropertiesType } from '@canvas/interfaz/node.properties.interface'

interface Props {
  credentials: INodePropertiesType
  isReadOnly?: boolean
}

interface Emits {
  'update:credential': [key: string, value: any]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const updateCredential = (key: string, value: any) => {
  if (!props.isReadOnly) {
    emit('update:credential', key, value)
  }
}
</script>

<style scoped>
.form-control {
  margin-bottom: 1rem;
}
</style>
