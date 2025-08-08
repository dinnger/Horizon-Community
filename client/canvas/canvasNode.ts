import type { INodeCanvas, INodeConnections } from './interfaz/node.interface'
import type { INodePropertiesType } from './interfaz/node.properties.interface'
import type { Point } from './canvasConnector'
import { addAnimation, render_node, renderConnectionNodes } from './canvasHelpers'
import { ref } from 'vue'
import { v4 as uuidv4 } from 'uuid'
import type { Nodes } from './canvasNodes'

export class NewNode {
	id: string
	type: string
	info: INodeCanvas['info']
	properties: INodePropertiesType
	oldProperties: INodePropertiesType
	meta?: INodeCanvas['meta'] | undefined
	design: Required<INodeCanvas['design']>
	connections: INodeConnections[]
	relativePos = { x: 0, y: 0 }
	isSelected = false
	isMove = false
	private el: Nodes
	public isLockedProperty = false
	private infoTrace = new Map<string, number>()

	constructor(value: INodeCanvas, el: Nodes) {
		this.el = el
		this.id = value.id || uuidv4()
		this.info = value.info
		// this.info.name = utilsValidateName({ text: utilsStandardName(value.info.name), nodes: Object.values(this.el.nodes) })
		this.type = value.type
		this.properties = value.properties
		this.oldProperties = JSON.parse(JSON.stringify(value.properties))
		this.meta = value.meta
		this.design = ref(value.design).value as any
		this.connections = value.connections || []

		this.design.width = value.design.width || 120
		this.calculateNodeHeight()
	}

	calculateNodeHeight() {
		const widthByInputs = Math.max(35 + (this.info.connectors?.inputs?.length || 0) * 20, 85)
		const widthByOutputs = Math.max(35 + (this.info.connectors?.outputs?.length || 0) * 20, 85)
		this.design.height = Math.max(widthByInputs, widthByOutputs) || 90
	}

	get() {
		return {
			id: this.id,
			type: this.type,
			info: this.info,
			properties: this.properties,
			design: this.design,
			connections: this.connections
		}
	}

	// changeName(name: string): boolean {
	// 	const standardName = utilsStandardName(name)
	// 	const nodesWithoutMe = Object.values(this.el.nodes).filter((f) => f.id !== this.id)
	// 	const newName = utilsValidateName({ text: standardName, nodes: nodesWithoutMe })
	// 	if (newName !== standardName) return false
	// 	this.info.name = newName
	// 	return true
	// }

	addConnection(element: INodeConnections): boolean {
		if (element.idNodeDestiny === this.id) {
			this.isMove = false
			this.isSelected = false
			this.connections.push(element)
			return true
		}
		let { id, idNodeDestiny } = element

		// Verificar si el nodo destino ya tiene una conexión
		for (const connection of this.connections) {
			if (
				connection.idNodeDestiny === idNodeDestiny &&
				connection.connectorOriginName === element.connectorOriginName &&
				connection.connectorDestinyName === element.connectorDestinyName
			) {
				return false
			}
		}

		id = id || uuidv4()
		const connection = new NewConnector({
			...element,
			id
		})
		if (!connection.idNodeOrigin || connection.idNodeOrigin === '') connection.idNodeOrigin = this.id
		this.connections.push(connection)
		this.isMove = false
		this.isSelected = false
		this.el.nodes[idNodeDestiny].isSelected = false

		// Ordernar en base a conectores
		const outputs = this.info.connectors.outputs.map((f) => (typeof f === 'object' ? f.name : f))
		this.connections = this.connections.sort((a, b) => {
			return outputs.indexOf(b.connectorOriginName) - outputs.indexOf(a.connectorOriginName)
		})

		this.connections.map((f) => {
			f.pointers = undefined
		})

		if (connection.idNodeOrigin === this.id) {
			this.el.nodes[idNodeDestiny].addConnection(connection)
			this.isMove = true
		}

		return true
	}

	deleteConnections({ id }: { id?: string }) {
		this.connections = this.connections.filter((f) => f.id !== id)
	}

