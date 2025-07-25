import type { INodeCanvas, INodeConnections } from './interfaz/node.interface.js'
import type { Point } from './canvasConnector'
import type { NewNode } from './canvasNode'
import { OrthogonalConnector } from './canvasConnector'
import { v4 as uuidv4 } from 'uuid'
import type { Canvas } from './canvas.js'
interface Canvas_Interface {
	x1: number
	y1: number
	x2: number
	y2: number
	show: boolean
}

interface Render_Select_Interface {
	canvasSelect: Canvas_Interface
	theme: string
	ctx: CanvasRenderingContext2D
}

interface Interface_Node_Add_Connection {
	id_node_origin: string
	id_node_destiny: string
	input: string
	output: string
}

interface Interface_Bezier {
	AX: number
	AY: number
	CX: number
	CY: number
	DX: number
	DY: number
	FX: number
	FY: number
	POS_T: { x: number; y: number } | null
}

// Animation List
let animationList: {
	id: string
	outputName: string
	colorGradient: any
	pointers: Point[]
	time: number
}[] = []

let indexTime = 0

export const setIndexTime = (value: number) => {
	indexTime = value
}

// Notificaciones
let newConnection: Interface_Node_Add_Connection | null = null
let notificationsList: { [key: string]: any } = {}
const notificationTTL = (id: string, value: any) => {
	const now = new Date().getTime()
	const last = notificationsList[id]?.last || 0
	if (!notificationsList[id]) notificationsList[id] = {}
	if (now - last > 1000) {
		notificationsList[id].last = now
		notificationsList[id].value = value
		return true
	}
	return false
}

/**
 * Sets the temporary connection to the provided value.
 *
 * @param value - The new connection value to be set. It can be an object of type `Interface_Node_Add_Connection` or `null`.
 */
export function setTempConnection(value: Interface_Node_Add_Connection | null) {
	newConnection = value
}

export function getTempConnection(): Interface_Node_Add_Connection | null {
	return newConnection
}

/**
 * Renders a node on the canvas with the specified theme and selection state.
 *
 * @param {Object} params - The parameters for rendering the node.
 * @param {CanvasRenderingContext2D} params.ctx - The canvas rendering context.
 * @param {INode} params.node - The node to be rendered.
 * @param {string} params.theme - The theme of the canvas, either 'dark' or 'light'.
 * @param {boolean} params.selected - Indicates whether the node is selected.
 */
export function render_node({
	el,
	ctx,
	node,
	selected,
	infoTrace
}: {
	el: Canvas
	ctx: CanvasRenderingContext2D
	node: INodeCanvas
	selected: boolean
	infoTrace: Map<string, number>
}) {
	const background = el.theme === 'dark' ? '#333' : '#ECF0F1'
	const invert_background = el.theme === 'dark' ? '#ECF0F1' : '#ECF0F1'
	// console.log(node)
	// selected = true
	ctx.beginPath()
	ctx.fillStyle = selected ? node.info.color : background
	if (selected) {
		ctx.shadowColor = node.info.color
		ctx.shadowBlur = 20
		ctx.shadowOffsetX = 0
		ctx.shadowOffsetY = 0
	}
	ctx.lineWidth = 0
	ctx.roundRect(node.design.x, node.design.y, node.design.width || 0, node.design.height || 0, 16)
	ctx.fill()
	ctx.shadowColor = 'transparent' // Reset shadow
	ctx.closePath()

	ctx.beginPath()
	ctx.strokeStyle = selected ? invert_background : node.info.color
	ctx.lineWidth = 3
	ctx.roundRect(node.design.x + 4, node.design.y + 4, (node.design.width || 0) - 8, (node.design.height || 0) - 8, 12)
	ctx.stroke()
	ctx.lineWidth = 0
	ctx.closePath()

	// icon
	ctx.fillStyle = selected ? invert_background : node.info.color
	ctx.font = '40px material-icons, sans-serif'
	ctx.fillText(node.info.icon, node.design.x + (node.design.width || 0) / 2 - 20, node.design.y + 50)
	// name
	ctx.font = '10px "Comfortaa Variable"'
	ctx.textAlign = 'center'
	ctx.fillText(node.info.name, node.design.x + (node.design.width || 0) / 2, node.design.y + 65, 700)

	ctx.textAlign = 'left'
	ctx.closePath()

	renderConnectors({ selected, node, ctx, infoTrace, theme: el.theme })

	// render_inputs({ selected, node, ctx, theme })
	// render_outputs({ selected, node, ctx, theme })
}

