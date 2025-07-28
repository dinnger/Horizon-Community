import type { INodeGroup } from '@canvas/interfaz/group.interface'
import type { INodeCanvas, INodeConnections } from '@canvas/interfaz/node.interface'
import type { INote } from '@canvas/interfaz/note.interface'

export type WorkflowData = {
	nodes: { [key: string]: INodeCanvas }
	connections: INodeConnections[]
	notes?: INote[]
	groups?: INodeGroup[]
	version: string
	timestamp: number
}

export interface IStatsAnimations {
	nodeId: string
	connectName: string
	executeTime: number
	length?: number
}

export interface IPanelTrace {
	id: string
	timestamp: Date
	nodeId: string
	connectionName: string
	executeTime: number
	length?: number
}

export interface IPanelConsole {
	id: string
	date: Date
	level: string
	message: string
}
