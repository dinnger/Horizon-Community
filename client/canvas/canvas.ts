import './style/style.css'
import '@fontsource-variable/comfortaa'
import type { INodeCanvas, INodeConnections } from './interfaz/node.interface.js'
import type { INote } from './interfaz/note.interface.js'
import { drawNodeConnectionPreview, renderSelected, getTempConnection, setIndexTime, renderAnimation } from './canvasHelpers'
import { pattern_dark, pattern_light } from './canvasPattern'
import { v4 as uuidv4 } from 'uuid'
import { Nodes, type ICanvasNodeNew } from './canvasNodes'
import { CanvasNotes } from './canvasNotes'
import { CanvasGroups } from './canvasGroups'

export interface ILog {
	logs?: object
}

type EventsCanvas =
	| 'node_context'
	| 'node_dbclick'
	| 'node_selected'
	| 'node_deselected'
	| 'node_moved'
	| 'node_added'
	| 'node_removed'
	| 'node_update_properties'
	| 'node_connection_selected'
	| 'node_connection_context'
	| 'canvas_context'
	| 'note_context'
	| 'note_added'
	| 'note_updated'
	| 'note_removed'
	| 'note_moved'
	| 'group_context'
	| 'group_added'
	| 'group_updated'
	| 'group_removed'
	| 'group_moved'
	| 'mouse_move'
	| 'zoom'
	| 'clear'

/**
 * Clase principal que maneja el canvas de flujo de trabajo.
 * Gestiona la renderización, eventos, y operaciones de nodos y conexiones.
 */
export class Canvas {
	canvas: HTMLCanvasElement
	context: CanvasRenderingContext2D
	ctx: CanvasRenderingContext2D
	canvasTranslate: { x: number; y: number } = { x: 0, y: 0 }
	canvasTempPosX = 0
	canvasTempPosY = 0
	canvasWidth = 0
	canvasHeight = 0
	canvasFactor = 1
	canvasPattern: CanvasPattern | undefined
	canvasRelativePos: INodeCanvas['design'] = { x: 0, y: 0 }
	canvasPosition: INodeCanvas['design'] = { x: 0, y: 0 }
	canvasGrid = 40
	canvasSelect: {
		x1: number
		y1: number
		x2: number
		y2: number
		show: boolean
	} = { x1: 0, y1: 0, x2: 0, y2: 0, show: false }

	// setInterval
	backgroundUpdateInterval: ReturnType<typeof setInterval> | null = null
	canvasFps: number = 1000 / 40
	indexTime = 0
	theme: string

	nodes: Nodes
	notes: CanvasNotes
	groups: CanvasGroups

	selectedNode: ICanvasNodeNew[] = []
	newConnectionNode: {
		node: INodeCanvas
		type: 'input' | 'output' | 'callback'
		index: number
		value: any
		relative?: { x: number; y: number }
	} | null = null

	isNodeConnectionVisible = false

	eventsCanvas = ['mousedown', 'mouseup', 'mousemove', 'wheel', 'dblclick', 'contextmenu']
	eventsType: 'cursor' | 'move' = 'cursor'

	isDragging = false

	subscribers: {
		event: EventsCanvas | EventsCanvas[]
		callback: (e: any) => any
	}[] = []

	isLocked = false

	constructor({
		canvas,
		theme,
		isLocked = false
	}: {
		canvas: HTMLCanvasElement
		theme: string
		isLocked?: boolean
	}) {
		this.canvas = canvas
		this.context = canvas.getContext('2d') as CanvasRenderingContext2D
		this.ctx = this.context
		this.isLocked = isLocked
		this.nodes = new Nodes({
			canvasTranslate: this.canvasTranslate,
			ctx: this.ctx
		})
		this.notes = new CanvasNotes()
		this.groups = new CanvasGroups()
		this.theme = theme
		this.init()
	}

	/**
	 * Inicializa el canvas configurando eventos y cargando datos iniciales.
	 * @param nodes - Nodos iniciales a cargar
	 * @param connections - Conexiones iniciales a establecer
	 */
	init() {
		this.eventResize()
		for (const event of this.eventsCanvas) {
			this.canvas.addEventListener(event as any, (e) => {
				e.preventDefault()
				e.stopPropagation()
				this.events({ event: event as string, e })
			})
		}
		window.addEventListener('resize', () => this.eventResize())
		document.addEventListener('mouseup', this.eventMouseUp)

		this.addImageProcess(this.theme === 'light' ? pattern_light : pattern_dark).then((img) => {
			this.canvasPattern = this.ctx.createPattern(img, 'repeat') as CanvasPattern
			this.background()
			if (this.backgroundUpdateInterval) {
				clearInterval(this.backgroundUpdateInterval)
			}

			this.backgroundUpdateInterval = setInterval(() => {
				this.indexTime++
				setIndexTime(this.indexTime)
				if (this.indexTime > 100) this.indexTime = 0
				this.background()
			}, this.canvasFps)
		})
	}