function renderConnectors({
	node,
	ctx,
	infoTrace,
	theme
}: {
	selected: boolean
	node: INodeCanvas
	ctx: CanvasRenderingContext2D
	infoTrace: Map<string, number>
	theme: string
}) {
	if (!node.info.connectors) return
	// console.log(Object.keys(node.connectors))
	for (const [type, connector] of Object.entries(node.info.connectors)) {
		let x = node.design.x
		let y = node.design.y
		let separator = 0
		let textAlign: CanvasTextAlign = 'left'

		for (const [key, input] of Object.entries(connector)) {
			if (type === 'inputs') {
				x = node.design.x - 5
				y = node.design.y + (25 + Number.parseInt(key) * 20)
				textAlign = 'right'
				separator = 4
			}
			if (type === 'outputs') {
				x = node.design.x + (node.design.width || 0) - 5
				y = node.design.y + (25 + Number.parseInt(key) * 20)
				textAlign = 'left'
				separator = 4
			}
			if (type === 'callbacks') {
				const total = Object.keys(connector).length
				const spacing = 20 // separación entre conectores
				const totalWidth = (total - 1) * spacing
				x = node.design.x + ((node.design.width || 0) - 5) / 2 - totalWidth / 2 + Number.parseInt(key) * spacing
				y = node.design.y + (node.design.height || 0) - 5
				separator = 4
				textAlign = 'center'
			}
			ctx.beginPath()

			ctx.roundRect(x, y, 8, 10, 2)
			if (connector.length > 0) {
				const name = (input as any).name || input
				ctx.textAlign = textAlign
				ctx.fillStyle = theme === 'dark' ? '#fff' : '#333'
				ctx.font = '9px "Comfortaa Variable"'
				ctx.fillText(String(name), x + separator, y)
			}
			ctx.fillStyle = node.info.color
			ctx.fill()
			ctx.closePath()
			ctx.textAlign = 'left'
		}
	}
	let separacion = (infoTrace.size - 1) * 10
	for (const [key, value] of infoTrace) {
		ctx.beginPath()
		ctx.fillStyle = node.info.color
		ctx.font = '10px "Consolas"'
		// Estandariza la clave para que tenga exactamente 10 palabras (rellena con vacío si faltan)
		const standardizedKey = key.substring(0, 6).padEnd(6, ' ')
		ctx.fillText(`${standardizedKey}: ${value}`, node.design.x + 10, node.design.y - separacion)
		ctx.closePath()
		separacion -= 10
	}
}

/**
 * Calcula la longitud total del camino formado por un arreglo de puntos.
 * @param {Array} points - Arreglo de objetos con propiedades {x, y}.
 * @returns {number} Longitud total del camino.
 */
function getTotalLength(points: Point[]) {
	let total = 0
	for (let i = 0; i < points.length - 1; i++) {
		const dx = points[i + 1].x - points[i].x
		const dy = points[i + 1].y - points[i].y
		total += Math.sqrt(dx * dx + dy * dy)
	}
	return total
}

/**
 * Dado un arreglo de puntos que forman un camino y un porcentaje (0 a 1),
 * retorna la posición {x, y} a lo largo del camino.
 * @param {Array} points - Arreglo de puntos del camino.
 * @param {number} percent - Porcentaje (de 0 a 1) del recorrido.
 * @returns {Object} Posición {x, y} en el camino.
 */
