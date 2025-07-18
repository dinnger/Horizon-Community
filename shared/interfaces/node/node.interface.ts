import type { IPropertiesType } from '../workflow.properties.interface.js'
import type { IClassNode } from '../class.interface.js'

/**
 * Punto básico con coordenadas x, y
 */
export interface IPoint {
	x: number
	y: number
}

/**
 * Punto del canvas con propiedades adicionales
 */
export interface ICanvasPoint extends IPoint {
	button?: number
}

/**
 * Información básica de un nodo
 */
export interface INodeInfo {
	name: string
	description?: string
	icon: string
	group: string | string[]
	version?: string
	color?: string
	connectors?: INodeConnectors
	flags?: {
		isSingleton?: boolean
		isTrigger?: boolean
		isAccessSecrets?: boolean
	}
}

/**
 * Información de logs para un nodo
 */
export interface INodeLog {
	logs?: {
		start?: {
			type: 'none' | 'info' | 'warn' | 'error' | 'debug'
			value: string
		}
		exec?: {
			type: 'none' | 'info' | 'warn' | 'error' | 'debug'
			value: string
		}
	}
}

/**
 * Metadatos adicionales para un nodo
 */
export interface INodeMeta extends INodeLog {
	credentials?: string[]
	[key: string]: any
}

/**
 * Conectores de un nodo
 */
export interface INodeConnectors {
	inputs?: { name: string; nextNodeTag?: string | string[] }[] | Record<string, any>
	outputs: { name: string; nextNodeTag?: string | string[] }[] | Record<string, any>
	callbacks?: { name: string; nextNodeTag?: string | string[] }[] | Record<string, any>
}

/**
 * Información de estadísticas de un nodo
 */
export interface INodeStats {
	inputs: {
		data: { [key: string]: number }
		length: number
	}
	outputs: {
		data: { [key: string]: { value: number; changes: number } }
		length: number
	}
}

/**
 * Interfaz base para un nodo
 */
export interface INodeBase {
	id: string
	name: string
	type: string
	properties?: IPropertiesType
	credentials?: IPropertiesType
	meta?: INodeMeta
	dependencies?: string[]
	tags?: string[]
}

/**
 * Interfaz para un nodo con información completa
 */
export interface INodeFull extends INodeBase {
	info: INodeInfo
	color: string
	icon: string
	x: number
	y: number
	width: number
	height: number
	inputs: Array<string>
	outputs: Array<string>
	connections: Array<INodeConnection>
	stats?: INodeStats
}

/**
 * Interfaz para un nodo en el canvas
 */
export interface INodeCanvas extends INodeBase {
	type: string
	info: INodeInfo
	design: IPoint & { width?: number; height?: number }
	connections?: INodeConnection[]
	update?: () => void
	updateConnectionsOutput?: ({ before, after }: { before: string[]; after: string[] }) => void
}

/**
 * Interfaz para un nodo de worker
 */
export interface INodeWorker extends Omit<INodeFull, 'color' | 'icon' | 'width' | 'height' | 'inputs' | 'outputs' | 'connections'> {
	color?: string
	icon?: string
	width?: number
	height?: number
	inputs?: Array<string>
	outputs?: Array<string>
	connections?: Array<INodeConnection>
	class: IClassNode
	update?: () => void
}

/**
 * Interfaz para crear un nuevo nodo
 */
export interface INodeNew extends Omit<INodeFull, 'id' | 'height' | 'width' | 'inputs' | 'outputs' | 'x' | 'y'> {
	id?: string
	x?: number
	y?: number
	height?: number
	width?: number
	inputs?: Array<string>
	outputs?: Array<string>
	show?: boolean
	typeDescription?: string
	temporal_pos?: ICanvasPoint
	isManual?: boolean
}

/**
 * Interfaz para información de nodo al añadir conexión
 */
export interface INodeCanvasAdd {
	design: { x: number; y: number }
	relativePos: { x: number; y: number }
	connection: {
		type: 'input' | 'output' | 'callback'
		name: string
		nextNodeTag?: string | string[]
	}
	node: INodeCanvas
}

/**
 * Interfaz para conexión entre nodos
 */
export interface INodeConnection {
	id?: string
	connectorOriginName: string
	idNodeOrigin?: string
	idNodeDestiny: string
	connectorDestinyName: string
	pointers?: IPoint[]
	colorGradient?: any
	isFocused?: boolean
	isNew?: boolean
}

/**
 * Interfaz legacy para compatibilidad - será depreciada
 * @deprecated Usar INodeFull en su lugar
 */
export interface INode extends INodeFull {}

/**
 * Interfaz legacy para compatibilidad - será depreciada
 * @deprecated Usar INodeConnection en su lugar
 */
export interface IConnection extends INodeConnection {
	id_node_origin?: string
	id_node_destiny: string
	input: string
	output: string
}

/**
 * Interfaz legacy para compatibilidad - será depreciada
 * @deprecated Usar INodeWorker en su lugar
 */
export interface NodeClass extends INodeWorker {
	typeDescription: string
	credentialsActions?: any
}