	changeTheme(theme: string) {
		this.theme = theme
		this.addImageProcess(this.theme === 'light' ? pattern_light : pattern_dark).then((img) => {
			this.canvasPattern = this.ctx.createPattern(img, 'repeat') as CanvasPattern
		})
	}

	/**
	 * Carga nodos y conexiones en el canvas.
	 * @param nodes - Diccionario de nodos indexados por ID
	 * @param connections - Array de conexiones entre nodos
	 */
	private load({
		nodes,
		connections
	}: {
		nodes: { [key: string]: INodeCanvas }
		connections: INodeConnections[]
	}) {
		for (const [key, node] of Object.entries(nodes)) {
			this.nodes.addNode({ ...node, id: key })
		}
		for (const connection of connections) {
			this.nodes.addConnection(connection)
		}
	}

	/**
	 * Emite eventos a los suscriptores registrados.
	 * @param event - Tipo de evento o array de tipos
	 * @param e - Datos del evento
	 */
	private emit = (event: EventsCanvas | EventsCanvas[], e: any) => {
		const events = !Array.isArray(event) ? [event] : event
		for (const event of events) {
			for (const subscriber of this.subscribers.filter((f) => f.event === event)) {
				if (subscriber.callback) subscriber.callback(e)
			}
		}
	}

	/**
	 * Carga una imagen de forma asíncrona.
	 * @param src - URL de la imagen a cargar
	 * @returns Promise que resuelve con la imagen cargada
	 */
	private addImageProcess(src: string): Promise<HTMLImageElement> {
		return new Promise((resolve, reject) => {
			const img = new Image()
			img.onload = () => resolve(img)
			img.onerror = reject
			img.src = src
		})
	}

	/**
	 * Renderiza el fondo del canvas y todos los elementos visuales.
	 */
	private background() {
		if (!this.canvas || !this.ctx || !this.canvasPattern) return
		const x = this.canvasTranslate.x
		const y = this.canvasTranslate.y
		const x_ = -x / this.canvasFactor
		const y_ = -y / this.canvasFactor
		const w_ = this.canvasWidth / this.canvasFactor
		const h_ = this.canvasHeight / this.canvasFactor

		this.ctx.clearRect(x_, y_, w_, h_)
		this.ctx.save()
		this.ctx.translate(x, y)
		this.ctx.scale(this.canvasFactor, this.canvasFactor)
		this.ctx.clearRect(x_, y_, w_, h_)
		this.ctx.fillStyle = this.canvasPattern
		this.ctx.fillRect(x_, y_, w_, h_)
		this.ctx.globalAlpha = 1.0
		this.ctx.imageSmoothingEnabled = this.ctx.imageSmoothingEnabled = true

		// Renderizar notas con la misma transformación que los nodos
		this.notes.render(this.ctx, this.canvasTranslate, this.canvasFactor)

		// Renderizar grupos antes que los nodos para que aparezcan detrás
		this.groups.render(this.ctx)

		this.nodes.render({ ctx: this.ctx })

		if (this.canvasSelect.show) {
			this.nodes.selectedMultiple({
				range: this.canvasSelect,
				relative: this.canvasRelativePos
			})
			renderSelected({
				canvasSelect: this.canvasSelect,
				theme: this.theme,
				ctx: this.ctx
			})
		}

		renderAnimation({ ctx: this.ctx })

		if (this.newConnectionNode) {
			drawNodeConnectionPreview({
				node_connection_new: this.newConnectionNode.node,
				type: this.newConnectionNode.type,
				index: this.newConnectionNode.index,
				canvasRelativePos: this.newConnectionNode.relative || this.canvasRelativePos,
				nodes: this.nodes.getNodes(),
				ctx: this.ctx
			})
		}

		this.ctx.restore()
	}

	/**
	 * Registra un callback para eventos específicos del canvas.
	 * @param event - Tipo de evento o array de tipos
	 * @param callback - Función a ejecutar cuando ocurra el evento
	 */
	subscriber = (event: EventsCanvas | EventsCanvas[], callback: (e: any) => any) => {
		if (Array.isArray(event)) {
			for (const e of event) {
				this.subscriber(e, callback)
			}
			return
		}
		this.subscribers.push({ event, callback })
	}