	deleteAllConnections({ id }: { id?: string } = {}) {
		const list = id ? this.connections.filter((f) => f.id === id) : this.connections
		for (const connection of list) {
			if (connection.idNodeOrigin)
				this.el.nodes[connection.idNodeOrigin].deleteConnections({
					id: connection.id
				})
			this.el.nodes[connection.idNodeDestiny].deleteConnections({
				id: connection.id
			})
		}
	}

	setRelativePos(pos: { x: number; y: number }) {
		this.relativePos = {
			x: pos.x - this.design.x,
			y: pos.y - this.design.y
		}
	}

	verifySelected({ pos }: { pos?: { x: number; y: number; x2?: number; y2?: number } }) {
		if (!pos) return null
		const marginX = 2
		if (
			(!pos.x2 &&
				pos.x >= this.design.x + marginX &&
				pos.x <= this.design.x + this.design.width - marginX &&
				pos.y >= this.design.y &&
				pos.y <= this.design.y + this.design.height) ||
			(pos.x2 &&
				pos.y2 &&
				pos.x <= this.design.x &&
				pos.y <= this.design.y &&
				pos.x2 >= this.design.x + this.design.width &&
				pos.y2 >= this.design.y + this.design.height)
		) {
			return true
		}
		return false
	}

	setSelected({ pos, relative }: { pos?: { x: number; y: number; x2?: number; y2?: number }; relative: { x: number; y: number } }): {
		type: 'node' | 'connector'
		value: any
	} | null {
		this.isSelected = false
		this.isMove = false
		this.relativePos = { x: 0, y: 0 }
		if (!pos) return null

		const marginX = 2
		if (
			(!pos.x2 &&
				pos.x >= this.design.x + marginX &&
				pos.x <= this.design.x + this.design.width - marginX &&
				pos.y >= this.design.y &&
				pos.y <= this.design.y + this.design.height) ||
			(pos.x2 &&
				pos.y2 &&
				pos.x <= this.design.x &&
				pos.y <= this.design.y &&
				pos.x2 >= this.design.x + this.design.width &&
				pos.y2 >= this.design.y + this.design.height)
		) {
			this.setRelativePos(relative)
			this.isSelected = true
			this.isMove = true
			return { type: 'node', value: this.get() }
		}

		const connector = this.getSelectedConnectors({ x: pos.x, y: pos.y })
		if (!connector) return null
		return { type: 'connector', value: connector }
	}
	getSelectedConnectors({ x, y }: { x: number; y: number }): {
		node: INodeCanvas
		type: 'output' | 'input' | 'callback'
		index: number
		value: any
	} | null {
		const marginX = 8

		// Detectar outputs (lado derecho del nodo)
		for (const output of Object.keys(this.info.connectors.outputs)) {
			if (
				x <= this.design.x + this.design.width + marginX &&
				x >= this.design.x + this.design.width &&
				y >= this.design.y + 25 + Number.parseInt(output) * 20 - 5 &&
				y <= this.design.y + 25 + Number.parseInt(output) * 20 + 15
			) {
				this.isMove = false
				this.isSelected = true
				return {
					node: this.get(),
					type: 'output',
					index: Number(output),
					value: this.info.connectors.outputs[Number(output)]
				}
			}
		}

		// Detectar inputs (lado izquierdo del nodo)
		for (const input of Object.keys(this.info.connectors.inputs || {})) {
			if (
				x >= this.design.x - marginX &&
				x <= this.design.x &&
				y >= this.design.y + 25 + Number.parseInt(input) * 20 - 5 &&
				y <= this.design.y + 25 + Number.parseInt(input) * 20 + 15
			) {
				this.isMove = false
				this.isSelected = true
				return {
					node: this.get(),
					type: 'input',
					index: Number(input),
					value: this.info.connectors.inputs[Number(input)]
				}
			}
		}

		return null
	}

	getSelected() {
		return this.isSelected
	}

