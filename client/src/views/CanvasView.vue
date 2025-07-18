<template>
  <div>
    <div v-if="!isLoading && !isError" class="h-screen bg-base-100 overflow-hidden">
      <!-- Canvas Header -->
      <CanvasHeader :project-name="projectName" @show-notes-manager="showNotesManager = true" @save="handleSave"
        @publish="handlePublish" />

      <!-- Execution Panel -->
      <CanvasExecutionPanel :is-executing="isExecuting" :version="canvasStore.version.value"
        @execute-workflow="handleExecuteWorkflow" @execute-with-version-selection="handleExecuteWithVersionSelection" />

      <!-- Canvas Area -->
      <CanvasArea :canvas-pos="canvasPos" :canvas-zoom="canvasZoom" @canvas-ready="initializeCanvas" />

      <!-- Modals Container -->
      <CanvasModalsContainer :show-node-properties-dialog="showNodePropertiesDialog"
        :selected-node-for-edit="selectedNodeForEdit" :show-context-menu="showContextMenu"
        :selected-nodes-for-context="selectedNodesForContext" :show-connection-context-menu="showConnectionContextMenu"
        :selected-connection-for-context="selectedConnectionForContext"
        :show-canvas-context-menu="showCanvasContextMenu" :canvas-context-position="canvasContextPosition"
        :show-note-context-menu="showNoteContextMenu" :selected-note-for-context="selectedNoteForContext"
        :note-context-position="noteContextPosition" :show-note-properties-dialog="showNotePropertiesDialog"
        :selected-note-for-edit="selectedNoteForEdit" :note-dialog-position="noteDialogPosition"
        :show-notes-manager="showNotesManager" :all-notes="allNotes" :show-group-context-menu="showGroupContextMenu"
        :selected-group-for-context="selectedGroupForContext" :show-group-properties-dialog="showGroupPropertiesDialog"
        :selected-group-for-edit="selectedGroupForEdit" :selected-node-ids-for-group="selectedNodeIdsForGroup"
        :is-editing-group="isEditingGroup" @node-selected="handleNodeSelection" @panel-close="onPanelClose"
        @close-node-properties-dialog="closeNodePropertiesDialog" @node-properties-save="handleNodePropertiesSave"
        @close-context-menu="closeContextMenu" @nodes-delete="handleNodesDelete" @node-duplicate="handleNodeDuplicate"
        @node-rename="handleNodeRename" @create-group-request="handleCreateGroupRequest"
        @close-connection-context-menu="closeConnectionContextMenu" @connection-delete="handleConnectionDelete"
        @close-canvas-context-menu="closeCanvasContextMenu" @add-note-request="handleAddNoteRequest"
        @close-note-context-menu="closeNoteContextMenu" @edit-note-request="handleEditNoteRequest"
        @note-delete="handleNoteDelete" @close-group-context-menu="closeGroupContextMenu"
        @edit-group-request="handleEditGroupRequest" @ungroup-request="handleUngroupRequest"
        @delete-group-request="handleDeleteGroupRequest" @close-note-properties-dialog="closeNotePropertiesDialog"
        @note-save="handleNoteSave" @close-group-properties-dialog="closeGroupPropertiesDialog"
        @group-properties-save="handleGroupPropertiesSave" @close-notes-manager="closeNotesManager"
        @notes-manager-select-note="handleNotesManagerSelectNote" @notes-manager-edit-note="handleNotesManagerEditNote"
        @notes-manager-delete-note="handleNotesManagerDeleteNote" />

      <!-- Version Selector Modal -->
      <VersionSelectorModal :is-visible="showVersionSelector" :available-versions="availableVersions"
        :selected-version="selectedVersion" @select-version="selectVersion"
        @execute-selected-version="executeSelectedVersion" @close="closeVersionSelector" />


      <!-- Auto Deployment Toast -->
      <AutoDeploymentToast :show="showAutoDeploymentToast" :workflow-name="autoDeploymentInfo?.workflowName || ''"
        :deployment-name="autoDeploymentInfo?.deploymentName || ''" />
    </div>

    <!-- Error State -->
    <CanvasErrorState v-if="isError" />

    <!-- Panel de Debug/Consola -->
    <DebugPanel />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useCanvas } from '@/stores'
import { useCanvasController } from '@/composables/useCanvasController'
import CanvasHeader from '@/components/Canvas/CanvasHeader.vue'
import CanvasExecutionPanel from '@/components/Canvas/CanvasExecutionPanel.vue'
import CanvasArea from '@/components/Canvas/CanvasArea.vue'
import CanvasModalsContainer from '@/components/Canvas/CanvasModalsContainer.vue'
import VersionSelectorModal from '@/components/Canvas/VersionSelectorModal.vue'
import AutoDeploymentToast from '@/components/AutoDeploymentToast.vue'
import CanvasErrorState from '@/components/Canvas/CanvasErrorState.vue'
import DebugPanel from '@/components/DebugPanel.vue'

const canvasStore = useCanvas()

// Usar el composable que contiene toda la lógica
const {
  // Referencias reactivas
  canvasPos,
  canvasZoom,
  projectName,
  isExecuting,
  isLoading,
  isError,

  // Estados del selector de versiones
  showVersionSelector,
  availableVersions,
  selectedVersion,

  // Estados de modales y menús contextuales
  showNodePropertiesDialog,
  selectedNodeForEdit,
  showContextMenu,
  selectedNodesForContext,
  showConnectionContextMenu,
  selectedConnectionForContext,
  showCanvasContextMenu,
  canvasContextPosition,
  showNoteContextMenu,
  selectedNoteForContext,
  noteContextPosition,
  showNotePropertiesDialog,
  selectedNoteForEdit,
  noteDialogPosition,
  showNotesManager,
  allNotes,
  showGroupContextMenu,
  selectedGroupForContext,
  showGroupPropertiesDialog,
  selectedGroupForEdit,
  selectedNodeIdsForGroup,
  isEditingGroup,

  // Estados del selector de despliegue
  showDeploymentSelector,
  selectedDeploymentId,
  currentWorkflowInfo,
  showAutoDeploymentToast,
  autoDeploymentInfo,

  // Funciones
  handleNodeSelection,
  onPanelClose,
  closeNodePropertiesDialog,
  handleNodePropertiesSave,
  closeContextMenu,
  handleNodesDelete,
  handleNodeDuplicate,
  handleNodeRename,
  closeConnectionContextMenu,
  handleConnectionDelete,
  closeCanvasContextMenu,
  handleAddNoteRequest,
  handleEditNoteRequest,
  handleNoteSave,
  closeNoteContextMenu,
  handleNoteDelete,
  closeNotesManager,
  handleNotesManagerSelectNote,
  handleNotesManagerEditNote,
  handleNotesManagerDeleteNote,
  handleCreateGroupRequest,
  closeGroupContextMenu,
  handleEditGroupRequest,
  handleUngroupRequest,
  handleDeleteGroupRequest,
  closeGroupPropertiesDialog,
  handleGroupPropertiesSave,
  handleExecuteWorkflow,
  handleExecuteWithVersionSelection,
  closeVersionSelector,
  executeSelectedVersion,
  handleSave,
  handlePublish,
  closeDeploymentSelector,
  handleDeploymentPublish,
  initializeCanvas,
  loadWorkflow,
  selectVersion,
  closeNotePropertiesDialog
} = useCanvasController()

onMounted(async () => {
  await loadWorkflow()
})
</script>

<style scoped>
.canvas-container {
  background-color: var(--fallback-b1, oklch(var(--b1)));
}
</style>
