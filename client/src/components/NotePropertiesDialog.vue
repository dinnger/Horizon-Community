<template>
  <div v-if="isVisible" class="fixed inset-0 z-50 flex items-center justify-center" @click.self="closeDialog">
    <!-- Overlay -->
    <div class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>

    <!-- Dialog -->
    <div class="relative bg-base-100 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] mx-4 flex flex-col">
      <!-- Header -->
      <div class="flex items-center justify-between p-4 border-b border-base-300">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <span class="mdi mdi-note text-primary text-xl"></span>
          </div>
          <div>
            <h2 class="text-lg font-semibold">{{ isEditing ? 'Editar Nota' : 'Crear Nota' }}</h2>
            <p class="text-sm text-base-content/60">
              {{ isEditing ? 'Modifica las propiedades de la nota' : 'Crea una nueva nota en el canvas' }}
            </p>
          </div>
        </div>
        <button class="btn btn-ghost btn-sm" @click="closeDialog">
          <span class="mdi mdi-close"></span>
        </button>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-6 space-y-6">
        <!-- Contenido de la nota -->
        <div>
          <label class="label">
            <span class="label-text font-medium">Contenido</span>
          </label>
          <textarea v-model="noteContent" class="textarea textarea-bordered h-20 w-full"
            placeholder="Escribe el contenido de la nota..."></textarea>
        </div>

        <!-- Color y Tamaño -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Color -->
          <div>
            <label class="label">
              <span class="label-text font-medium">Color</span>
            </label>
            <div class="grid grid-cols-4 gap-2">
              <button v-for="(color, name) in noteColors" :key="name"
                class="w-12 h-12 rounded-lg border-2 hover:scale-105 transition-transform"
                :class="noteColor === color ? 'border-primary ring-2 ring-primary ring-opacity-50' : 'border-base-300'"
                :style="{ backgroundColor: color }" @click="noteColor = color" :title="name"></button>
            </div>
          </div>

          <!-- Tamaño -->
          <div>
            <label class="label">
              <span class="label-text font-medium">Tamaño</span>
            </label>
            <div class="space-y-3">
              <div>
                <label class="label">
                  <span class="label-text text-sm">Ancho: {{ noteWidth }}px</span>
                </label>
                <input v-model.number="noteWidth" type="range" min="100" max="500" step="10"
                  class="range range-primary" />
                <div class="w-full flex justify-between text-xs text-base-content/60 px-2">
                  <span>100px</span>
                  <span>500px</span>
                </div>
              </div>
              <div>
                <label class="label">
                  <span class="label-text text-sm">Alto: {{ noteHeight }}px</span>
                </label>
                <input v-model.number="noteHeight" type="range" min="80" max="400" step="10"
                  class="range range-primary" />
                <div class="w-full flex justify-between text-xs text-base-content/60 px-2">
                  <span>80px</span>
                  <span>400px</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Información adicional (solo si está editando) -->
        <div v-if="isEditing && note" class="bg-base-200 rounded-lg p-4">
          <h4 class="font-medium text-sm mb-2">Información</h4>
          <div class="text-xs text-base-content/70 space-y-1">
            <div>
              <span class="font-medium">Creada:</span>
              {{ formatDate(note.createdAt) }}
            </div>
            <div v-if="note.updatedAt && note.updatedAt !== note.createdAt">
              <span class="font-medium">Modificada:</span>
              {{ formatDate(note.updatedAt) }}
            </div>
            <div>
              <span class="font-medium">ID:</span>
              <code class="bg-base-300 px-1 rounded text-xs">{{ note.id }}</code>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="flex items-center justify-between p-4 border-t border-base-300">
        <div class="flex items-center gap-2">
          <span v-if="hasChanges" class="text-sm text-base-content/60">
            <span class="mdi mdi-circle text-warning"></span>
            Cambios sin guardar
          </span>
        </div>
        <div class="flex gap-2">
          <button class="btn btn-ghost" @click="closeDialog">
            Cancelar
          </button>
          <button v-if="isEditing && hasChanges" class="btn btn-outline" @click="resetChanges">
            <span class="mdi mdi-refresh"></span>
            Restaurar
          </button>
          <button class="btn btn-primary" @click="saveNote" :disabled="!hasContent || isSaving">
            <span v-if="isSaving" class="loading loading-spinner loading-xs"></span>
            <span v-else class="mdi" :class="isEditing ? 'mdi-content-save' : 'mdi-plus'"></span>
            {{ isEditing ? 'Guardar' : 'Crear' }} Nota
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { NOTE_COLORS, type INoteCanvas, NOTE_DEFAULT_SIZE } from '@canvas/interfaz/note.interface'


const props = defineProps<{
  isVisible: boolean
  note?: INoteCanvas | null
  position?: { x: number; y: number }
}>()

const emit = defineEmits<{
  close: []
  save: [{
    id?: string
    content: string
    color: string
    size: { width: number; height: number }
    position?: { x: number; y: number }
  }]
}>()

