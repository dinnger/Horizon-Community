<template>
  <div class="flex items-center justify-between p-6 border-t border-base-300">
    <div class="text-sm opacity-60">
      Los cambios no se aplicarán hasta guardar
    </div>
    <div class="flex space-x-3">
      <button @click="$emit('cancel')" class="btn btn-ghost">
        Cancelar
      </button>
      <button @click="$emit('reset')" class="btn btn-outline">
        Restablecer
      </button>
      <button @click="$emit('save')" class="btn btn-primary" :disabled="!hasChanges">
        <svg v-if="isSaving" class="animate-spin -ml-1 mr-3 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor"
            d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
          </path>
        </svg>
        {{ isSaving ? 'Guardando...' : 'Guardar Cambios' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  hasChanges: boolean
  isSaving: boolean
}

interface Emits {
  'cancel': []
  'reset': []
  'save': []
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
</script>
