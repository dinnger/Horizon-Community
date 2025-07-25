import type { INodeCanvas, INodeConnections } from './interfaz/node.interface.js'
import { v4 as uuidv4 } from 'uuid'
import { NewNode } from './canvasNode'
import { ref } from 'vue'
import { getPositionConnection } from './canvasHelpers.js'

/**
 * Gestiona la colección de nodos en el canvas y sus operaciones.
 * Proporciona métodos para crear, modificar, conectar y renderizar nodos.
 */
export class Nodes {
	public canvasGrid = 20
	name: string
	canvasTranslate: { x: number; y: number }
	nodes: { [key: string]: NewNode } = {}
	ctx: CanvasRenderingContext2D | null = null

	constructor({
		name,
		canvasTranslate,
		ctx
	}: {
		name: string
		canvasTranslate: { x: number; y: number }
		ctx: CanvasRenderingContext2D
	}) {
		this.name = name
		this.canvasTranslate = canvasTranslate
		this.ctx = ctx
	}

	/**
	 * Obtiene un nodo por su ID.
	 * @param data - Objeto con el ID del nodo
	 * @returns El nodo solicitado
	 * @throws Error si el nodo no existe
	 */
	getNode(data: { id: string }) {
		const node = this.nodes[data.id]
		console.log('nodes', this.name, this.nodes, data.id)
		if (!node) throw new Error(`[getNode] ${this.name} No se encontró el nodo ${data.id}`)
		return this.nodes[data.id]
	}

	/**
	 * Añade un nuevo nodo al canvas.
	 * @param node - Datos del nodo a añadir
	 * @param isManual - Indica si el nodo se añade manualmente
	 * @returns El nodo creado
	 */
	addNode(node: INodeCanvas, isManual?: boolean) {
		node.id = node.id || uuidv4()
		this.nodes[node.id] = new NewNode(node, this)
		const newNode = this.nodes[node.id]
		console.log('newNode', node.id)
		return this.nodes[node.id]
	}

	/**
	 * Duplica un nodo existente en una nueva posición.
	 * @param id - ID del nodo a duplicar
	 * @returns El nodo duplicado o undefined si no existe
	 */
	duplicateNode({ id }: { id: string }) {
		const node = this.nodes[id]
		if (!node) return
		return this.addNode(
			{
				id: undefined,
				type: node.type,
				info: { ...node.info },
				properties: ref(JSON.parse(JSON.stringify(node.properties))).value,
				design: ref({
					x: node.design.x + this.canvasGrid * 2,
					y: node.design.y + this.canvasGrid * 5
				}).value
			},
			true
		)
	}

	/**
	 * Duplica múltiples nodos seleccionados manteniendo sus conexiones internas.
	 * Crea copias de los nodos y recrea las conexiones entre ellos.
	 */
	duplicateMultiple() {
		const selectedNodes = this.getSelected()
		const originalToNewIdMap = new Map<string, string>()
		const duplicatedNodes: NewNode[] = []

		for (const node of selectedNodes) {
			const newNode = node.duplicate()
			if (newNode && node.id) {
				originalToNewIdMap.set(node.id, newNode.id)
				duplicatedNodes.push(newNode)
			}
		}

		for (const originalNode of selectedNodes) {
			if (!originalNode.id) continue
			for (const connection of originalNode.connections) {
				if (connection.idNodeOrigin === originalNode.id && connection.idNodeDestiny && originalToNewIdMap.has(connection.idNodeDestiny)) {
					const newOriginId = originalToNewIdMap.get(originalNode.id)
					const newDestinyId = originalToNewIdMap.get(connection.idNodeDestiny)

					if (newOriginId && newDestinyId) {
						this.addConnection({
							id: uuidv4(),
							connectorOriginName: connection.connectorOriginName,
							idNodeOrigin: newOriginId,
							idNodeDestiny: newDestinyId,
							connectorDestinyName: connection.connectorDestinyName,
							isManual: true
						})
					}
				}
			}
		}

		for (const node of duplicatedNodes) {
			node.isSelected = true
			node.isMove = true
		}
	}