	// Verifica que nodos se encuentran en la misma conexion y los que se encuentran entre los nodos conectados
	private hasIntermediateNodes(): { [key: string]: INodeCanvas } {
		const nodes: { [key: string]: INodeCanvas } = {}
		const x = [this.design.x]
		const y = [this.design.y]
		const x2 = [this.design.x + this.design.width]
		const y2 = [this.design.y + this.design.height]

		nodes[this.id] = this.get()

		for (const connection of Object.values(this.connections)) {
			const node = this.el.nodes[connection.idNodeDestiny]
			nodes[connection.idNodeDestiny] = node.get()
			x.push(node.design.x)
			y.push(node.design.y)
			x2.push(node.design.x + node.design.width)
			y2.push(node.design.y + node.design.height)
		}

		const minX = Math.min(...x) - 200
		const maxX = Math.max(...x2) + 200
		const minY = Math.min(...y) - 200
		const maxY = Math.max(...y2) + 200

		for (const node of Object.values(this.el.nodes)) {
			// Ignorar nodos seleccionados y los nodos origen/destino
			if (node.id === this.id) continue

			const { x, y, width, height } = node.design

			if (x + width >= minX && x <= maxX && y + height >= minY && y <= maxY) {
				nodes[node.id] = node.get()
			}
		}

		return nodes
	}

	move({ relative }: { relative: { x: number; y: number } }) {
		if (!this.isMove) return
		let x = relative.x - this.relativePos.x
		let y = relative.y - this.relativePos.y
		// x and y only divisible by 20
		x = Math.round(x / this.el.canvasGrid) * this.el.canvasGrid
		y = Math.round(y / this.el.canvasGrid) * this.el.canvasGrid
		if (x === this.design.x && y === this.design.y) return
		this.design.x = x
		this.design.y = y

		for (const node of Object.values(this.hasIntermediateNodes())) {
			for (const connection of node.connections || []) {
				connection.pointers = undefined
			}
		}
	}

	delete() {
		this.deleteAllConnections()
		delete this.el.nodes[this.id]
		this.isSelected = false
	}

	duplicate() {
		this.isSelected = false
		return this.el.duplicateNode({ id: this.id })
	}

	duplicateMultiple() {
		this.el.duplicateMultiple()
	}

	addAnimation(data: { type: 'input' | 'output' | 'callback'; connectionName: string; length: number }) {
		if (this.el.ctx) {
			addAnimation({
				node: this,
				connections: data
			})
		}
		this.infoTrace.set(data.connectionName, data.length)
	}

	render({ ctx }: { ctx: CanvasRenderingContext2D }) {
		render_node({
			el: this.el.el,
			ctx,
			node: this,
			selected: this.isSelected,
			infoTrace: this.infoTrace
		})
	}

	renderConnections({ ctx, nodes }: { ctx: CanvasRenderingContext2D; nodes: { [key: string]: INodeCanvas } }) {
		let shapeMargin = 10
		for (const connection of this.connections) {
			const nodeOrigin = connection.idNodeOrigin
			connection.isFocused = this.isSelected
			// Si es el nodo origen, renderizar los nodos destino
			if (nodeOrigin !== this.id) continue
			shapeMargin += 5

			renderConnectionNodes({
				ctx,
				connection,
				nodes: this.hasIntermediateNodes(),
				shapeMargin
			})
		}
	}

	/**
	 * Limpia todos los datos del nodo.
	 */
	clear() {
		this.connections = []
	}
}

class NewConnector implements INodeConnections {
	id: string
	connectorOriginName: string
	idNodeOrigin: string
	idNodeDestiny: string
	connectorDestinyName: string // connector input
	isManual?: boolean
	pointers?: Point[]
	colorGradient?: any
	isFocused?: boolean
	isNew?: boolean
	// Si se bloquea la propiedad para evitar redudancia al obtener los cambios
	isLockedProperty = false
	constructor(value: INodeConnections) {
		this.id = value.id || uuidv4()
		this.connectorOriginName = value.connectorOriginName
		this.idNodeOrigin = value.idNodeOrigin
		this.idNodeDestiny = value.idNodeDestiny
		this.connectorDestinyName = value.connectorDestinyName
		this.pointers = value.pointers
		this.colorGradient = value.colorGradient
		this.isFocused = value.isFocused
		this.isNew = value.isNew
	}
}
