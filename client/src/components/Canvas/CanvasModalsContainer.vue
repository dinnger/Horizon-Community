<template>
  <!-- Panel de librería de nodos -->
  <NodesLibraryPanel @node-selected="$emit('nodeSelected', $event)" @close="$emit('panelClose')" />

  <!-- Diálogo de propiedades del nodo -->
  <NodePropertiesDialog :is-visible="showNodePropertiesDialog" :node-data="selectedNodeForEdit"
    @close="$emit('closeNodePropertiesDialog')" @save="$emit('nodePropertiesSave', $event)" />

  <!-- Menú contextual del nodo -->
  <NodeContextMenu :is-visible="showContextMenu" :selected-nodes="selectedNodesForContext"
    @close="$emit('closeContextMenu')" @delete="$emit('nodesDelete', $event)"
    @duplicate="$emit('nodeDuplicate', $event)" @rename="handleNodeRename"
    @create-group="$emit('createGroupRequest', $event)" />

  <!-- Menú contextual de conexión -->
  <ConnectionContextMenu :is-visible="showConnectionContextMenu" :connection-info="selectedConnectionForContext"
    @close="$emit('closeConnectionContextMenu')" @delete="$emit('connectionDelete', $event)" />

  <!-- Menú contextual del canvas -->
  <CanvasContextMenu :is-visible="showCanvasContextMenu" :position="canvasContextPosition"
    @close="$emit('closeCanvasContextMenu')" @add-note="$emit('addNoteRequest', $event)" />

  <!-- Menú contextual de notas -->
  <NoteContextMenu :is-visible="showNoteContextMenu" :note="selectedNoteForContext" :position="noteContextPosition"
    @close="$emit('closeNoteContextMenu')" @edit="$emit('editNoteRequest', $event)"
    @delete="$emit('noteDelete', $event)" />

  <!-- Menú contextual de grupos -->
  <GroupContextMenu :is-visible="showGroupContextMenu" :selected-group="selectedGroupForContext"
    @close="$emit('closeGroupContextMenu')" @edit-group="$emit('editGroupRequest', $event)"
    @ungroup="$emit('ungroupRequest', $event)" @delete-group="$emit('deleteGroupRequest', $event)" />

  <!-- Modal de propiedades de nota -->
  <NotePropertiesDialog :is-visible="showNotePropertiesDialog" :note="selectedNoteForEdit"
    :position="noteDialogPosition" @close="$emit('closeNotePropertiesDialog')" @save="$emit('noteSave', $event)" />

  <!-- Modal de propiedades de grupo -->
  <GroupPropertiesDialog :is-open="showGroupPropertiesDialog" :is-edit="isEditingGroup"
    :group-data="selectedGroupForEdit || undefined" :selected-node-ids="selectedNodeIdsForGroup"
    @close="$emit('closeGroupPropertiesDialog')" @save="$emit('groupPropertiesSave', $event)" />

  <!-- Administrador de notas -->
  <NotesManagerModal :is-visible="showNotesManager" :notes="allNotes" @close="$emit('closeNotesManager')"
    @select-note="$emit('notesManagerSelectNote', $event)" @edit-note="$emit('notesManagerEditNote', $event)"
    @delete-note="$emit('notesManagerDeleteNote', $event)" />
</template>

<script setup lang="ts">
import type { INodeCanvas, INodeCanvasAdd } from '@canvas/interfaz/node.interface'
import type { INodeGroupCanvas } from '@canvas/interfaz/group.interface'
import type { INoteCanvas } from '@canvas/interfaz/note.interface'
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

interface Props {
  // Estados para el diálogo de propiedades del nodo
  showNodePropertiesDialog: boolean
  selectedNodeForEdit: INodeCanvas | null

  // Estados para el menú contextual
  showContextMenu: boolean
  selectedNodesForContext: INodeCanvas[]

  // Estados para el menú contextual de conexión
  showConnectionContextMenu: boolean
  selectedConnectionForContext: {
    id: string
    nodeOrigin: INodeCanvas
    nodeDestiny: INodeCanvas
    input: string
    output: string
  } | null

  // Estados para el menú contextual del canvas
  showCanvasContextMenu: boolean
  canvasContextPosition: { x: number; y: number }

  // Estados para el menú contextual de notas
  showNoteContextMenu: boolean
  selectedNoteForContext: INoteCanvas | null
  noteContextPosition: { x: number; y: number }

  // Estados para el modal de propiedades de nota
  showNotePropertiesDialog: boolean
  selectedNoteForEdit: INoteCanvas | null
  noteDialogPosition: { x: number; y: number }

  // Estados para el administrador de notas
  showNotesManager: boolean
  allNotes: INoteCanvas[]

  // Estados para el menú contextual de grupos
  showGroupContextMenu: boolean
  selectedGroupForContext: INodeGroupCanvas | null

  // Estados para el modal de propiedades de grupo
  showGroupPropertiesDialog: boolean
  selectedGroupForEdit: INodeGroupCanvas | null
  selectedNodeIdsForGroup: string[]
  isEditingGroup: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  nodeSelected: [node: INodeCanvas]
  panelClose: []
  closeNodePropertiesDialog: []
  nodePropertiesSave: [node: INodeCanvas]
  closeContextMenu: []
  nodesDelete: [nodes: INodeCanvas[]]
  nodeDuplicate: [node: INodeCanvas]
  nodeRename: [node: INodeCanvas, newName: string]
  createGroupRequest: [nodeIds: string[]]
  closeConnectionContextMenu: []
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

const handleNodeRename = (node: INodeCanvas, newName: string) => {
  emit('nodeRename', node, newName)
}
</script>
