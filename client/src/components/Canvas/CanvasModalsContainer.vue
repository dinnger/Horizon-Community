<template>
  <!-- Panel de librería de nodos -->
  <NodesLibraryPanel @node-selected="canvasStore.handleNodeSelection" />

  <!-- Diálogo de propiedades del nodo -->
  <NodePropertiesDialog :is-visible="canvasStore.showNodePropertiesDialog" :node-data="canvasStore.selectedNodeForEdit"
    @close="canvasStore.closeNodePropertiesDialog" @save="canvasStore.handleNodePropertiesSave" />

  <!-- Menú contextual del nodo -->
  <NodeContextMenu :is-visible="canvasStore.showContextMenu" :selected-nodes="canvasStore.selectedNodesForContext"
    @close="canvasStore.closeContextMenu" @delete="canvasStore.handleNodesDelete"
    @duplicate="canvasStore.handleNodeDuplicate" @rename="canvasStore.handleNodeRename"
    @create-group="$emit('createGroupRequest', $event)" />

  <!-- Menú contextual de conexión -->
  <ConnectionContextMenu :is-visible="canvasStore.showConnectionContextMenu"
    :connection-info="canvasStore.selectedConnectionForContext" @close="canvasStore.closeConnectionContextMenu"
    @delete="$emit('connectionDelete', $event)" />

  <!-- Menú contextual del canvas -->
  <CanvasContextMenu :is-visible="canvasStore.showCanvasContextMenu" :position="canvasStore.canvasContextPosition"
    @close="$emit('closeCanvasContextMenu')" @add-note="$emit('addNoteRequest', $event)" />

  <!-- Menú contextual de notas -->
  <NoteContextMenu :is-visible="canvasStore.showNoteContextMenu" :note="canvasStore.selectedNoteForContext"
    :position="canvasStore.noteContextPosition" @close="$emit('closeNoteContextMenu')"
    @edit="$emit('editNoteRequest', $event)" @delete="$emit('noteDelete', $event)" />

  <!-- Menú contextual de grupos -->
  <GroupContextMenu :is-visible="canvasStore.showGroupContextMenu" :selected-group="canvasStore.selectedGroupForContext"
    @close="$emit('closeGroupContextMenu')" @edit-group="$emit('editGroupRequest', $event)"
    @ungroup="$emit('ungroupRequest', $event)" @delete-group="$emit('deleteGroupRequest', $event)" />

  <!-- Modal de propiedades de nota -->
  <NotePropertiesDialog :is-visible="canvasStore.showNotePropertiesDialog" :note="canvasStore.selectedNoteForEdit"
    :position="canvasStore.noteDialogPosition" @close="$emit('closeNotePropertiesDialog')"
    @save="$emit('noteSave', $event)" />

  <!-- Modal de propiedades de grupo -->
  <GroupPropertiesDialog :is-open="canvasStore.showGroupPropertiesDialog" :is-edit="canvasStore.isEditingGroup"
    :group-data="canvasStore.selectedGroupForEdit || undefined" :selected-node-ids="canvasStore.selectedNodeIdsForGroup"
    @close="$emit('closeGroupPropertiesDialog')" @save="$emit('groupPropertiesSave', $event)" />

  <!-- Administrador de notas -->
  <NotesManagerModal :is-visible="canvasStore.showNotesManager" :notes="canvasStore.allNotes"
    @close="$emit('closeNotesManager')" @select-note="$emit('notesManagerSelectNote', $event)"
    @edit-note="$emit('notesManagerEditNote', $event)" @delete-note="$emit('notesManagerDeleteNote', $event)" />
</template>

<script setup lang="ts">
import type { INodeCanvas } from '@canvas/interfaz/node.interface'
import type { INodeGroupCanvas } from '@canvas/interfaz/group.interface'
import type { INoteCanvas } from '@canvas/interfaz/note.interface'
// import type { Canvas } from '@canvas/canvas'
import NodesLibraryPanel from '@/components/NodesLibraryPanel.vue'
import NodePropertiesDialog from '@/components/NodePropertiesDialog.vue'
import NodeContextMenu from '@/components/NodeContextMenu.vue'
import ConnectionContextMenu from '@/components/ConnectionContextMenu.vue'
import CanvasContextMenu from '@/components/CanvasContextMenu.vue'
import NoteContextMenu from '@/components/NoteContextMenu.vue'
import GroupContextMenu from '@/components/GroupContextMenu.vue'
import NotePropertiesDialog from '@/components/NotePropertiesDialog.vue'
import GroupPropertiesDialog from '@/components/GroupPropertiesDialog.vue'
import NotesManagerModal from '@/components/NotesManagerModal.vue'
import { useCanvas } from '@/stores'

const canvasStore = useCanvas()
const canvasInstance = canvasStore.getCanvasInstance

const emit = defineEmits<{
  createGroupRequest: [nodeIds: string[]]
  connectionDelete: [connectionId: string]
  closeCanvasContextMenu: []
  addNoteRequest: [data: { position: { x: number; y: number } }]
  closeNoteContextMenu: []
  editNoteRequest: [note: INoteCanvas]
  noteDelete: [noteId: string]
  closeGroupContextMenu: []
  editGroupRequest: [group: INodeGroupCanvas]
  ungroupRequest: [group: INodeGroupCanvas]
  deleteGroupRequest: [group: INodeGroupCanvas]
  closeNotePropertiesDialog: []
  noteSave: [noteData: {
    id?: string
    content: string
    color: string
    size: { width: number; height: number }
    position?: { x: number; y: number }
  }]
  closeGroupPropertiesDialog: []
  groupPropertiesSave: [data: { label: string; color: string; nodeIds?: string[]; groupId?: string }]
  closeNotesManager: []
  notesManagerSelectNote: [note: INoteCanvas]
  notesManagerEditNote: [note: INoteCanvas]
  notesManagerDeleteNote: [noteId: string]
}>()


</script>