	/**
	 * Dispatcher principal de eventos del canvas.
	 * @param event - Nombre del evento
	 * @param e - Objeto del evento
	 */
	private events({ event, e }: { event: string; e: any }) {
		switch (event) {
			case 'mousedown':
				this.eventMouseDown(e)
				break
			case 'mouseup':
				this.eventMouseUp(e)
				break
			case 'mousemove':
				this.eventMouseMove(e)
				break
			case 'wheel':
				this.eventWheel(e)
				break
			case 'dblclick':
				this.eventDbClick(e)
				break
			case 'contextmenu':
				this.eventContextMenu(e)
				break
		}
	}

	/**
	 * Maneja el evento de mouse down para iniciar arrastre y selección.
	 * @param e - Evento del mouse
	 */
	private eventMouseDown = (e: MouseEvent) => {
		this.canvasTempPosX = e.clientX - this.canvasTranslate.x
		this.canvasTempPosY = e.clientY - this.canvasTranslate.y

		if (e.button === 0 || e.button === 2) {
			// PRIMERO: Manejar selección de nodos (mayor prioridad)
			this.newConnectionNode = this.nodes.selected({
				relative: this.canvasRelativePos
			})
			this.selectedNode = this.nodes.getSelected()

			// Si hay nodos seleccionados, darles prioridad y salir
			if (this.selectedNode.length > 0 || this.newConnectionNode) {
				this.isDragging = true
				if (this.selectedNode.length === 0) {
					this.emit('node_selected', null)
				}
				if (!this.newConnectionNode) {
					this.emit('node_connection_selected', null)
				}
				// Deseleccionar notas y grupos cuando se selecciona un nodo
				this.notes.clearSelection()
				this.groups.clearSelection()
				return
			}

			// SEGUNDO: Verificar conexiones (si hubiera lógica específica para conexiones)
			// Por ahora las conexiones se manejan dentro de la lógica de nodos

			// TERCERO: Verificar redimensionamiento de notas
			if (e.button === 0 && this.notes.isPositionOnResizeHandle(this.canvasRelativePos.x, this.canvasRelativePos.y)) {
				if (this.notes.startResize(this.canvasRelativePos.x, this.canvasRelativePos.y)) {
					this.isDragging = true
					this.eventsType = 'cursor'
					this.groups.clearSelection()
					e.preventDefault()
					e.stopPropagation()
					return
				}
			}

			// CUARTO: Verificar si se hizo click en una nota para arrastrar
			const noteAtPosition = this.notes.getNoteAtPosition(this.canvasRelativePos.x, this.canvasRelativePos.y)

			if (noteAtPosition && e.button === 0) {
				// Seleccionar nota y permitir arrastrar
				this.notes.clearSelection()
				this.notes.selectNote(noteAtPosition.id)
				if (this.notes.startDrag(noteAtPosition.id, this.canvasRelativePos.x, this.canvasRelativePos.y)) {
					this.emit('note_moved', { id: noteAtPosition.id })
					this.isDragging = true
					this.eventsType = 'cursor'
					this.groups.clearSelection()
					e.preventDefault()
					return
				}
			}

			// QUINTO: Verificar si se hizo click en un grupo para arrastrar (menor prioridad)
			const groupAtPosition = this.groups.getGroupAtPosition(this.canvasRelativePos.x, this.canvasRelativePos.y)
			if (groupAtPosition && e.button === 0) {
				// Seleccionar grupo y permitir arrastrar
				this.groups.clearSelection()
				this.groups.selectGroup(groupAtPosition.id, true)
				if (this.groups.startDrag(groupAtPosition.id, this.canvasRelativePos.x, this.canvasRelativePos.y)) {
					this.isDragging = true
					this.eventsType = 'cursor'
					this.notes.clearSelection()
					e.preventDefault()
					const draggedGroup = this.groups.getDraggedGroup()
					if (draggedGroup) {
						for (const nodeId of draggedGroup.nodeIds) {
							const node = this.nodes.getNode({ id: nodeId })
							if (node) {
								node.setRelativePos(this.canvasRelativePos)
								node.isSelected = true
								node.isMove = true
							}
						}
					}
					return
				}
			}

			// SEXTO: Si no hay nodos, conexiones, notas ni grupos, limpiar selección
			this.isDragging = true
			if (!noteAtPosition) {
				this.notes.clearSelection()
			}
			if (!groupAtPosition) {
				this.groups.clearSelection()
			}
			if (this.selectedNode.length === 0 && !this.newConnectionNode && !noteAtPosition && !groupAtPosition) {
				this.isNodeConnectionVisible = false
				this.emit('clear', null)
			}
		}

		if (e.button === 1) {
			this.eventMouseUp(e)
			this.eventsType = 'move'
		}
	}

