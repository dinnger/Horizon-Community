<!-- 
Componente refactorizado para manejar modales del canvas
Usa el patrón Observer para comunicación entre componentes
-->
<template>
  <template v-if="canvasActions">
    <!-- Panel de librería de nodos -->
    <NodesLibraryPanel @node-selected="canvasActions.handleNodeSelection" />

    <!-- Diálogo de propiedades del nodo -->
    <NodePropertiesDialog :is-visible="canvasModals.nodePropertiesDialog.isVisible"
      :node-data="canvasModals.nodePropertiesDialog.node" :is-read-only="canvasModals.nodePropertiesDialog.isReadOnly"
      @close="canvasModals.closeNodePropertiesDialog" @save="canvasActions.handleNodePropertiesSave"
      :canvas-composable="canvasComposable" />

    <!-- Menú contextual del nodo -->
    <NodeContextMenu :is-visible="canvasModals.nodeContextMenu.isVisible"
      :selected-nodes="canvasModals.nodeContextMenu.selectedNodes" @close="canvasModals.closeNodeContextMenu"
      @delete="canvasActions.handleNodeDelete" @duplicate="canvasActions.handleNodeDuplicate"
      @rename="canvasActions.handleNodeRename" @create-group="canvasActions.handleGroupCreate" />

    <!-- Menú contextual de conexión -->
    <ConnectionContextMenu :is-visible="canvasModals.connectionContextMenu.isVisible"
      :connection-info="canvasModals.connectionContextMenu.connectionInfo"
      @close="canvasModals.closeConnectionContextMenu" @delete="canvasActions.handleConnectionDelete" />

    <!-- Menú contextual del canvas -->
    <CanvasContextMenu :is-visible="canvasModals.canvasContextMenu.isVisible"
      :position="canvasModals.canvasContextMenu.position" @close="canvasModals.closeCanvasContextMenu"
      @add-note="canvasActions.handleNoteAdd($event.position)" />

    <!-- Menú contextual de notas -->
    <NoteContextMenu :is-visible="canvasModals.noteContextMenu.isVisible" :note="canvasModals.noteContextMenu.note"
      :position="canvasModals.noteContextMenu.position" @close="canvasModals.closeNoteContextMenu"
      @edit="canvasActions.handleNoteEdit" @delete="canvasActions.handleNoteDelete" />

    <!-- Menú contextual de grupos -->
    <GroupContextMenu :is-visible="canvasModals.groupContextMenu.isVisible"
      :selected-group="canvasModals.groupContextMenu.group" @close="canvasModals.closeGroupContextMenu"
      @edit-group="canvasActions.handleGroupEdit" @ungroup="canvasActions.handleGroupUngroup"
      @delete-group="canvasActions.handleGroupDelete" />

    <!-- Modal de propiedades de nota -->
    <NotePropertiesDialog :is-visible="canvasModals.notePropertiesDialog.isVisible"
      :note="canvasModals.notePropertiesDialog.note" :position="canvasModals.notePropertiesDialog.position"
      @close="canvasModals.closeNotePropertiesDialog" @save="canvasActions.handleNoteSave" />

    <!-- Modal de propiedades de grupo -->
    <GroupPropertiesDialog :is-open="canvasModals.groupPropertiesDialog.isVisible"
      :is-edit="canvasModals.groupPropertiesDialog.isEdit"
      :group-data="canvasModals.groupPropertiesDialog.group || undefined"
      :selected-node-ids="canvasModals.groupPropertiesDialog.selectedNodeIds"
      @close="canvasModals.closeGroupPropertiesDialog" @save="canvasActions.handleGroupSave" />

    <!-- Administrador de notas -->
    <NotesManagerModal :is-visible="canvasModals.notesManager.isVisible" :notes="canvasModals.notesManager.notes"
      @close="canvasModals.closeNotesManager" @select-note="canvasActions.handleNotesManagerSelectNote"
      @edit-note="canvasActions.handleNotesManagerEditNote" @delete-note="canvasActions.handleNotesManagerDeleteNote" />
  </template>

</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useCanvasEvents } from '@/stores/canvasEvents'
import { useCanvasModals } from '@/stores/canvasModals'
import type { INodeCanvas } from '@canvas/interfaz/node.interface'

// Componentes
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
import type { IUseCanvasType } from '@/composables/useCanvas.composable'
import type { IUseCanvasActionsType } from '@/composables/useCanvasActions.composable'

