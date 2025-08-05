/**
 * Store para las acciones del canvas
 * Maneja las operaciones sobre nodos, conexiones, notas y grupos
 */
import type { INodeCanvas } from '@canvas/interfaz/node.interface'
import type { INodeGroupCanvas } from '@canvas/interfaz/group.interface'
import type { INoteCanvas } from '@canvas/interfaz/note.interface'
import { useCanvas, useCanvasEvents, useCanvasModals } from '@/stores'
import type { Canvas } from '@canvas/canvas'

export type IUseCanvasActionsType = ReturnType<typeof useCanvasActionsComposable>

export function useCanvasActionsComposable({
	canvasInstance,
	currentMousePosition,
	nodeOrigin
}: { canvasInstance: Canvas | null; currentMousePosition: any; nodeOrigin: any }) {
	const canvasStore = useCanvas()
	const canvasEvents = useCanvasEvents()
	const canvasModals = useCanvasModals()

	if (!canvasInstance) return

	// =============================================================================
	// ACCIONES DE NODOS
	// =============================================================================
	const handleNodeSelection = (node: INodeCanvas) => {
		// Crear una copia del nodo con nueva posición
		const nodeToAdd: INodeCanvas = {
			...JSON.parse(JSON.stringify(node)),
			design: {
				x: currentMousePosition.value.x || 100,
				y: currentMousePosition.value.y || 100
			}
		}
		console.log('nodeToAdd', nodeToAdd)

		// Añadir el nodo
		const connectorOriginName =
			typeof nodeOrigin.value?.connection === 'string' ? nodeOrigin.value.connection : nodeOrigin?.value.connection.name || ''
		console.log('connectorOriginName', connectorOriginName)
		const nodeId = canvasInstance.actionAddNode({
			origin: {
				idNode: nodeOrigin?.value.node.id as string,
				connectorOriginName
			},
			node: nodeToAdd
		})
	}

	const handleNodePropertiesSave = (updatedNode: INodeCanvas) => {
		// Actualizar el nodo en el canvas
		if (updatedNode.id) {
			canvasInstance.actionUpdateNodeProperties({
				id: updatedNode.id,
				properties: updatedNode.properties
			})
			canvasStore.changes = true
		}
		canvasEvents.emit('node:properties:close', undefined)
	}

	const handleNodeDelete = (nodes: INodeCanvas[]) => {
		const confirmMessage =
			nodes.length === 1
				? '¿Estás seguro de que quieres eliminar este nodo?'
				: `¿Estás seguro de que quieres eliminar ${nodes.length} nodos?`

		if (confirm(confirmMessage)) {
			const nodeIds = nodes.map((node) => node.id).filter((id): id is string => Boolean(id))
			canvasInstance.actionDeleteNodes({ ids: nodeIds })
			canvasStore.changes = true
		}
		canvasEvents.emit('node:context:close', undefined)
	}

	const handleNodeDuplicate = (node: INodeCanvas) => {
		if (!node.id) return

		canvasInstance.nodes.duplicateNode({ id: node.id })
		canvasEvents.emit('node:context:close', undefined)
	}

	const handleNodeRename = (node: INodeCanvas, newName: string) => {
		if (!node.id) return

		canvasInstance.actionUpdateNodeName({
			id: node.id,
			newName
		})
		canvasStore.changes = true
		canvasEvents.emit('node:context:close', undefined)
	}

	// =============================================================================
	// ACCIONES DE CONEXIONES
	// =============================================================================
	const handleConnectionDelete = (connectionId: string) => {
		canvasInstance.actionDeleteConnectionById({ id: connectionId })
		canvasStore.changes = true
		canvasEvents.emit('connection:context:close', undefined)
	}

	// =============================================================================
	// ACCIONES DE NOTAS
	// =============================================================================
	const handleNoteSave = (noteData: {
		id?: string
		content: string
		color: string
		size: { width: number; height: number }
		position?: { x: number; y: number }
	}) => {
		if (noteData.id) {
			// Actualizar nota existente
			canvasInstance.actionUpdateNote(noteData.id, {
				content: noteData.content,
				color: noteData.color,
				size: noteData.size
			})
		} else {
			// Crear nueva nota
			const position = noteData.position || canvasModals.notePropertiesDialog.position
			canvasInstance.actionAddNote({
				position,
				content: noteData.content,
				color: noteData.color,
				size: noteData.size
			})
		}

		canvasStore.changes = true
		canvasEvents.emit('note:properties:close', undefined)
	}

	const handleNoteDelete = (noteId: string) => {
		canvasInstance.actionDeleteNote(noteId)
		canvasStore.changes = true
		canvasEvents.emit('note:context:close', undefined)
	}

	const handleNoteEdit = (note: INoteCanvas) => {
		canvasEvents.emit('note:properties:open', {
			note,
			position: note.position
		})
	}

	const handleNoteAdd = (position: { x: number; y: number }) => {
		canvasEvents.emit('note:properties:open', {
			note: undefined,
			position
		})
	}

	// =============================================================================
	// ACCIONES DE GRUPOS
	// =============================================================================
	const handleGroupCreate = (nodeIds: string[]) => {
		canvasEvents.emit('group:properties:open', {
			group: undefined,
			nodeIds
		})
	}

	const handleGroupSave = (data: {
		label: string
		color: string
		nodeIds?: string[]
		groupId?: string
	}) => {
		if (data.groupId) {
			// Actualizar grupo existente
			canvasInstance.actionUpdateGroup(data.groupId, {
				label: data.label,
				color: data.color
			})
		} else if (data.nodeIds) {
			// Crear nuevo grupo
			canvasInstance.actionCreateGroup({
				nodeIds: data.nodeIds,
				label: data.label,
				color: data.color
			})
		}

		canvasStore.changes = true
		canvasEvents.emit('group:properties:close', undefined)
	}

	const handleGroupEdit = (group: INodeGroupCanvas) => {
		canvasEvents.emit('group:properties:open', { group })
	}

	const handleGroupUngroup = (group: INodeGroupCanvas) => {
		if (!group.id) return

		const confirmMessage = '¿Estás seguro de que quieres desagrupar estos nodos?'
		if (confirm(confirmMessage)) {
			canvasInstance.actionUngroup(group.id)
			canvasStore.changes = true
		}
		canvasEvents.emit('group:context:close', undefined)
	}

	const handleGroupDelete = (group: INodeGroupCanvas) => {
		if (!group.id) return

		const confirmMessage = '¿Estás seguro de que quieres eliminar este grupo?'
		if (confirm(confirmMessage)) {
			canvasInstance.actionDeleteGroup(group.id)
			canvasStore.changes = true
		}
		canvasEvents.emit('group:context:close', undefined)
	}

	// =============================================================================
	// ACCIONES DEL ADMINISTRADOR DE NOTAS
	// =============================================================================
	const handleNotesManagerSelectNote = (note: INoteCanvas) => {
		canvasEvents.emit('note:manager:close', undefined)
	}

	const handleNotesManagerEditNote = (note: INoteCanvas) => {
		canvasEvents.emit('note:manager:close', undefined)
		canvasEvents.emit('note:properties:open', {
			note,
			position: note.position
		})
	}

	const handleNotesManagerDeleteNote = (noteId: string) => {
		canvasInstance.actionDeleteNote(noteId)
		canvasStore.changes = true

		canvasModals.notesManager.notes = []
	}

	return {
		// Acciones de nodos
		handleNodeSelection,
		handleNodePropertiesSave,
		handleNodeDelete,
		handleNodeDuplicate,
		handleNodeRename,

		// Acciones de conexiones
		handleConnectionDelete,

		// Acciones de notas
		handleNoteSave,
		handleNoteDelete,
		handleNoteEdit,
		handleNoteAdd,

		// Acciones de grupos
		handleGroupCreate,
		handleGroupSave,
		handleGroupEdit,
		handleGroupUngroup,
		handleGroupDelete,

		// Acciones del administrador de notas
		handleNotesManagerSelectNote,
		handleNotesManagerEditNote,
		handleNotesManagerDeleteNote
	}
}