	/**
	 * Maneja el evento de mouse up para finalizar arrastre.
	 * @param e - Evento del mouse
	 */
	private eventMouseUp = (e: MouseEvent) => {
		this.isDragging = false

		// Finalizar arrastre de notas
		this.notes.endDrag()

		// Finalizar arrastre de grupos
		this.groups.endDrag()

		// Recalcular grupos si se movieron nodos
		if (this.selectedNode.length > 0) {
			for (const node of this.selectedNode) {
				this.groups.recalculateGroupsContainingNode(node.id, (id) => {
					const nodeObj = this.nodes.getNode({ id })
					if (nodeObj?.design) {
						return {
							x: nodeObj.design.x,
							y: nodeObj.design.y,
							width: nodeObj.design.width,
							height: nodeObj.design.height
						}
					}
					return null
				})
			}
		}

		// Finalizar redimensionamiento de notas
		if (this.notes.endResize()) {
			this.emit('note_updated', { resized: true })
		}

		if (e.button === 1) this.eventsType = 'cursor'
		if (e.button === 0) this.eventMouseEnd()
	}

	/**
	 * Maneja el movimiento del mouse para arrastre y selección múltiple.
	 * @param e - Evento del mouse
	 */
	private eventMouseMove = (e: MouseEvent) => {
		const { offsetX: x, offsetY: y } = e
		this.canvasPosition = { x, y }
		this.canvasRelativePos = {
			x: Number.parseFloat(((x - this.canvasTranslate.x) / this.canvasFactor).toFixed(2)),
			y: Number.parseFloat(((y - this.canvasTranslate.y) / this.canvasFactor).toFixed(2))
		}
		this.emit('mouse_move', this.canvasRelativePos)

		// En modo locked, solo permitir movimiento del espacio de trabajo
		if (this.isLocked) {
			// Permitir solo movimiento del canvas
			if ((this.eventsType === 'move' && e.buttons === 1) || e.buttons === 4) {
				if (e.buttons === 4) this.eventsType = 'move'
				this.canvasTranslate.x = e.clientX - this.canvasTempPosX
				this.canvasTranslate.y = e.clientY - this.canvasTempPosY
			}
			return
		}

		// Actualizar cursor para redimensionamiento
		if (!this.isDragging) {
			// Primero verificar si está sobre un handle de redimensionamiento
			if (this.notes.isPositionOnResizeHandle(this.canvasRelativePos.x, this.canvasRelativePos.y)) {
				this.canvas.style.cursor = 'nwse-resize'
			} else {
				// Verificar si está sobre un grupo (para cursor de movimiento)
				const groupAtPosition = this.groups.getGroupAtPosition(this.canvasRelativePos.x, this.canvasRelativePos.y)
				if (groupAtPosition) {
					this.canvas.style.cursor = 'move'
				} else {
					// Verificar si está sobre una nota (para cursor de movimiento)
					const noteAtPosition = this.notes.getNoteAtPosition(this.canvasRelativePos.x, this.canvasRelativePos.y)
					if (noteAtPosition?.isSelected) {
						this.canvas.style.cursor = 'move'
					} else {
						this.canvas.style.cursor = 'default'
					}
				}
			}
		}

		if (this.eventsType === 'cursor' && e.buttons === 1 && this.isDragging) {
			// Verificar si estamos redimensionando una nota
			if (this.notes.updateResize(this.canvasRelativePos.x, this.canvasRelativePos.y)) {
				return // La nota se está redimensionando, no hacer nada más
			}

			// Verificar si estamos arrastrando una nota
			if (this.notes.updateDrag(this.canvasRelativePos.x, this.canvasRelativePos.y)) {
				return // La nota se está arrastrando, no hacer nada más
			}

			// Verificar si estamos arrastrando un grupo
			if (this.groups.isDragging()) {
				const deltaMovement = this.groups.updateDrag(this.canvasRelativePos.x, this.canvasRelativePos.y)
				if (deltaMovement) {
					// Mover todos los nodos dentro del grupo
					const draggedGroup = this.groups.getDraggedGroup()
					if (draggedGroup) {
						this.nodes.move({ relative: this.canvasRelativePos })
						this.emit('group_moved', { id: draggedGroup.id, deltaMovement })
					}
				}
				return // El grupo se está arrastrando, no hacer nada más
			}

			if (this.selectedNode.length === 0 || this.canvasSelect.show) {
				if (!this.canvasSelect.show) {
					this.canvasSelect.x1 = this.canvasRelativePos.x
					this.canvasSelect.y1 = this.canvasRelativePos.y
				}
				this.canvasSelect.x2 = this.canvasRelativePos.x
				this.canvasSelect.y2 = this.canvasRelativePos.y
				this.canvasSelect.show = true
				return
			}
			if (this.selectedNode.length > 0 && !this.newConnectionNode) {
				this.nodes.move({ relative: this.canvasRelativePos })

				// Recalcular grupos que contienen los nodos movidos
				for (const node of this.selectedNode) {
					this.groups.recalculateGroupsContainingNode(node.id, (id) => {
						const nodeObj = this.nodes.getNode({ id })
						if (nodeObj?.design) {
							return {
								x: nodeObj.design.x,
								y: nodeObj.design.y,
								width: nodeObj.design.width,
								height: nodeObj.design.height
							}
						}
						return null
					})
				}

				this.emit('node_moved', { selected: this.selectedNode })
			}
		}
		if ((this.eventsType === 'move' && e.buttons === 1) || e.buttons === 4) {
			if (e.buttons === 4) this.eventsType = 'move'
			this.canvasTranslate.x = e.clientX - this.canvasTempPosX
			this.canvasTranslate.y = e.clientY - this.canvasTempPosY
		}
	}

