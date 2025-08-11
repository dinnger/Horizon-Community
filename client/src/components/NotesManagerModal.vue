<template>
  <div v-if="isVisible" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" @click="$emit('close')">
    <div class="bg-base-100 rounded-lg shadow-xl w-11/12 max-w-4xl max-h-[80vh] overflow-hidden" @click.stop>
      <div class="p-4 border-b border-base-300">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold">Administrar Notas</h2>
          <button class="btn btn-ghost btn-circle btn-sm" @click="$emit('close')">
            <span class="mdi mdi-close"></span>
          </button>
        </div>
      </div>

      <div class="p-4 overflow-y-auto max-h-[60vh]">
        <div v-if="notes.length === 0" class="text-center py-8 text-base-content/60">
          <div class="w-16 h-16 bg-base-300 rounded-full flex items-center justify-center mx-auto mb-3">
            <span class="mdi mdi-note-text text-2xl"></span>
          </div>
          <p>No hay notas en este workflow</p>
          <p class="text-sm">Haz clic derecho en el canvas para crear una nueva nota</p>
        </div>

        <div v-else class="grid gap-3">
          <div v-for="note in notes" :key="note.id"
            class="border border-base-300 rounded-lg p-3 hover:bg-base-50 transition-colors cursor-pointer"
            @click="selectNote(note)">
            <div class="flex items-start gap-3">
              <!-- Color indicator -->
              <div class="w-4 h-4 rounded border border-base-300 flex-shrink-0 mt-1"
                :style="{ backgroundColor: note.color }"></div>

              <!-- Note content -->
              <div class="flex-1 min-w-0">
                <p class="text-sm leading-relaxed break-words">
                  {{ note.content || 'Nota vacía' }}
                </p>

                <div class="flex items-center gap-4 mt-2 text-xs text-base-content/60">
                  <span>{{ formatDate(note.createdAt) }}</span>
                  <span v-if="note.updatedAt && note.updatedAt !== note.createdAt">
                    Editada: {{ formatDate(note.updatedAt) }}
                  </span>
                  <span>{{ note.position.x }}, {{ note.position.y }}</span>
                </div>
              </div>

              <!-- Actions -->
              <div class="flex items-center gap-1 flex-shrink-0">
                <button class="btn btn-ghost btn-xs" @click.stop="editNote(note)" title="Editar">
                  <span class="mdi mdi-pencil"></span>
                </button>
                <button class="btn btn-ghost btn-xs text-error" @click.stop="deleteNote(note.id)" title="Eliminar">
                  <span class="mdi mdi-delete"></span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="p-4 border-t border-base-300 bg-base-50">
        <div class="flex items-center justify-between">
          <span class="text-sm text-base-content/60">
            {{ notes.length }} {{ notes.length === 1 ? 'nota' : 'notas' }}
          </span>
          <div class="flex gap-2">
            <button class="btn btn-ghost btn-sm" @click="$emit('close')">
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { INoteCanvas } from '@canvas/interfaz/note.interface'

const props = defineProps<{
  isVisible: boolean
  notes: INoteCanvas[]
}>()

const emit = defineEmits<{
  close: []
  selectNote: [INoteCanvas]
  editNote: [INoteCanvas]
  deleteNote: [string]
}>()

const notes = computed(() => props.notes)

const formatDate = (date: Date | string) => {
  const d = typeof date === 'string' ? new Date(date) : date
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`
}

const selectNote = (note: INoteCanvas) => {
  emit('selectNote', note)
}

const editNote = (note: INoteCanvas) => {
  emit('editNote', note)
}

const deleteNote = (noteId: string) => {
  emit('deleteNote', noteId)
}
</script>