	/**
	 * Añade una conexión entre dos nodos.
	 * @param connection - Datos de la conexión a crear
	 */
	addConnection(connection: INodeConnections & { isManual?: boolean }) {
		const id = connection.idNodeOrigin || ''
		if (!this.nodes[id]) return console.error('No se encontró el nodo', id)
		if (!this.nodes[connection.idNodeDestiny]) return console.error('No se encontró el nodo destino', connection.idNodeDestiny)
		this.nodes[id].addConnection(connection)
	}

	/**
	 * Elimina un nodo del canvas.
	 * @param id - ID del nodo a eliminar
	 */
	removeNode(id: string) {
		delete this.nodes[id]
	}

	/**
	 * Maneja la selección de nodos en una posición específica.
	 * @param relative - Posición relativa del click
	 * @returns Nueva conexión si se selecciona un conector
	 */
	selected({ relative }: { relative: { x: number; y: number } }) {
		const x = relative.x
		const y = relative.y
		const selected = this.getSelected()
		let newConnection = null
		let verifyMulti = false
		for (const node of selected) {
			if (selected.length > 0 && node.verifySelected({ pos: { x, y } }) && selected.includes(node)) {
				verifyMulti = true
			}
		}
		if (verifyMulti) {
			for (const node of selected) {
				node.setRelativePos(relative)
			}
			return
		}

		for (const node of selected) {
			node.isSelected = false
		}

		for (const node of Object.values(this.nodes).reverse()) {
			const select = node.setSelected({ pos: { x, y }, relative })
			if (select && select.type === 'connector') {
				newConnection = select.value
			}
			if (select) break
		}
		return newConnection
	}

	/**
	 * Selecciona múltiples nodos dentro de un área rectangular.
	 * @param range - Área de selección definida por dos puntos
	 * @param relative - Posición relativa del cursor
	 */
	selectedMultiple({
		range,
		relative
	}: {
		range: { x1: number; y1: number; x2: number; y2: number }
		relative: { x: number; y: number }
	}) {
		const xMin = Math.min(range.x1, range.x2)
		const xMax = Math.max(range.x1, range.x2)
		const yMin = Math.min(range.y1, range.y2)
		const yMax = Math.max(range.y1, range.y2)
		for (const node of Object.values(this.nodes)) {
			node.setSelected({
				pos: { x: xMin, y: yMin, x2: xMax, y2: yMax },
				relative
			})
		}
	}

	/**
	 * Obtiene todos los nodos actualmente seleccionados.
	 * @returns Array de nodos seleccionados
	 */
	getSelected() {
		return Object.values(this.nodes).filter((f) => f.getSelected())
	}

	/**
	 * Obtiene todos los nodos del canvas.
	 * @returns Objeto con todos los nodos indexados por ID
	 */
	getNodes() {
		return this.nodes
	}

	/**
	 * Mueve todos los nodos seleccionados a una nueva posición relativa.
	 * @param relative - Desplazamiento relativo
	 */
	move({ relative }: { relative: { x: number; y: number } }) {
		for (const node of this.getSelected()) {
			this.nodes[node.id || -1].move({ relative })
		}
	}

	/**
	 * Busca un conector de entrada en una posición específica.
	 * @param x - Coordenada X
	 * @param y - Coordenada Y
	 * @returns Información del input encontrado o null si no existe
	 */
	getInputAtPosition({ x, y }: { x: number; y: number }): {
		node: NewNode
		type: 'input'
		index: number
		connectorOriginName: string
	} | null {
		for (const node of Object.values(this.nodes)) {
			const connector = node.getSelectedConnectors({ x, y })
			if (connector && connector.type === 'input') {
				return {
					node,
					type: 'input',
					index: connector.index,
					connectorOriginName: connector.value
				}
			}
		}
		return null
	}