	/**
	 * Maneja el doble click para seleccionar nodos.
	 * @param _e - Evento del mouse
	 */
	private eventDbClick = (_e: MouseEvent) => {
		// En modo locked, permitir doble click para ver propiedades
		const selected = this.nodes.getSelected()
		if (selected.length > 0 || this.isLocked) {
			// Si estamos en modo locked, seleccionar el nodo en la posición del click
			if (this.isLocked && selected.length === 0) {
				this.nodes.selected({
					relative: this.canvasRelativePos
				})
			}
			this.emit('node_dbclick', {
				nodes: this.nodes.getSelected(),
				isLocked: this.isLocked
			})
		}
	}

	/**
	 * Maneja el evento de rueda del mouse para zoom.
	 * @param e - Evento de rueda
	 */
	private eventWheel = (e: WheelEvent) => {
		this.eventScrollZoom({ deltaY: e.deltaY })
	}

	/**
	 * Maneja el menú contextual del canvas.
	 * @param _e - Evento del mouse
	 */
	private eventContextMenu = (_e: MouseEvent) => {
		// En modo locked, deshabilitar menús contextuales
		if (this.isLocked) {
			return
		}

		// PRIMERO: Verificar si hay nodos seleccionados (mayor prioridad)
		const selected = this.nodes.getSelected()
		if (selected.length > 0) {
			this.emit('node_context', {
				selected,
				canvasTranslate: this.nodes.canvasTranslate
			})
			return
		}

		// SEGUNDO: Verificar conexiones de nodos
		const connectionAtPosition = this.nodes.getConnectionAtPosition({
			x: this.canvasRelativePos.x,
			y: this.canvasRelativePos.y
		})

		if (connectionAtPosition) {
			this.emit('node_connection_context', {
				id: connectionAtPosition.connection.id,
				nodeOrigin: connectionAtPosition.nodeOrigin.get(),
				nodeDestiny: connectionAtPosition.nodeDestiny.get(),
				input: connectionAtPosition.connection.connectorDestinyName,
				output: connectionAtPosition.connection.connectorOriginName
			})
			return
		}

		// TERCERO: Verificar si hay una nota en la posición del click
		const noteAtPosition = this.notes.getNoteAtPosition(this.canvasRelativePos.x, this.canvasRelativePos.y)

		if (noteAtPosition) {
			this.emit('note_context', {
				note: noteAtPosition,
				position: { x: this.canvasPosition.x, y: this.canvasPosition.y }
			})
			return
		}

		// CUARTO: Verificar si hay un grupo en la posición del click (menor prioridad)
		const groupAtPosition = this.groups.getGroupAtPosition(this.canvasRelativePos.x, this.canvasRelativePos.y)
		if (groupAtPosition) {
			this.emit('group_context', {
				group: groupAtPosition,
				position: { x: this.canvasPosition.x, y: this.canvasPosition.y }
			})
			return
		}

		// QUINTO: Menú contextual del canvas vacío
		this.emit('canvas_context', {
			position: { x: this.canvasPosition.x, y: this.canvasPosition.y },
			canvasPosition: { x: this.canvasRelativePos.x, y: this.canvasRelativePos.y }
		})
	}