function getPointAtPercentage(points: Point[], percent: number) {
	// Calculamos la distancia total del camino
	const totalLength = getTotalLength(points)
	// La distancia a recorrer es el porcentaje del total
	const distanceToCover = totalLength * percent
	let accumulated = 0

	for (let i = 0; i < points.length - 1; i++) {
		const p0 = points[i]
		const p1 = points[i + 1]
		const dx = p1.x - p0.x
		const dy = p1.y - p0.y
		const segmentLength = Math.sqrt(dx * dx + dy * dy)

		// Si al sumar la longitud del segmento se sobrepasa la distancia requerida...
		if (accumulated + segmentLength >= distanceToCover) {
			const remaining = distanceToCover - accumulated
			const t = remaining / segmentLength // fracción a recorrer en este segmento
			const x = p0.x + dx * t
			const y = p0.y + dy * t
			return { x, y }
		}
		accumulated += segmentLength
	}

	// En caso de que percent sea 1 (100%), retornamos el último punto
	return points[points.length - 1]
}

/**
 * Dibuja un círculo en una posición determinada.
 * @param {CanvasRenderingContext2D} ctx - Contexto del canvas.
 * @param {Object} position - Objeto con {x, y}.
 * @param {number} radius - Radio del círculo.
 * @param {string} color - Color del círculo.
 */
function drawCircle(ctx: CanvasRenderingContext2D, position: Point, radius: number, color: CanvasGradient) {
	ctx.beginPath()
	ctx.arc(position.x, position.y, radius, 0, Math.PI * 2)
	ctx.fillStyle = color
	ctx.fill()
}

/**
 * Renders an animation on the provided canvas context.
 *
 * This function clears the canvas and draws a black circle in the center
 * with a white background.
 *
 * @param {CanvasRenderingContext2D} ctx - The canvas rendering context to draw on.
 */
export function addAnimation({
	node,
	connections
}: {
	node: NewNode
	connections: { type: 'input' | 'output' | 'callback'; connectionName: string }
}) {
	// console.log(connectionNodes)
	if (!node || !node.connections) return
	if (!connections) return
	for (const connection of node.connections.filter(
		(f) => f.idNodeOrigin === node.id && f.connectorOriginName === connections.connectionName
	)) {
		if (!connection.pointers) return
		animationList.push({
			id: uuidv4(),
			outputName: connection.connectorOriginName,
			pointers: connection.pointers,
			colorGradient: connection.colorGradient,
			time: 60
		})
	}
}

export function renderAnimation({ ctx }: { ctx: CanvasRenderingContext2D }) {
	if (!ctx) return
	for (const connection of animationList) {
		if (!connection.pointers) return
		const percentage = 1 - (connection.time * 1) / 60
		const position = getPointAtPercentage(connection.pointers, percentage)
		if (connection.colorGradient) {
			drawCircle(ctx, position, 5, connection.colorGradient)
		}
		connection.time--
		if (connection.time <= 0) {
			animationList = animationList.filter((f) => f.id !== connection.id)
		}
	}
}

/**
 * Renders a selection rectangle on the canvas and triggers the event for selected nodes.
 *
 * @param {Object} params - The parameters for rendering the selection.
 * @param {CanvasSelect} params.canvasSelect - The selection area on the canvas.
 * @param {string} params.theme - The current theme, either 'dark' or 'light'.
 * @param {NodeSelected} params.selectedNode - The currently selected node.
 * @param {CanvasRelativePos} params.canvasRelativePos - The relative position of the canvas.
 * @param {Nodes} params.nodes - The collection of nodes.
 * @param {CanvasRenderingContext2D} params.ctx - The canvas rendering context.
 *
 * @returns {void}
 */
export function renderSelected({ canvasSelect, theme, ctx }: Render_Select_Interface) {
	if (!canvasSelect.show) return
	ctx.beginPath()
	ctx.strokeStyle = theme === 'dark' ? '#ffffff' : '#2C3E50'
	ctx.lineWidth = 2
	ctx.setLineDash([5, 5])
	ctx.roundRect(canvasSelect.x1, canvasSelect.y1, canvasSelect.x2 - canvasSelect.x1, canvasSelect.y2 - canvasSelect.y1, 10)
	ctx.stroke()
	ctx.setLineDash([])
	ctx.closePath()
}

