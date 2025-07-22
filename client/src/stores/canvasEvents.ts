/**
 * Store para manejo centralizado de eventos del canvas
 * Implementa el patrón Observer/Publisher-Subscriber para eventos de UI
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { INodeCanvas } from '@canvas/interfaz/node.interface'
import type { INodeGroupCanvas } from '@canvas/interfaz/group.interface'
import type { INoteCanvas } from '@canvas/interfaz/note.interface'

// Tipos de eventos del sistema de modales
export type CanvasModalEvent =
	| 'node:properties:open'
	| 'node:properties:close'
	| 'node:context:open'
	| 'node:context:close'
	| 'node:delete'
	| 'node:duplicate'
	| 'node:rename'
	| 'connection:context:open'
	| 'connection:context:close'
	| 'connection:delete'
	| 'canvas:context:open'
	| 'canvas:context:close'
	| 'note:add'
	| 'note:context:open'
	| 'note:context:close'
	| 'note:properties:open'
	| 'note:properties:close'
	| 'note:save'
	| 'note:delete'
	| 'note:manager:open'
	| 'note:manager:close'
	| 'note:manager:select'
	| 'note:manager:edit'
	| 'note:manager:delete'
	| 'group:create'
	| 'group:context:open'
	| 'group:context:close'
	| 'group:properties:open'
	| 'group:properties:close'
	| 'group:save'
	| 'group:ungroup'
	| 'group:delete'

// Datos que acompañan a cada evento
export type CanvasModalEventData = {
	'node:properties:open': { node: INodeCanvas }
	'node:properties:close': undefined
	'node:context:open': { nodes: INodeCanvas[] }
	'node:context:close': undefined
	'node:delete': { nodes: INodeCanvas[] }
	'node:duplicate': { node: INodeCanvas }
	'node:rename': { node: INodeCanvas; newName: string }
	'connection:context:open': { connectionInfo: any }
	'connection:context:close': undefined
	'connection:delete': { connectionId: string }
	'canvas:context:open': { position: { x: number; y: number } }
	'canvas:context:close': undefined
	'note:add': { position: { x: number; y: number } }
	'note:context:open': { note: INoteCanvas; position: { x: number; y: number } }
	'note:context:close': undefined
	'note:properties:open': { note?: INoteCanvas; position: { x: number; y: number } }
	'note:properties:close': undefined
	'note:save': {
		id?: string
		content: string
		color: string
		size: { width: number; height: number }
		position?: { x: number; y: number }
	}
	'note:delete': { noteId: string }
	'note:manager:open': undefined
	'note:manager:close': undefined
	'note:manager:select': { note: INoteCanvas }
	'note:manager:edit': { note: INoteCanvas }
	'note:manager:delete': { noteId: string }
	'group:create': { nodeIds: string[] }
	'group:context:open': { group: INodeGroupCanvas }
	'group:context:close': undefined
	'group:properties:open': { group?: INodeGroupCanvas; nodeIds?: string[] }
	'group:properties:close': undefined
	'group:save': {
		label: string
		color: string
		nodeIds?: string[]
		groupId?: string
	}
	'group:ungroup': { group: INodeGroupCanvas }
	'group:delete': { group: INodeGroupCanvas }
}

// Tipo de handler para eventos
type EventHandler<T extends CanvasModalEvent> = (data: CanvasModalEventData[T]) => void

export const useCanvasEvents = defineStore('canvasEvents', () => {
	// Map de listeners para cada tipo de evento
	const listeners = ref<Map<CanvasModalEvent, EventHandler<any>[]>>(new Map())

	/**
	 * Registra un listener para un evento específico
	 */
	const on = <T extends CanvasModalEvent>(event: T, handler: EventHandler<T>) => {
		if (!listeners.value.has(event)) {
			listeners.value.set(event, [])
		}
		const eventListeners = listeners.value.get(event)
		if (eventListeners) {
			eventListeners.push(handler)
		}

		// Retorna función para desregistrar el listener
		return () => {
			const handlers = listeners.value.get(event)
			if (handlers) {
				const index = handlers.indexOf(handler)
				if (index > -1) {
					handlers.splice(index, 1)
				}
			}
		}
	}

	/**
	 * Remueve un listener específico para un evento
	 */
	const off = <T extends CanvasModalEvent>(event: T, handler: EventHandler<T>) => {
		const handlers = listeners.value.get(event)
		if (handlers) {
			const index = handlers.indexOf(handler)
			if (index > -1) {
				handlers.splice(index, 1)
			}
		}
	}

	/**
	 * Emite un evento con sus datos
	 */
	const emit = <T extends CanvasModalEvent>(event: T, data: CanvasModalEventData[T]) => {
		const handlers = listeners.value.get(event)
		if (handlers) {
			for (const handler of handlers) {
				try {
					handler(data)
				} catch (error) {
					console.error(`Error in event handler for ${event}:`, error)
				}
			}
		}
	}

	/**
	 * Limpia todos los listeners de un evento
	 */
	const clearListeners = (event: CanvasModalEvent) => {
		listeners.value.set(event, [])
	}

	/**
	 * Limpia todos los listeners
	 */
	const clearAllListeners = () => {
		listeners.value.clear()
	}

	return {
		on,
		off,
		emit,
		clearListeners,
		clearAllListeners
	}
})