	/**
	 * Finaliza operaciones de arrastre y crea conexiones automáticas.
	 */
	private eventMouseEnd() {
		this.canvasSelect.show = false

		if (this.newConnectionNode && !getTempConnection()) {
			const targetInput = this.nodes.getInputAtPosition({
				x: this.canvasRelativePos.x,
				y: this.canvasRelativePos.y
			})
			this.newConnectionNode.relative = this.canvasRelativePos

			if (this.newConnectionNode.node.id && targetInput && targetInput.node.id !== this.newConnectionNode.node.id) {
				const originNode = this.nodes.getNode({
					id: this.newConnectionNode.node.id
				})
				const connectorOriginName =
					typeof this.newConnectionNode.value === 'string' ? this.newConnectionNode.value : this.newConnectionNode.value.name || ''
				originNode.addConnection({
					connectorOriginName,
					idNodeDestiny: targetInput.node.id,
					connectorDestinyName: targetInput.connectorOriginName,
					idNodeOrigin: ''
				})

				this.newConnectionNode = null
				this.isNodeConnectionVisible = false
			} else {
				this.emit('node_added', {
					design: this.canvasPosition,
					relativePos: { ...this.canvasRelativePos },
					connection: {
						name: this.newConnectionNode.value,
						type: this.newConnectionNode.type
					},
					node: this.newConnectionNode.node
				})
				this.newConnectionNode = null
			}
		}
	}

	/**
	 * Ajusta el tamaño del canvas al contenedor padre.
	 */
	private eventResize() {
		const parent = this.canvas.parentElement
		if (parent) {
			this.canvasWidth = parent.clientWidth
			this.canvasHeight = parent.clientHeight
			this.canvas.width = this.canvasWidth
			this.canvas.height = this.canvasHeight
		}
	}

	/**
	 * Aplica zoom al canvas con límites establecidos.
	 * @param zoom - Nuevo factor de zoom
	 * @param value - Incremento del zoom
	 */
	private eventZoom({ zoom, value }: { zoom?: number; value?: number }) {
		this.canvasFactor = zoom || this.canvasFactor + (value || 0)
		if (this.canvasFactor < 0.5) this.canvasFactor = 0.5
		if (this.canvasFactor > 2) this.canvasFactor = 2
		this.emit('zoom', { zoom: this.canvasFactor.toFixed(1) })
	}

	/**
	 * Maneja el zoom con rueda del mouse manteniendo el punto focal.
	 * @param deltaY - Dirección del scroll
	 */
	private eventScrollZoom({ deltaY }: { deltaY: number }) {
		const tempFactor = this.canvasFactor
		this.eventZoom({ value: deltaY > 0 ? -0.1 : 0.1 })
		this.canvasTranslate.x -= this.canvasRelativePos.x * (this.canvasFactor - tempFactor)
		this.canvasTranslate.y -= this.canvasRelativePos.y * (this.canvasFactor - tempFactor)
	}

	/**
	 * Aumenta el zoom del canvas.
	 */
	actionZoomIn() {
		this.eventZoom({ value: 0.1 })
	}

	/**
	 * Disminuye el zoom del canvas.
	 */
	actionZoomOut() {
		this.eventZoom({ value: -0.1 })
	}

	/**
	 * Restaura el zoom al 100%.
	 */
	actionZoomCenter() {
		this.eventZoom({ zoom: 1 })
	}

	/**
	 * Añade un nuevo nodo al canvas y opcionalmente lo conecta a otro nodo.
	 * @param origin - Información del nodo origen para conexión automática
	 * @param node - Datos del nodo a crear
	 * @param isManual - Indica si es una acción manual del usuario
	 * @returns ID del nodo creado
	 */
	actionAddNode({
		origin,
		node
	}: {
		origin?: {
			idNode: string
			connectorOriginName: string
		}
		node: INodeCanvas
	}) {
		// En modo locked, no permitir agregar nodos
		if (this.isLocked) {
			return null
		}

		const id = uuidv4()
		this.newConnectionNode = null
		const data: INodeCanvas = {
			...JSON.parse(JSON.stringify(node)),
			id: node.id || id,
			design: {
				x: Math.round((node.design.x || 0) / this.canvasGrid) * this.canvasGrid,
				y: Math.round((node.design.y || 0) / this.canvasGrid) * this.canvasGrid
			}
		}
		data.info.name = node.info.name
		// utilsValidateName({
		// 	text: node.info.name,
		// 	nodes: Object.values(this.nodes.getNodes())
		// })
		const nodeDestiny = this.nodes.addNode(data)

		if (origin) {
			const inputs = nodeDestiny.info.connectors.inputs[0]
			const connectorDestinyName = typeof inputs === 'string' ? inputs : inputs.name || ''
			this.nodes.getNode({ id: origin.idNode }).addConnection({
				connectorOriginName: origin.connectorOriginName,
				idNodeDestiny: nodeDestiny.id,
				connectorDestinyName,
				idNodeOrigin: ''
			})
		}
		return id
	}