/**
 * Handles the selection of nodes within a canvas area.
 *
 * @param {Object} params - The parameters for the function.
 * @param {Map<string, any>} params.selectedNode - A map to store the selected nodes.
 * @param {Object} params.canvasSelect - The selection area on the canvas.
 * @param {number} params.canvasSelect.x1 - The x-coordinate of the first corner of the selection area.
 * @param {number} params.canvasSelect.y1 - The y-coordinate of the first corner of the selection area.
 * @param {number} params.canvasSelect.x2 - The x-coordinate of the opposite corner of the selection area.
 * @param {number} params.canvasSelect.y2 - The y-coordinate of the opposite corner of the selection area.
 * @param {boolean} params.canvasSelect.show - Flag indicating whether the selection area is visible.
 * @param {Object} params.canvasRelativePos - The relative position of the canvas.
 * @param {number} params.canvasRelativePos.x - The x-coordinate of the relative position.
 * @param {number} params.canvasRelativePos.y - The y-coordinate of the relative position.
 * @param {Object} params.nodes - The nodes to be checked for selection.
 * @param {CanvasRenderingContext2D} params.ctx - The canvas rendering context.
 */
// function event_selected_nodes({ selectedNode, canvasSelect, canvasRelativePos, nodes }: Event_Select_Nodes_Interface) {
// 	if (!canvasSelect.show) return
// 	// standarize
// 	const x1 = Math.min(canvasSelect.x1, canvasSelect.x2)
// 	const y1 = Math.min(canvasSelect.y1, canvasSelect.y2)
// 	const x2 = Math.max(canvasSelect.x1, canvasSelect.x2)
// 	const y2 = Math.max(canvasSelect.y1, canvasSelect.y2)

// 	selectedNode.clear()
// 	for (const node of Object.values(nodes)) {
// 		if (node.design.x >= x1 && node.design.x + node.design.width <= x2 && node.design.y >= y1 && node.design.y + node.design.height <= y2) {
// 			selectedNode.set(node.id, {
// 				node,
// 				relative_pos: {
// 					x: canvasRelativePos.x - node.design.x,
// 					y: canvasRelativePos.y - node.design.y
// 				}
// 			})
// 		}
// 	}
// }

/**
 * Draws a preview of a node connection on the canvas.
 *
 * @param {Object} params - The parameters for the function.
 * @param {Object} params.node_connection_new - The new node connection details.
 * @param {INode} params.node_connection_new.node - The origin node of the connection.
 * @param {number} params.node_connection_new.output_index - The output index of the origin node.
 * @param {Object} params.canvasRelativePos - The relative position on the canvas.
 * @param {number} params.canvasRelativePos.x - The x-coordinate on the canvas.
 * @param {number} params.canvasRelativePos.y - The y-coordinate on the canvas.
 * @param {Object} params.nodes - The collection of nodes.
 * @param {CanvasRenderingContext2D} params.ctx - The canvas rendering context.
 */
export function drawNodeConnectionPreview({
	node_connection_new,
	index,
	type,
	canvasRelativePos,
	nodes,
	ctx
}: {
	node_connection_new: INodeCanvas
	type: 'input' | 'output' | 'callback'
	index: number
	canvasRelativePos: { x: number; y: number }
	nodes: { [key: string]: INodeCanvas }
	ctx: CanvasRenderingContext2D
}) {
	if (!['output', 'callback'].includes(type)) return
	const node_origin = node_connection_new
	const node_destiny = verifyNodeFocus({
		x: canvasRelativePos.x,
		y: canvasRelativePos.y,
		margin: { x1: 10, y1: 0 },
		nodes
	})

	// Determinar si hay una conexión válida disponible
	const hasValidConnection = node_destiny?.node && node_destiny.input_index !== null && node_destiny.node.id !== node_origin.id

	const bezier_value = calcBezier({
		node_origin,
		destiny: {
			x: hasValidConnection ? node_destiny.node!.design.x : canvasRelativePos.x,
			y: hasValidConnection ? node_destiny.node!.design.y + (30 + node_destiny.input_index! * 20) : canvasRelativePos.y
		},
		output_index: index
	})
	draw_bezier({
		ctx,
		color: node_origin.info.color,
		bezier_value,
		is_dashed: !hasValidConnection,
		destinyColor: hasValidConnection && node_destiny?.node ? node_destiny.node.info.color : undefined
	})

	// Resaltar el input de destino si hay una conexión válida
	if (hasValidConnection && node_destiny?.node && node_destiny.input_index !== null) {
		ctx.beginPath()
		ctx.strokeStyle = node_destiny?.node ? node_destiny.node.info.color : node_origin.info.color
		ctx.lineWidth = 5
		ctx.shadowColor = node_destiny?.node ? node_destiny.node.info.color : node_origin.info.color
		ctx.shadowBlur = 10
		const inputX = node_destiny.node.design.x - 7
		const inputY = node_destiny.node.design.y + 25 + node_destiny.input_index * 20 - 1
		ctx.roundRect(inputX, inputY, 10, 12, 2)
		ctx.stroke()
		ctx.shadowColor = 'transparent'
		ctx.closePath()
	}
}

