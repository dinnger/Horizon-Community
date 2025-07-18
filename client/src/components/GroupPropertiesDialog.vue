<template>
  <div v-if="isOpen" class="modal-overlay" @click="closeModal">
    <div class="modal-container" @click.stop>
      <div class="modal-header">
        <h3>{{ isEdit ? 'Editar Grupo' : 'Crear Grupo' }}</h3>
        <button class="close-button" @click="closeModal">
          ×
        </button>
      </div>

      <div class="modal-content">
        <form @submit.prevent="submitForm">
          <!-- Etiqueta del grupo -->
          <div class="form-group">
            <label for="groupLabel">Etiqueta del Grupo:</label>
            <input id="groupLabel" v-model="localLabel" type="text" required
              placeholder="Ingresa el nombre del grupo..." class="form-input" />
          </div>

          <!-- Color del grupo -->
          <div class="form-group">
            <label>Color del Grupo:</label>
            <div class="color-selector">
              <div v-for="color in availableColors" :key="color" class="color-option"
                :class="{ selected: localColor === color }" :style="{ backgroundColor: color }"
                @click="localColor = color" />
            </div>
            <div class="custom-color-section">
              <label for="customColor">Color personalizado:</label>
              <input id="customColor" v-model="localColor" type="color" class="custom-color-picker" />
            </div>
          </div>

          <!-- Vista previa del color -->
          <div class="form-group">
            <label>Vista previa:</label>
            <div class="color-preview" :style="{
              backgroundColor: `${localColor}20`,
              border: `2px solid ${localColor}`,
              color: localColor
            }">
              {{ localLabel || 'Grupo de ejemplo' }}
            </div>
          </div>

          <!-- Información adicional para edición -->
          <div v-if="isEdit && groupData" class="form-group">
            <label>Información del grupo:</label>
            <div class="group-info">
              <p><strong>Nodos en el grupo:</strong> {{ groupData.nodeIds.length }}</p>
              <p><strong>Creado:</strong> {{ formatDate(groupData.createdAt) }}</p>
              <p><strong>Modificado:</strong> {{ formatDate(groupData.updatedAt) }}</p>
            </div>
          </div>
        </form>
      </div>

      <div class="modal-footer">
        <button type="button" class="cancel-button" @click="closeModal">
          Cancelar
        </button>
        <button type="button" class="save-button" @click="submitForm" :disabled="!localLabel.trim()">
          {{ isEdit ? 'Guardar Cambios' : 'Crear Grupo' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { INodeGroup, INodeGroupCanvas } from '../../canvas/interfaz/group.interface'
import { GROUP_COLORS, GROUP_DEFAULT_COLOR } from '../../canvas/interfaz/group.interface'

// Props
interface Props {
  isOpen: boolean
  isEdit?: boolean
  groupData?: INodeGroupCanvas
  selectedNodeIds?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  isEdit: false,
  groupData: undefined,
  selectedNodeIds: () => []
})

// Emits
interface Emits {
  (event: 'close'): void
  (event: 'save', data: {
    label: string;
    color: string;
    nodeIds?: string[];
    groupId?: string
  }): void
}

const emit = defineEmits<Emits>()

// State
const localLabel = ref('')
const localColor = ref<string>(GROUP_DEFAULT_COLOR)

// Computed
const availableColors = computed(() => GROUP_COLORS)

// Watchers
watch(() => props.isOpen, (newValue) => {
  if (newValue) {
    // Inicializar valores cuando se abra el modal
    if (props.isEdit && props.groupData) {
      localLabel.value = props.groupData.label
      localColor.value = props.groupData.color
    } else {
      localLabel.value = ''
      localColor.value = GROUP_DEFAULT_COLOR
    }
  }
})

watch(() => props.groupData, (newData) => {
  if (newData && props.isEdit) {
    localLabel.value = newData.label
    localColor.value = newData.color
  }
})

// Methods
const closeModal = () => {
  emit('close')
}

const submitForm = () => {
  if (!localLabel.value.trim()) return

  const data = {
    label: localLabel.value.trim(),
    color: localColor.value,
    ...(props.isEdit && props.groupData
      ? { groupId: props.groupData.id }
      : { nodeIds: props.selectedNodeIds }
    )
  }

  emit('save', data)
}

const formatDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-container {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: modalAppear 0.3s ease-out;
}

@keyframes modalAppear {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(-20px);
  }

  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px 16px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.close-button {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  padding: 4px;
  color: #6b7280;
  transition: color 0.2s;
}

.close-button:hover {
  color: #374151;
}

.modal-content {
  padding: 20px 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #374151;
}

.form-input {
  width: 100%;
  padding: 12px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #3b82f6;
}

.color-selector {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 8px;
  margin-bottom: 16px;
}

.color-option {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  cursor: pointer;
  border: 3px solid transparent;
  transition: all 0.2s;
  position: relative;
}

.color-option:hover {
  transform: scale(1.1);
}

.color-option.selected {
  border-color: #1f2937;
  transform: scale(1.1);
}

.color-option.selected::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-weight: bold;
  font-size: 16px;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
}

.custom-color-section {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background-color: #f9fafb;
  border-radius: 8px;
}

.custom-color-section label {
  margin: 0;
  font-size: 13px;
  color: #6b7280;
}

.custom-color-picker {
  width: 40px;
  height: 30px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.color-preview {
  padding: 16px;
  border-radius: 8px;
  text-align: center;
  font-weight: 600;
  font-size: 14px;
  min-height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.group-info {
  background-color: #f9fafb;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.group-info p {
  margin: 8px 0;
  font-size: 14px;
  color: #6b7280;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px 20px;
  border-top: 1px solid #e5e7eb;
}

.cancel-button {
  padding: 10px 20px;
  border: 2px solid #e5e7eb;
  background: white;
  color: #6b7280;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.cancel-button:hover {
  border-color: #d1d5db;
  color: #374151;
}

.save-button {
  padding: 10px 20px;
  border: none;
  background: #3b82f6;
  color: white;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.save-button:hover:not(:disabled) {
  background: #2563eb;
}

.save-button:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}
</style>