// Estado del formulario
const noteContent = ref('<p></p>')
const noteColor = ref(NOTE_COLORS.yellow)
const noteWidth = ref(NOTE_DEFAULT_SIZE.width)
const noteHeight = ref(NOTE_DEFAULT_SIZE.height)
const isSaving = ref(false)

// Estado inicial para detectar cambios
const initialState = ref({
  content: '<p></p>',
  color: NOTE_COLORS.yellow,
  width: NOTE_DEFAULT_SIZE.width,
  height: NOTE_DEFAULT_SIZE.height
})

const noteColors = computed(() => NOTE_COLORS)
const isEditing = computed(() => !!props.note)

// Configuración para el editor Quill
const quillOptions = computed(() => ({
  theme: 'snow',
  modules: {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      [{ 'align': [] }],
      ['link'],
      ['clean']
    ]
  },
  placeholder: 'Escribe el contenido de la nota...'
}))

const updateContent = (content: string) => {
  noteContent.value = content
}

// Verificar si hay contenido válido
const hasContent = computed(() => {
  const text = noteContent.value.replace(/<[^>]*>/g, '').trim()
  return text.length > 0
})

// Detectar cambios
const hasChanges = computed(() => {
  if (!isEditing.value) return hasContent.value

  return (
    noteContent.value !== initialState.value.content ||
    noteColor.value !== initialState.value.color ||
    noteWidth.value !== initialState.value.width ||
    noteHeight.value !== initialState.value.height
  )
})

const formatDate = (date: Date | string | undefined) => {
  if (!date) return ''
  return new Date(date).toLocaleString()
}

const resetChanges = () => {
  noteContent.value = initialState.value.content
  noteColor.value = initialState.value.color
  noteWidth.value = initialState.value.width
  noteHeight.value = initialState.value.height
}

const saveNote = async () => {
  if (!hasContent.value || isSaving.value) return

  isSaving.value = true

  try {
    const noteData = {
      content: noteContent.value,
      color: noteColor.value,
      size: { width: noteWidth.value, height: noteHeight.value }
    }

    if (isEditing.value && props.note) {
      emit('save', {
        id: props.note.id,
        ...noteData
      })
    } else {
      emit('save', {
        ...noteData,
        position: props.position
      })
    }

    // Actualizar estado inicial después de guardar
    if (isEditing.value) {
      initialState.value = {
        content: noteContent.value,
        color: noteColor.value,
        width: noteWidth.value,
        height: noteHeight.value
      }
    }

    closeDialog()
  } catch (error) {
    console.error('Error guardando nota:', error)
  } finally {
    isSaving.value = false
  }
}

const closeDialog = () => {
  emit('close')
}

const resetForm = () => {
  noteContent.value = '<p></p>'
  noteColor.value = NOTE_COLORS.yellow
  noteWidth.value = NOTE_DEFAULT_SIZE.width
  noteHeight.value = NOTE_DEFAULT_SIZE.height
  isSaving.value = false
}

// Inicializar formulario cuando cambie la nota o se abra el diálogo
watch([() => props.note, () => props.isVisible], ([note, isVisible]) => {
  if (isVisible) {
    if (note) {
      // Modo edición
      noteContent.value = note.content || '<p></p>'
      noteColor.value = note.color || NOTE_COLORS.yellow
      noteWidth.value = note.size?.width || NOTE_DEFAULT_SIZE.width
      noteHeight.value = note.size?.height || NOTE_DEFAULT_SIZE.height

      // Guardar estado inicial
      initialState.value = {
        content: noteContent.value,
        color: noteColor.value,
        width: noteWidth.value,
        height: noteHeight.value
      }
    } else {
      // Modo creación
      resetForm()
      initialState.value = {
        content: '<p></p>',
        color: NOTE_COLORS.yellow,
        width: NOTE_DEFAULT_SIZE.width,
        height: NOTE_DEFAULT_SIZE.height
      }
    }
  }
}, { immediate: true })

// Limpiar cuando se cierre
watch(() => props.isVisible, (visible) => {
  if (!visible) {
    setTimeout(resetForm, 300) // Delay para animación
  }
})
</script>

<style scoped>
/* Estilos específicos para el editor Quill */
:deep(.ql-editor) {
  min-height: 200px;
  font-size: 14px;
}

:deep(.ql-toolbar) {
  border-top-left-radius: 0.375rem;
  border-top-right-radius: 0.375rem;
}

:deep(.ql-container) {
  border-bottom-left-radius: 0.375rem;
  border-bottom-right-radius: 0.375rem;
}

:deep(.ql-snow) {
  border: 1px solid hsl(var(--bc) / 0.2);
}

:deep(.ql-toolbar.ql-snow) {
  border-bottom: none;
}

:deep(.ql-container.ql-snow) {
  border-top: none;
}
</style>