/**
 * Obtiene la posición de un conector en un nodo.
 * @param node - Nodo del cual obtener la posición del conector
 * @param connectorName - Nombre del conector
 * @returns La posición del conector o null si no se encuentra
 */
export function getPositionConnection(node: INodeCanvas, connectorName: string) {
	const { x, y, height, width } = node.design
	let pos = 0
	let point = { x: 0, y: 0 }
	let side: 'left' | 'right' | 'top' | 'bottom' = 'left'
	for (const [connector, value] of Object.entries(node.info.connectors)) {
		const index = value.findIndex((f: { name: string } | string) => (typeof f === 'object' ? f.name : f === connectorName))
		if (index !== -1) {
			if (connector === 'inputs') {
				pos = 30 + index * 20
				side = 'left'
				point = { x: x, y: pos }
			}
			if (connector === 'outputs') {
				pos = 30 + index * 20
				point = { x: x + (width || 0), y: pos }
				side = 'right'
			}
			if (connector === 'callbacks') {
				const total = value.length
				const spacing = 20 // separación entre conectores
				const totalWidth = (total - 1) * spacing
				pos = ((width || 0) - 5) / 2 - totalWidth / 2 + index * spacing
				point = { x: x + (width || 0) / 2 - totalWidth / 2 + index * spacing, y: y + (height || 0) }
				side = 'bottom'
			}
			return { pos, point, side }
		}
	}
	return null
}

/**
 * Renders the connection nodes between two nodes on a canvas.
 *
 * @param {Object} params - The parameters for rendering the connection nodes.
 * @param {Map<string, { node: INode, relative_pos: { x: number; y: number } }>} params.selectedNode - A map of selected nodes with their relative positions.
 * @param {INode} params.node_origin - The origin node of the connection.
 * @param {INode} params.node_destiny - The destination node of the connection.
 * @param {string} params.input - The input identifier of the destination node.
 * @param {string} params.output - The output identifier of the origin node.
 * @param {CanvasRenderingContext2D} params.ctx - The canvas rendering context.
 * @param {IConnection} params.connection - The connection object containing pointers and focus state.
 * @param {Object.<string, INode>} params.nodes - A dictionary of all nodes by their identifiers.
 * @param {number} params.indexTime - The current time index used for animation.
 */
