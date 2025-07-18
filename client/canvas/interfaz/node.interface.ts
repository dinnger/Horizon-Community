import type { INodePropertiesType } from './node.properties.interface.js'

interface Point {
	x: number
	y: number
}

interface INodeInfo {
	name: string
	desc: string
	icon: string
	group: string
	color: string
	connectors: INodeConnectors
	flags?: {
		isSingleton?: boolean
		isTrigger?: boolean
		isAccessSecrets?: boolean
	}
}

interface IMetaNode {
	[key: string]: any
}

export interface INodeConnectors {
	inputs: { name: string; nextNodeTag?: string | string[] }[]
	outputs: { name: string; nextNodeTag?: string | string[] }[]
	callbacks?: { name: string; nextNodeTag?: string | string[] }[]
}

export interface INodeConnections {
	id?: string
	connectorOriginName: string
	idNodeOrigin: string
	idNodeDestiny: string
	connectorDestinyName: string // connector input
	pointers?: Point[]
	colorGradient?: any
	isFocused?: boolean
	isNew?: boolean
}

// ============================================================================
// Node
// ============================================================================
export interface INode {
	id?: string
	info: INodeInfo
	dependencies?: string[]
	properties: INodePropertiesType
	credentials?: INodePropertiesType
	meta?: IMetaNode
	tags?: string[]
}

// ============================================================================
// CANVAS
// ============================================================================

export interface INodeCanvas extends INode {
	type: string
	design: Point & { width?: number; height?: number }
	connections?: INodeConnections[]
}

// Información del nodo original al disparar la acción de añadir nodo
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