	/**
	 * Elimina una conexión específica por su ID.
	 * @param id - ID de la conexión a eliminar
	 */
	actionDeleteConnectionById({ id }: { id: string }) {
		for (const node of Object.values(this.nodes.nodes)) {
			node.deleteConnections({ id })
		}
	}

	/**
	 * Elimina nodos específicos por sus IDs.
	 * @param ids - Array de IDs de nodos a eliminar
	 */
	actionDeleteNodes({ ids }: { ids: string[] }) {
		for (const id of ids) {
			// Obtener el nodo antes de eliminarlo
			const nodeToDelete = this.nodes.getNode({ id })
			if (nodeToDelete) {
				// Eliminar todas las conexiones del nodo
				nodeToDelete.deleteAllConnections()
			}
			// Luego eliminar el nodo
			this.nodes.removeNode(id)
		}
		// Limpiar selección si algún nodo seleccionado fue eliminado
		this.selectedNode = this.selectedNode.filter((node) => !ids.includes(node.id))
		this.emit('node_removed', { ids })
	}

	/**
	 * Actualiza el nombre de un nodo específico.
	 * @param id - ID del nodo a actualizar
	 * @param newName - Nuevo nombre para el nodo
	 */
	actionUpdateNodeName({ id, newName }: { id: string; newName: string }) {
		const node = this.nodes.getNode({ id })
		if (node) {
			node.get().info.name = newName
		}
	}

	/**
	 * Actualiza las propiedades de un nodo específico.
	 * @param id - ID del nodo a actualizar
	 * @param properties - Nuevas propiedades del nodo
	 */
	actionUpdateNodeProperties({ id, properties }: { id: string; properties: any }) {
		const node = this.nodes.getNode({ id })
		if (node) {
			node.properties = properties
			this.emit('node_update_properties', node)
		}
	}

	/**
	 * Procesa datos de trazado de ejecución de nodos.
	 * @param data - Datos de entrada y salida de cada nodo
	 */
	actionTrace(data: {
		[id: string]: {
			input: { data: { [key: string]: number }; length: number }
			output: { data: { [key: string]: number }; length: number }
			callback: { data: { [key: string]: number }; length: number }
		}
	}) {
		// this.nodes.trace(data);
	}

	/**
	 * Get the current workflow data.
	 * @returns A workflow data object with nodes, connections, notes, and groups.
	 */
	getWorkflowData(): { nodes: { [key: string]: INodeCanvas }; connections: INodeConnections[]; notes: any[]; groups: any[] } {
		const nodes = this.nodes.getNodes()
		const connections: INodeConnections[] = []
		const notes = this.notes.exportNotes()
		const groups = this.groups.exportGroups()
		const plainNodes: { [key: string]: INodeCanvas } = {}
		for (const node of Object.values(nodes)) {
			plainNodes[node.id] = JSON.parse(JSON.stringify(node.get()))
			// Extraer solo los value de las propiedades
			for (const [key, value] of Object.entries(plainNodes[node.id].properties)) {
				;(plainNodes[node.id].properties[key] as any) = { value: value.value }
			}
			if (node.connections) {
				for (const conn of node.connections) {
					if (conn.idNodeOrigin === node.id) {
						connections.push({
							...conn,
							connectorOriginName:
								typeof conn.connectorOriginName === 'string' ? conn.connectorOriginName : (conn.connectorOriginName as any)?.name || '',
							colorGradient: null,
							pointers: undefined
						})
					}
				}
			}
			plainNodes[node.id].connections = []
		}
		return { nodes: plainNodes, connections, notes, groups }
	}

	/**
	 * Carga datos de workflow en el canvas, limpiando el contenido actual.
	 * @param data - Nodos, conexiones, notas y grupos a cargar.
	 */
	loadWorkflowData(data: {
		nodes: { [key: string]: INodeCanvas }
		connections: INodeConnections[]
		notes?: any[]
		groups?: any[]
	}) {
		// Limpiar nodos existentes
		this.nodes.clear()
		this.selectedNode = []
		this.newConnectionNode = null

		// Limpiar notas existentes
		this.notes.clear()

		// Limpiar grupos existentes
		this.groups.clear()

		// Cargar nuevos datos
		this.load(JSON.parse(JSON.stringify(data)))

		// Cargar notas si existen
		if (data.notes) {
			this.notes.importNotes(data.notes)
		}

		// Cargar grupos si existen
		if (data.groups) {
			this.groups.importGroups(data.groups)
		}
	}