export function renderConnectionNodes({
	ctx,
	connection,
	nodes
}: {
	ctx: CanvasRenderingContext2D
	connection: INodeConnections
	nodes: { [key: string]: INodeCanvas }
}) {
	let connector: Point[] = []
	if (connection.pointers) connector = connection.pointers
	const nodeOrigin = nodes[connection.idNodeOrigin]
	const nodeDestiny = nodes[connection.idNodeDestiny]
	if (!nodeOrigin || !nodeDestiny || typeof nodeOrigin === 'string' || typeof nodeDestiny === 'string') return
	if (!connection.pointers) {
		const shapeA = {
			left: nodeOrigin.design.x,
			top: nodeOrigin.design.y,
			width: nodeOrigin.design.width,
			height: nodeOrigin.design.height
		}
		const shapeB = {
			left: nodeDestiny.design.x,
			top: nodeDestiny.design.y,
			width: nodeDestiny.design.width,
			height: nodeDestiny.design.height
		}

		const shapeAPos = getPositionConnection(nodeOrigin, connection.connectorOriginName)
		const shapeBPos = getPositionConnection(nodeDestiny, connection.connectorDestinyName)

		if (!shapeAPos || !shapeBPos) {
			connection.pointers = []
			return
		}

		connector = OrthogonalConnector.route({
			ctx,
			nodes,
			pointA: {
				shape: shapeA,
				side: shapeAPos.side,
				distance: shapeAPos.pos
			},
			pointB: {
				shape: shapeB,
				side: shapeBPos.side,
				distance: shapeBPos.pos
			},
			shapeMargin: 10,
			globalBoundsMargin: 10,
			globalBounds: {
				left: Math.min(shapeA.left - 100, shapeB.left - 100),
				top: Math.min(shapeA.top - 100, shapeB.top - 100),
				width: Math.max(shapeA.left + (shapeA.width || 0) + 100, shapeB.left + (shapeB.width || 0) + 100),
				height: Math.max(shapeA.top + (shapeA.height || 0) + 100, shapeB.top + (shapeB.height || 0) + 100)
			}
		})

		connection.pointers = connector
		const firstPoint = connection?.pointers[0]
		if (firstPoint) {
			const lastPoint = connection.pointers[connection.pointers.length - 1]
			const { x: xPath, y: yPath } = firstPoint
			const { x: xPath2, y: yPath2 } = lastPoint
			const color = ctx.createLinearGradient(xPath, yPath, xPath2, yPath2)
			color.addColorStop(0, nodeOrigin.info.color || '#3498DB')
			color.addColorStop(1, nodeDestiny.info.color || '#3498DB')
			connection.colorGradient = color
		}
	}

	if (connector.length === 0) {
		// subscriberHelper().send(
		// 	'connectionError',
		// 	{
		// 		msg: 'No se puede conectar los nodos de forma visual',
		// 		type: 'error'
		// 	},
		// 	true
		// )
	}

	const firstPoint = connector[0]
	if (!firstPoint) return
	const { x: xPath, y: yPath } = firstPoint
	ctx.beginPath()

	if (!connection.isFocused) {
		ctx.moveTo(xPath, yPath)
		ctx.lineWidth = 3
		ctx.strokeStyle = connection.colorGradient || '#3498DB'
		for (const { x, y } of connector) {
			ctx.lineTo(x, y)
			ctx.setLineDash([8, 2]) /* dashes are 5px and spaces are 3px */
			ctx.lineDashOffset = Number.parseFloat((-indexTime / 3.3).toFixed(2))
		}
		ctx.stroke()
	} else {
		ctx.shadowColor = connection.isFocused ? '#333' : '#fff'
		ctx.shadowBlur = 20
		ctx.shadowOffsetX = 0
		ctx.shadowOffsetY = 0
		ctx.lineWidth = 5
		ctx.strokeStyle = connection.colorGradient || '#3498DB'
		for (const { x, y } of connector) {
			ctx.lineTo(x, y)
			ctx.setLineDash([0, 0]) /* dashes are 5px and spaces are 3px */
			ctx.lineDashOffset = Number.parseFloat((-indexTime / 3.3).toFixed(2))
		}
		ctx.stroke()
		ctx.shadowBlur = 0
	}
	ctx.setLineDash([0, 0])
	ctx.closePath()
}

function draw_bezier({
	ctx,
	color,
	bezier_value,
	is_dashed = false,
	destinyColor
}: {
	ctx: CanvasRenderingContext2D
	color: CanvasGradient | string
	bezier_value: Interface_Bezier
	is_dashed?: boolean
	destinyColor?: string
}) {
	const { AX, AY, CX, CY, DX, DY, FX, FY } = bezier_value
	ctx.beginPath()

	// Si hay un color de destino, crear un gradiente
	if (destinyColor && typeof color === 'string') {
		const gradient = ctx.createLinearGradient(AX, AY, FX, FY)
		gradient.addColorStop(0, color)
		gradient.addColorStop(1, destinyColor)
		ctx.strokeStyle = gradient
	} else {
		ctx.strokeStyle = color
	}

	ctx.lineWidth = 3
	ctx.moveTo(AX, AY)
	ctx.lineCap = 'round'
	if (is_dashed) {
		ctx.setLineDash([6, 6]) /* dashes are 5px and spaces are 3px */
		ctx.lineDashOffset = 0
	}
	ctx.bezierCurveTo(CX, CY, DX, DY, FX, FY)
	ctx.stroke()
	ctx.closePath()
	if (bezier_value.POS_T) {
		ctx.beginPath()
		// Para el punto animado, usar el color original
		ctx.fillStyle = typeof color === 'string' ? color : '#333'
		ctx.strokeStyle = '#333'
		ctx.arc(bezier_value.POS_T.x, bezier_value.POS_T.y, 3, 0, 2 * Math.PI)
		ctx.stroke()
		ctx.fill()
		ctx.closePath()
	}
}

