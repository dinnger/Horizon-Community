/**
 * Store para manejo centralizado de subscribers del canvas
 * Se encarga de configurar y gestionar todos los event listeners del canvas
 */
import type { INodeCanvas } from '@canvas/interfaz/node.interface'
import type { INodeGroupCanvas } from '@canvas/interfaz/group.interface'
import type { INoteCanvas } from '@canvas/interfaz/note.interface'
import type { Canvas } from '@canvas/canvas'
import { useCanvasEvents } from '@/stores/canvasEvents'
import { useNodesLibraryStore } from '@/stores'
import type { INodeCanvasAdd } from '@shared/interfaces/standardized'

export function useCanvasSubscribersComposable() {
	const canvasEvents = useCanvasEvents()
	const nodesStore = useNodesLibraryStore()

	/**
	 * Configura todos los event listeners del canvas
	 */
	const setupCanvasSubscribers = (
		canvasInstance: Canvas,
		callbacks: {
			onNodeAdded?: (node: INodeCanvasAdd) => void
			onMouseMove?: (position: { x: number; y: number }) => void
			onZoomChange?: (zoom: { zoom: number }) => void
			onChanges?: () => void
		} = {}
	) => {
		if (!canvasInstance) return

		// =============================================================================
		// EVENTOS DE NODOS
		// =============================================================================
		canvasInstance.subscriber('node_dbclick', (e: { nodes: INodeCanvas[]; isLocked: boolean } | INodeCanvas[]) => {
			// Compatibilidad con el formato anterior
			const nodes = Array.isArray(e) ? e : e.nodes
			const isLocked = Array.isArray(e) ? false : e.isLocked

			if (nodes.length === 0) return
			if (nodes.length > 1) {
				alert('No se puede editar más de un nodo a la vez')
				return
			}
			canvasEvents.emit('node:properties:open', {
				node: nodes[0],
				isReadOnly: isLocked
			})
		})

		canvasInstance.subscriber(
			'node_context',
			(e: {
				canvasTranslate: { x: number; y: number }
				selected: INodeCanvas[]
			}) => {
				canvasEvents.emit('node:context:open', { nodes: e.selected })
			}
		)

		// =============================================================================
		// EVENTOS DE CONEXIONES
		// =============================================================================
		canvasInstance.subscriber(
			'node_connection_context',
			(connectionInfo: {
				id: string
				nodeOrigin: INodeCanvas
				nodeDestiny: INodeCanvas
				input: string
				output: string
			}) => {
				canvasEvents.emit('connection:context:open', { connectionInfo })
			}
		)

		// =============================================================================
		// EVENTOS DEL CANVAS
		// =============================================================================
		canvasInstance.subscriber(
			'canvas_context',
			(e: {
				position: { x: number; y: number }
				canvasPosition: { x: number; y: number }
			}) => {
				canvasEvents.emit('canvas:context:open', { position: e.position })
			}
		)

		// =============================================================================
		// EVENTOS DE NOTAS
		// =============================================================================
		canvasInstance.subscriber(
			'note_context',
			(e: {
				note: INoteCanvas
				position: { x: number; y: number }
			}) => {
				canvasEvents.emit('note:context:open', {
					note: e.note,
					position: e.position
				})
			}
		)

		// =============================================================================
		// EVENTOS DE GRUPOS
		// =============================================================================
		canvasInstance.subscriber(
			'group_context',
			(e: {
				group: INodeGroupCanvas
				position: { x: number; y: number }
			}) => {
				canvasEvents.emit('group:context:open', { group: e.group })
			}
		)

		// =============================================================================
		// EVENTOS DE INTERACCIÓN BÁSICA
		// =============================================================================
		canvasInstance.subscriber('mouse_move', (e: { x: number; y: number }) => {
			callbacks.onMouseMove?.(e)
		})

		canvasInstance.subscriber('zoom', (e: { zoom: number }) => {
			callbacks.onZoomChange?.(e)
		})

		canvasInstance.subscriber('node_added', (e: INodeCanvasAdd) => {
			callbacks.onNodeAdded?.(e)
			nodesStore.showNodePanel()
		})

		// =============================================================================
		// EVENTOS DE CAMBIOS (para tracking de modificaciones)
		// =============================================================================
		canvasInstance.subscriber(
			[
				'node_added',
				'node_removed',
				'node_moved',
				'node_update_properties',
				'group_moved',
				'group_added',
				'group_removed',
				'group_updated',
				'note_added',
				'note_updated',
				'note_removed',
				'note_moved'
			],
			() => {
				callbacks.onChanges?.()
			}
		)
	}

	return {
		setupCanvasSubscribers
	}
}