	/**
	 * Limpia recursos y remueve event listeners.
	 */
	destroy() {
		for (const event of this.eventsCanvas) {
			this.canvas.removeEventListener(event as any, (e) => {
				e.preventDefault()
				this.events({ event: event as string, e })
			})
		}
		window.removeEventListener('resize', () => this.eventResize())
		document.removeEventListener('mouseup', this.eventMouseUp)
		this.eventMouseEnd()
		if (this.backgroundUpdateInterval) {
			clearInterval(this.backgroundUpdateInterval)
		}
	}

	// =============================================================================
	// MÉTODOS PARA NOTAS
	// =============================================================================

	/**
	 * Agrega una nueva nota al canvas
	 */
	actionAddNote(options: {
		content: string
		color: string
		position: { x: number; y: number }
		size?: { width: number; height: number }
	}): string {
		const noteId = this.notes.addNote(options)
		this.emit('note_added', { id: noteId })
		return noteId
	}

	/**
	 * Actualiza una nota existente
	 */
	actionUpdateNote(
		id: string,
		updates: {
			content?: string
			color?: string
			size?: { width: number; height: number }
		}
	): boolean {
		const success = this.notes.updateNote(id, updates)
		if (success) {
			this.emit('note_updated', { id })
		}
		return success
	}

	/**
	 * Elimina una nota
	 */
	actionDeleteNote(id: string): boolean {
		const success = this.notes.deleteNote(id)
		if (success) {
			this.emit('note_removed', { id })
		}
		return success
	}

	/**
	 * Obtiene todas las notas
	 */
	getNotes(): any[] {
		return this.notes.exportNotes()
	}

	/**
	 * Carga notas desde el workflow
	 */
	loadNotes(notes: any[]): void {
		this.notes.importNotes(notes)
	}

	/**
	 * Limpia todas las notas
	 */
	clearNotes(): void {
		this.notes.clear()
	}

	// ============================================================================
	// MÉTODOS DE GRUPOS
	// ============================================================================

	/**
	 * Crea un nuevo grupo de nodos
	 */
	actionCreateGroup(options: {
		label: string
		color: string
		nodeIds: string[]
	}): string {
		// Calcular bounds basado en los nodos seleccionados
		const nodePositions = options.nodeIds
			.map((id) => this.nodes.getNode({ id }))
			.filter(Boolean)
			.map((node) => ({
				x: node.design.x,
				y: node.design.y,
				width: node.design.width || 200,
				height: node.design.height || 100
			}))

		const bounds = this.groups.calculateGroupBounds(nodePositions)

		const groupId = this.groups.addGroup({
			label: options.label,
			color: options.color,
			nodeIds: options.nodeIds,
			position: bounds.position,
			size: bounds.size
		})

		this.emit('group_added', { id: groupId })
		return groupId
	}

	/**
	 * Actualiza un grupo existente
	 */
	actionUpdateGroup(id: string, updates: { label?: string; color?: string }): boolean {
		const success = this.groups.updateGroup(id, updates)
		if (success) {
			this.emit('group_updated', { id, updates })
		}
		return success
	}

	/**
	 * Elimina un grupo
	 */
	actionDeleteGroup(id: string): boolean {
		const success = this.groups.deleteGroup(id)
		if (success) {
			this.emit('group_removed', { id })
		}
		return success
	}

	/**
	 * Desagrupa un grupo (elimina el grupo pero mantiene los nodos)
	 */
	actionUngroup(id: string): boolean {
		return this.actionDeleteGroup(id)
	}

	/**
	 * Obtiene todos los grupos
	 */
	getGroups(): any[] {
		return this.groups.exportGroups()
	}

	/**
	 * Carga grupos desde el workflow
	 */
	loadGroups(groups: any[]): void {
		this.groups.importGroups(groups)
	}

	/**
	 * Limpia todos los grupos
	 */
	clearGroups(): void {
		this.groups.clear()
	}

	/**
	 * Cambia el estado de bloqueo del canvas
	 * @param locked - Nuevo estado de bloqueo
	 */
	setLocked(locked: boolean): void {
		this.isLocked = locked

		// Limpiar selecciones activas si se bloquea
		if (locked) {
			this.selectedNode = []
			this.newConnectionNode = null
			this.canvasSelect.show = false
			this.notes.clearSelection()
			this.groups.clearSelection()
		}
	}

	/**
	 * Obtiene el estado actual de bloqueo del canvas
	 * @returns Estado de bloqueo
	 */
	isCanvasLocked(): boolean {
		return this.isLocked
	}
}