function calcBezier({
	node_origin,
	destiny,
	output_index,
	time
}: {
	node_origin: INodeCanvas
	destiny: { x: number; y: number }
	output_index: number
	time?: number
}): Interface_Bezier {
	const originX = node_origin.design.x + (node_origin.design.width || 0) + 9
	const originY = node_origin.design.y + (30 + output_index * 20)

	const pointX = originX
	const minleft = 0
	const pointY = originY
	const FX = destiny.x
	const FY = destiny.y
	const AX = Number.parseFloat((pointX - minleft).toFixed(2))
	const AY = Number.parseFloat(pointY.toFixed(2))
	const CX = Number.parseFloat((pointX - minleft + Math.abs(FX - minleft - (pointX - minleft)) * 0.4).toFixed(2))
	const CY = Number.parseFloat(pointY.toFixed(2))
	const DX = Number.parseFloat((FX - minleft - Math.abs(FX - minleft - (pointX - minleft)) * 0.4).toFixed(2))
	const DY = Number.parseFloat(FY.toFixed(2))

	const TX = cubicN({ T: time || 0, A: AX, C: CX, D: DX, F: FX })
	const TY = cubicN({ T: time || 0, A: AY, C: CY, D: DY, F: FY })
	return {
		AX,
		AY,
		CX,
		CY,
		DX,
		DY,
		FX,
		FY,
		POS_T: time ? { x: TX, y: TY } : null
	}
}

function cubicN({ T, A, C, D, F }: { T: number; A: number; C: number; D: number; F: number }) {
	const t2 = T * T
	const t3 = t2 * T
	return A + (-A * 3 + T * (3 * A - A * T)) * T + (3 * C + T * (-6 * C + C * 3 * T)) * T + (D * 3 - D * 3 * T) * t2 + F * t3
}

export function verifyNodeFocus({
	x,
	y,
	margin,
	nodes
}: {
	x: number
	y: number
	margin?: { x1: number; y1: number; x2?: number; y2?: number }
	nodes: { [key: string]: INodeCanvas }
}) {
	let nodes_selected: INodeCanvas | null = null
	let input_index: number | null = null
	let output_index: number | null = null

	const x_margin = margin?.x1 || 0
	const y_margin = margin?.y1 || 0
	const x_margin2 = margin?.x2 || 0
	const y_margin2 = margin?.y2 || 0

	for (const node of Object.values(nodes)) {
		if (
			node.design.x < x + x_margin &&
			node.design.x + (node.design.width || 0) + x_margin2 > x &&
			node.design.y < y + y_margin &&
			node.design.y + (node.design.height || 0) + y_margin2 > y
		) {
			nodes_selected = node
			// Verificar inputs (lado izquierdo del nodo)
			for (const input of Object.keys(node.info.connectors.inputs)) {
				if (
					x >= node.design.x - 8 &&
					x <= node.design.x &&
					y >= node.design.y + 25 + Number.parseInt(input) * 20 - 5 &&
					y <= node.design.y + 25 + Number.parseInt(input) * 20 + 15
				) {
					input_index = Number(input)
				}
			}
			// Verificar outputs (lado derecho del nodo)
			for (const output of Object.keys(node.info.connectors.outputs)) {
				if (
					x >= node.design.x + (node.design.width || 0) &&
					x <= node.design.x + (node.design.width || 0) + 8 &&
					y >= node.design.y + 25 + Number.parseInt(output) * 20 - 5 &&
					y <= node.design.y + 25 + Number.parseInt(output) * 20 + 15
				) {
					output_index = Number(output)
				}
			}
		}
	}
	return { node: nodes_selected, input_index, output_index }
}
