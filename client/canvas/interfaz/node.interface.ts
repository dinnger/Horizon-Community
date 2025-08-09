import type { INodePropertiesType, INodeConnectors, INodeProperties } from './node.properties.interface'

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
	properties: any
	credentials?: any
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
