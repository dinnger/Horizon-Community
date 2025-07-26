import type { INodeCanvas } from '@canvas/interfaz/node.interface'
import type { INote, INoteCanvas } from '@canvas/interfaz/note.interface'
import type { INodeGroup, INodeGroupCanvas } from '@canvas/interfaz/group.interface'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { IPanelConsole, IPanelTrace, WorkflowData } from '@/types/canvas'

export const useCanvas = defineStore('canvas', () => {
	const showNodePropertiesDialog = ref(false)
	// Estados para el diálogo de propiedades del nodo
	const selectedNodeForEdit = ref<INodeCanvas | null>(null)
	const showContextMenu = ref(false)
	// Estados para el menú contextual
	const selectedNodesForContext = ref<INodeCanvas[]>([])
	// Estados para el menú contextual de conexión
	const showConnectionContextMenu = ref(false)
	const selectedConnectionForContext = ref<{
		id: string
		nodeOrigin: INodeCanvas
		nodeDestiny: INodeCanvas
		input: string
		output: string
	} | null>(null)
	// Estados para el menú contextual del canvas
	const showCanvasContextMenu = ref(false)
	const canvasContextPosition = ref({ x: 0, y: 0 })
	const showNoteContextMenu = ref(false)
	const selectedNoteForContext = ref<INoteCanvas | null>(null)
	const noteContextPosition = ref({ x: 0, y: 0 })
	const showNotePropertiesDialog = ref(false)
	const selectedNoteForEdit = ref<INoteCanvas | null>(null)

	// Referencias reactivas del canvas

	const projectName = ref('Web Application')

	const isExecuting = ref(false)
	const isLoading = ref(true)
	const isError = ref(false)

	const canvasContextCanvasPosition = ref({ x: 0, y: 0 })
	// Estados para el modal de propiedades de nota
	const noteDialogPosition = ref({ x: 0, y: 0 })
	// Estados para el administrador de notas
	const showNotesManager = ref(false)
	const allNotes = ref<INoteCanvas[]>([])
	// Estados para el menú contextual de grupos
	const showGroupContextMenu = ref(false)
	const selectedGroupForContext = ref<INodeGroupCanvas | null>(null)
	// Estados para el modal de propiedades de grupo
	const showGroupPropertiesDialog = ref(false)
	const selectedGroupForEdit = ref<INodeGroupCanvas | null>(null)
	const selectedNodeIdsForGroup = ref<string[]>([])
	const isEditingGroup = ref(false)

	const history = ref<WorkflowData[]>([])
	const workflowId = ref<string>('')
	const flow = ref<{ workflowData: WorkflowData; version: string }>()
	const version = ref<{
		value: string
		status: 'draft' | 'published' | 'archived'
	}>({
		value: '0.0.1',
		status: 'draft'
	})
	const changes = ref(false)

	// Estado para la modal de selección de versiones
	const showSelectedVersion = ref(false)

	// =============================================================================
	// MÉTODOS DE GRUPOS
	// =============================================================================

	return {
		changes,
		version,

		showNodePropertiesDialog,
		selectedNodeForEdit,
		showContextMenu,
		canvasContextPosition,
		selectedNodesForContext,
		showConnectionContextMenu,
		showCanvasContextMenu,
		showNoteContextMenu,
		selectedConnectionForContext,
		selectedNoteForContext,
		noteContextPosition,
		showNotePropertiesDialog,
		selectedNoteForEdit,
		canvasContextCanvasPosition,
		// Referencias reactivas
		projectName,
		isExecuting,
		isLoading,
		isError,
		// Estados del selector de versiones
		noteDialogPosition,
		showNotesManager,
		allNotes,
		showGroupContextMenu,
		selectedGroupForContext,
		showGroupPropertiesDialog,
		selectedGroupForEdit,
		selectedNodeIdsForGroup,
		isEditingGroup,
		// Estado para la modal de selección de versiones
		showSelectedVersion
	}
})
