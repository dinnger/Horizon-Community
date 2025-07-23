/**
 * Store para las acciones del canvas
 * Maneja las operaciones sobre nodos, conexiones, notas y grupos
 */
import { defineStore } from 'pinia'
import { useCanvas } from './canvas'
import { useCanvasEvents } from './canvasEvents'
import { useCanvasModals } from './canvasModals'
import type { INodeCanvas } from '@canvas/interfaz/node.interface'
import type { INodeGroupCanvas } from '@canvas/interfaz/group.interface'
import type { INoteCanvas } from '@canvas/interfaz/note.interface'

export const useCanvasActions = defineStore('canvasActions', () => {
	const canvasStore = useCanvas()
	const canvasEvents = useCanvasEvents()
	const canvasModals = useCanvasModals()

	// =============================================================================
	// ACCIONES DE NODOS
	// =============================================================================
	const handleNodeSelection = (node: INodeCanvas) => {
		// Crear una copia del nodo con nueva posición
		const nodeToAdd: INodeCanvas = {
			...JSON.parse(JSON.stringify(node)),
			design: {
				x: canvasStore.currentMousePosition.x || canvasStore.nextNodePosition.x,
				y: canvasStore.currentMousePosition.y || canvasStore.nextNodePosition.y
			}
		}

		// Añadir el nodo
		const connectorOriginName =
			typeof canvasStore.nodeOrigin?.connection === 'string'
				? canvasStore.nodeOrigin.connection
				: canvasStore.nodeOrigin?.connection.name || ''
		const nodeId = canvasStore.getCanvasInstance.actionAddNode({
			origin: {
				idNode: canvasStore.nodeOrigin?.node.id as string,
				connectorOriginName
			},
			node: nodeToAdd
		})
	}

	const handleNodePropertiesSave = (updatedNode: INodeCanvas) => {
		// Actualizar el nodo en el canvas
		if (canvasStore.getCanvasInstance && updatedNode.id) {
			canvasStore.getCanvasInstance.actionUpdateNodeProperties({
				id: updatedNode.id,
				properties: updatedNode.properties
			})
			canvasStore.changes = true
		}
		canvasEvents.emit('node:properties:close', undefined)
	}

	const handleNodeDelete = (nodes: INodeCanvas[]) => {
		if (!canvasStore.getCanvasInstance) return

		const confirmMessage =
			nodes.length === 1
				? '¿Estás seguro de que quieres eliminar este nodo?'
				: `¿Estás seguro de que quieres eliminar ${nodes.length} nodos?`

		if (confirm(confirmMessage)) {
			const nodeIds = nodes.map((node) => node.id).filter((id): id is string => Boolean(id))
			canvasStore.getCanvasInstance.actionDeleteNodes({ ids: nodeIds })
			canvasStore.changes = true
		}
		canvasEvents.emit('node:context:close', undefined)
	}

	const handleNodeDuplicate = (node: INodeCanvas) => {
		if (!canvasStore.getCanvasInstance || !node.id) return

		if (!canvasStore.getCanvasInstance || !node?.id) return
		canvasStore.getCanvasInstance.nodes.duplicateNode({ id: node.id })
		canvasEvents.emit('node:context:close', undefined)
	}

	const handleNodeRename = (node: INodeCanvas, newName: string) => {
		if (!canvasStore.getCanvasInstance || !node.id) return

		canvasStore.getCanvasInstance.actionUpdateNodeName({
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
		if (!canvasStore.getCanvasInstance) return

		canvasStore.getCanvasInstance.actionDeleteConnectionById({ id: connectionId })
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
		if (!canvasStore.getCanvasInstance) return

		if (noteData.id) {
			// Actualizar nota existente
			canvasStore.getCanvasInstance.actionUpdateNote(noteData.id, {
				content: noteData.content,
				color: noteData.color,
				size: noteData.size
			})
		} else {
			// Crear nueva nota
			const position = noteData.position || canvasModals.notePropertiesDialog.position
			canvasStore.getCanvasInstance.actionAddNote({
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
		if (!canvasStore.getCanvasInstance) return

		canvasStore.getCanvasInstance.actionDeleteNote(noteId)
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
		if (!canvasStore.getCanvasInstance) return

		if (data.groupId) {
			// Actualizar grupo existente
			canvasStore.getCanvasInstance.actionUpdateGroup(data.groupId, {
				label: data.label,
				color: data.color
			})
		} else if (data.nodeIds) {
			// Crear nuevo grupo
			canvasStore.getCanvasInstance.actionCreateGroup({
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
		if (!canvasStore.getCanvasInstance || !group.id) return

		const confirmMessage = '¿Estás seguro de que quieres desagrupar estos nodos?'
		if (confirm(confirmMessage)) {
			canvasStore.getCanvasInstance.actionUngroup(group.id)
			canvasStore.changes = true
		}
		canvasEvents.emit('group:context:close', undefined)
	}

	const handleGroupDelete = (group: INodeGroupCanvas) => {
		if (!canvasStore.getCanvasInstance || !group.id) return

		const confirmMessage = '¿Estás seguro de que quieres eliminar este grupo?'
		if (confirm(confirmMessage)) {
			canvasStore.getCanvasInstance.actionDeleteGroup(group.id)
			canvasStore.changes = true
		}
		canvasEvents.emit('group:context:close', undefined)
	}

	// =============================================================================
	// ACCIONES DEL ADMINISTRADOR DE NOTAS
	// =============================================================================
	const handleNotesManagerSelectNote = (note: INoteCanvas) => {
		if (!canvasStore.getCanvasInstance) return

		// TODO: Implementar función para centrar vista en la nota
		console.log('Focusing note:', note.id)
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
		if (!canvasStore.getCanvasInstance) return

		canvasStore.getCanvasInstance.actionDeleteNote(noteId)
		canvasStore.changes = true

		// Actualizar la lista de notas en el administrador
		// TODO: Implementar método para obtener todas las notas
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
})
