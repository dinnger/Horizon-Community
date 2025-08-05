/**
 * Store para el estado de los modales del canvas
 * Centraliza el estado de visibilidad y datos de todos los modales
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { INodeCanvas } from '@canvas/interfaz/node.interface'
import type { INodeGroupCanvas } from '@canvas/interfaz/group.interface'
import type { INoteCanvas } from '@canvas/interfaz/note.interface'

export const useCanvasModals = defineStore('canvasModals', () => {
	// =============================================================================
	// ESTADO DE MODALES DE NODOS
	// =============================================================================
	const nodePropertiesDialog = ref({
		isVisible: false,
		node: null as INodeCanvas | null,
		isReadOnly: false
	})

	const nodeContextMenu = ref({
		isVisible: false,
		position: { x: 0, y: 0 },
		selectedNodes: [] as INodeCanvas[]
	})

	// =============================================================================
	// ESTADO DE MODALES DE CONEXIONES
	// =============================================================================
	const connectionContextMenu = ref({
		isVisible: false,
		connectionInfo: null as {
			id: string
			nodeOrigin: INodeCanvas
			nodeDestiny: INodeCanvas
			input: string
			output: string
			position: { x: number; y: number }
		} | null
	})

	// =============================================================================
	// ESTADO DE MODALES DEL CANVAS
	// =============================================================================
	const canvasContextMenu = ref({
		isVisible: false,
		position: { x: 0, y: 0 }
	})

	// =============================================================================
	// ESTADO DE MODALES DE NOTAS
	// =============================================================================
	const noteContextMenu = ref({
		isVisible: false,
		note: null as INoteCanvas | null,
		position: { x: 0, y: 0 }
	})

	const notePropertiesDialog = ref({
		isVisible: false,
		note: null as INoteCanvas | null,
		position: { x: 0, y: 0 }
	})

	const notesManager = ref({
		isVisible: false,
		notes: [] as INoteCanvas[]
	})

	// =============================================================================
	// ESTADO DE MODALES DE GRUPOS
	// =============================================================================
	const groupContextMenu = ref({
		isVisible: false,
		group: null as INodeGroupCanvas | null,
		position: { x: 0, y: 0 }
	})

	const groupPropertiesDialog = ref({
		isVisible: false,
		isEdit: false,
		group: null as INodeGroupCanvas | null,
		selectedNodeIds: [] as string[]
	})

	// =============================================================================
	// MÉTODOS PARA NODOS
	// =============================================================================
	const openNodePropertiesDialog = (node: INodeCanvas, isReadOnly = false) => {
		nodePropertiesDialog.value = {
			isVisible: true,
			node,
			isReadOnly
		}
	}

	const closeNodePropertiesDialog = () => {
		nodePropertiesDialog.value = {
			isVisible: false,
			node: null,
			isReadOnly: false
		}
	}

	const openNodeContextMenu = (nodes: INodeCanvas[], position: { x: number; y: number }) => {
		nodeContextMenu.value = {
			isVisible: true,
			selectedNodes: nodes,
			position
		}
	}

	const closeNodeContextMenu = () => {
		nodeContextMenu.value = {
			isVisible: false,
			selectedNodes: [],
			position: { x: 0, y: 0 }
		}
	}

	// =============================================================================
	// MÉTODOS PARA CONEXIONES
	// =============================================================================
	const openConnectionContextMenu = (connectionInfo: {
		id: string
		nodeOrigin: INodeCanvas
		nodeDestiny: INodeCanvas
		input: string
		output: string
		position: { x: number; y: number }
	}) => {
		connectionContextMenu.value = {
			isVisible: true,
			connectionInfo
		}
	}

	const closeConnectionContextMenu = () => {
		connectionContextMenu.value = {
			isVisible: false,
			connectionInfo: null
		}
	}

	// =============================================================================
	// MÉTODOS PARA CANVAS
	// =============================================================================
	const openCanvasContextMenu = (position: { x: number; y: number }) => {
		canvasContextMenu.value = {
			isVisible: true,
			position
		}
	}

	const closeCanvasContextMenu = () => {
		canvasContextMenu.value = {
			isVisible: false,
			position: { x: 0, y: 0 }
		}
	}

	// =============================================================================
	// MÉTODOS PARA NOTAS
	// =============================================================================
	const openNoteContextMenu = (note: INoteCanvas, position: { x: number; y: number }) => {
		noteContextMenu.value = {
			isVisible: true,
			note,
			position
		}
	}

	const closeNoteContextMenu = () => {
		noteContextMenu.value = {
			isVisible: false,
			note: null,
			position: { x: 0, y: 0 }
		}
	}

	const openNotePropertiesDialog = (note: INoteCanvas | null, position: { x: number; y: number }) => {
		notePropertiesDialog.value = {
			isVisible: true,
			note,
			position
		}
	}

	const closeNotePropertiesDialog = () => {
		notePropertiesDialog.value = {
			isVisible: false,
			note: null,
			position: { x: 0, y: 0 }
		}
	}

	const openNotesManager = (notes: INoteCanvas[]) => {
		notesManager.value = {
			isVisible: true,
			notes
		}
	}

	const closeNotesManager = () => {
		notesManager.value = {
			isVisible: false,
			notes: []
		}
	}

	// =============================================================================
	// MÉTODOS PARA GRUPOS
	// =============================================================================
	const openGroupContextMenu = (group: INodeGroupCanvas, position: { x: number; y: number }) => {
		groupContextMenu.value = {
			isVisible: true,
			group,
			position
		}
	}

	const closeGroupContextMenu = () => {
		groupContextMenu.value = {
			isVisible: false,
			group: null,
			position: { x: 0, y: 0 }
		}
	}

	const openGroupPropertiesDialog = (group: INodeGroupCanvas | null = null, selectedNodeIds: string[] = []) => {
		groupPropertiesDialog.value = {
			isVisible: true,
			isEdit: group !== null,
			group,
			selectedNodeIds
		}
	}

	const closeGroupPropertiesDialog = () => {
		groupPropertiesDialog.value = {
			isVisible: false,
			isEdit: false,
			group: null,
			selectedNodeIds: []
		}
	}

	// =============================================================================
	// MÉTODO PARA CERRAR TODOS LOS MODALES
	// =============================================================================
	const closeAllModals = () => {
		closeNodePropertiesDialog()
		closeNodeContextMenu()
		closeConnectionContextMenu()
		closeCanvasContextMenu()
		closeNoteContextMenu()
		closeNotePropertiesDialog()
		closeNotesManager()
		closeGroupContextMenu()
		closeGroupPropertiesDialog()
	}

	return {
		// Estado
		nodePropertiesDialog,
		nodeContextMenu,
		connectionContextMenu,
		canvasContextMenu,
		noteContextMenu,
		notePropertiesDialog,
		notesManager,
		groupContextMenu,
		groupPropertiesDialog,

		// Métodos para nodos
		openNodePropertiesDialog,
		closeNodePropertiesDialog,
		openNodeContextMenu,
		closeNodeContextMenu,

		// Métodos para conexiones
		openConnectionContextMenu,
		closeConnectionContextMenu,

		// Métodos para canvas
		openCanvasContextMenu,
		closeCanvasContextMenu,

		// Métodos para notas
		openNoteContextMenu,
		closeNoteContextMenu,
		openNotePropertiesDialog,
		closeNotePropertiesDialog,
		openNotesManager,
		closeNotesManager,

		// Métodos para grupos
		openGroupContextMenu,
		closeGroupContextMenu,
		openGroupPropertiesDialog,
		closeGroupPropertiesDialog,

		// Utilidades
		closeAllModals
	}
})