	/**
	 * Encuentra una conexión en la posición específica del cursor.
	 * @param x - Coordenada X
	 * @param y - Coordenada Y
	 * @returns Información de la conexión encontrada o null si no existe
	 */
	getConnectionAtPosition({ x, y }: { x: number; y: number }): {
		connection: INodeConnections
		nodeOrigin: NewNode
		nodeDestiny: NewNode
	} | null {
		const tolerance = 10

		for (const node of Object.values(this.nodes)) {
			for (const connection of node.connections) {
				if (connection.idNodeOrigin !== node.id) continue

				const nodeDestiny = this.nodes[connection.idNodeDestiny]
				if (!nodeDestiny) continue

				if (connection.pointers && connection.pointers.length > 1) {
					if (this.isPointNearPath(x, y, connection.pointers, tolerance)) {
						return {
							connection,
							nodeOrigin: node,
							nodeDestiny
						}
					}
				} else {
					const originPoint = getPositionConnection(node, connection.connectorOriginName)
					const destinyPoint = getPositionConnection(nodeDestiny, connection.connectorDestinyName)

					if (originPoint && destinyPoint) {
						if (this.isPointNearLine(x, y, originPoint.point, destinyPoint.point, tolerance)) {
							return {
								connection,
								nodeOrigin: node,
								nodeDestiny
							}
						}
					}
				}
			}
		}
		return null
	}

	/**
	 * Verifica si un punto está cerca de un path definido por múltiples puntos.
	 * @param x - Coordenada X del punto
	 * @param y - Coordenada Y del punto
	 * @param points - Array de puntos que definen el path
	 * @param tolerance - Tolerancia en píxeles
	 * @returns true si el punto está cerca del path
	 */
	private isPointNearPath(x: number, y: number, points: { x: number; y: number }[], tolerance: number): boolean {
		for (let i = 0; i < points.length - 1; i++) {
			const p1 = points[i]
			const p2 = points[i + 1]
			if (this.isPointNearLine(x, y, p1, p2, tolerance)) {
				return true
			}
		}
		return false
	}

	/**
	 * Verifica si un punto está cerca de una línea entre dos puntos.
	 * @param x - Coordenada X del punto
	 * @param y - Coordenada Y del punto
	 * @param p1 - Primer punto de la línea
	 * @param p2 - Segundo punto de la línea
	 * @param tolerance - Tolerancia en píxeles
	 * @returns true si el punto está cerca de la línea
	 */
	private isPointNearLine(x: number, y: number, p1: { x: number; y: number }, p2: { x: number; y: number }, tolerance: number): boolean {
		const A = x - p1.x
		const B = y - p1.y
		const C = p2.x - p1.x
		const D = p2.y - p1.y

		const dot = A * C + B * D
		const lenSq = C * C + D * D

		if (lenSq === 0) {
			return Math.sqrt(A * A + B * B) <= tolerance
		}

		const param = dot / lenSq

		let xx: number
		let yy: number

		if (param < 0) {
			xx = p1.x
			yy = p1.y
		} else if (param > 1) {
			xx = p2.x
			yy = p2.y
		} else {
			xx = p1.x + param * C
			yy = p1.y + param * D
		}

		const dx = x - xx
		const dy = y - yy
		return Math.sqrt(dx * dx + dy * dy) <= tolerance
	}

	/**
	 * Limpia todos los nodos del canvas.
	 */
	clear() {
		for (const node of Object.values(this.nodes)) {
			node.clear()
		}
		this.nodes = {}
	}

	/**
	 * Renderiza todos los nodos y sus conexiones en el canvas.
	 * @param ctx - Contexto de renderizado del canvas
	 */
	render({ ctx }: { ctx: CanvasRenderingContext2D }) {
		for (const node of Object.values(this.nodes)) {
			node.renderConnections({ ctx, nodes: this.nodes })
			node.render({ ctx })
		}
	}
}

export type ICanvasNodeNew = NewNode