// Stores
const canvasEvents = useCanvasEvents()
const canvasModals = useCanvasModals()

// Listeners para los eventos
const eventUnsubscribers: (() => void)[] = []

const props = defineProps<{
  canvasComposable: IUseCanvasType
}>()

const canvasActions = props.canvasComposable.actions

onMounted(() => {
  // =============================================================================
  // REGISTRAR LISTENERS PARA EVENTOS DE NODOS
  // =============================================================================
  eventUnsubscribers.push(
    canvasEvents.on('node:properties:open', (data) => {
      const { node, isReadOnly = false } = data as { node: INodeCanvas; isReadOnly?: boolean }
      canvasModals.openNodePropertiesDialog(node, isReadOnly)
    })
  )

  eventUnsubscribers.push(
    canvasEvents.on('node:properties:close', () => {
      canvasModals.closeNodePropertiesDialog()
    })
  )

  eventUnsubscribers.push(
    canvasEvents.on('node:context:open', ({ nodes }) => {
      canvasModals.openNodeContextMenu(nodes)
    })
  )

  eventUnsubscribers.push(
    canvasEvents.on('node:context:close', () => {
      canvasModals.closeNodeContextMenu()
    })
  )

  // =============================================================================
  // REGISTRAR LISTENERS PARA EVENTOS DE CONEXIONES
  // =============================================================================
  eventUnsubscribers.push(
    canvasEvents.on('connection:context:open', ({ connectionInfo }) => {
      canvasModals.openConnectionContextMenu(connectionInfo)
    })
  )

  eventUnsubscribers.push(
    canvasEvents.on('connection:context:close', () => {
      canvasModals.closeConnectionContextMenu()
    })
  )

  // =============================================================================
  // REGISTRAR LISTENERS PARA EVENTOS DEL CANVAS
  // =============================================================================
  eventUnsubscribers.push(
    canvasEvents.on('canvas:context:open', ({ position }) => {
      canvasModals.openCanvasContextMenu(position)
    })
  )

  eventUnsubscribers.push(
    canvasEvents.on('canvas:context:close', () => {
      canvasModals.closeCanvasContextMenu()
    })
  )

  // =============================================================================
  // REGISTRAR LISTENERS PARA EVENTOS DE NOTAS
  // =============================================================================
  eventUnsubscribers.push(
    canvasEvents.on('note:context:open', ({ note, position }) => {
      canvasModals.openNoteContextMenu(note, position)
    })
  )

  eventUnsubscribers.push(
    canvasEvents.on('note:context:close', () => {
      canvasModals.closeNoteContextMenu()
    })
  )

  eventUnsubscribers.push(
    canvasEvents.on('note:properties:open', ({ note, position }) => {
      canvasModals.openNotePropertiesDialog(note || null, position)
    })
  )

  eventUnsubscribers.push(
    canvasEvents.on('note:properties:close', () => {
      canvasModals.closeNotePropertiesDialog()
    })
  )

  eventUnsubscribers.push(
    canvasEvents.on('note:manager:open', () => {
      // TODO: Obtener todas las notas del canvas
      canvasModals.openNotesManager([])
    })
  )

  eventUnsubscribers.push(
    canvasEvents.on('note:manager:close', () => {
      canvasModals.closeNotesManager()
    })
  )

  // =============================================================================
  // REGISTRAR LISTENERS PARA EVENTOS DE GRUPOS
  // =============================================================================
  eventUnsubscribers.push(
    canvasEvents.on('group:context:open', ({ group }) => {
      canvasModals.openGroupContextMenu(group)
    })
  )

  eventUnsubscribers.push(
    canvasEvents.on('group:context:close', () => {
      canvasModals.closeGroupContextMenu()
    })
  )

  eventUnsubscribers.push(
    canvasEvents.on('group:properties:open', ({ group, nodeIds }) => {
      canvasModals.openGroupPropertiesDialog(group, nodeIds)
    })
  )

  eventUnsubscribers.push(
    canvasEvents.on('group:properties:close', () => {
      canvasModals.closeGroupPropertiesDialog()
    })
  )
})

onUnmounted(() => {
  // Limpiar todos los listeners
  for (const unsubscribe of eventUnsubscribers) {
    unsubscribe()
  }
  eventUnsubscribers.length = 0
})
</script>

<style scoped>
/* Estilos si son necesarios */
</style>
