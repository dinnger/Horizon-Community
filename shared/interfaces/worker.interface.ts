import type { ServerRouterEvents } from '@server/src/routes/socket'

export interface IWorkerInfo {
	id: string
	workflowId: string
	processId: number
	port: number
	status: 'starting' | 'running' | 'stopping' | 'stopped' | 'error'
	startTime: Date
	lastActivity: Date
	executionId?: string
	version?: string
	memoryUsage?: {
		rss: number
		heapUsed: number
		heapTotal: number
		external: number
	}
	cpuUsage?: {
		user: number
		system: number
	}
}

export interface IWorkerMessage {
	type: string
	data?: any
	requestId?: string
	workerId?: string
	route?: ServerRouterEvents
	success?: boolean
	message?: string
}

export interface IWorkerRequest {
	route: string
	data: any
	callback: (response: any) => void
}
