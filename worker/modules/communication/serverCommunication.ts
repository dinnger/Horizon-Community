import type { Worker } from '../../worker.js'
import type { ISubscriberType } from '@shared/interfaces/subscriber/subscriber.interface.js'
import { v4 as uuidv4 } from 'uuid'
import { parentPort } from 'node:worker_threads'

/**
 * Worker Server Communication Helper
 *
 * Provides helper functions for workers to communicate with the main server
 * and request data like nodes, workflows, etc.
 */

// Global server communication instance
class WorkerServerComm {
	private workflowId: string
	private pendingRequests: Map<
		string,
		{
			resolve: (value: any) => void
			reject: (error: Error) => void
		}
	> = new Map()

	constructor(el: Worker) {
		this.workflowId = el.workflowId
		this.setupMessageHandling()
	}

	private setupMessageHandling() {
		// Handle responses from parent thread
		if (parentPort) {
			parentPort.on('message', (message: any) => {
				if (message.type === 'response' && message.requestId) {
					const pending = this.pendingRequests.get(message.requestId)
					if (pending) {
						if (message.success) {
							pending.resolve(message.data)
						} else {
							pending.reject(new Error(message.message || 'Request failed'))
						}
						this.pendingRequests.delete(message.requestId)
					}
				}
			})
		}
	}

	async requestFromServer(route: string, data: any = {}): Promise<any> {
		return new Promise((resolve, reject) => {
			const requestId = uuidv4()
			const timeout = setTimeout(() => {
				this.pendingRequests.delete(requestId)
				reject(new Error('Request timeout'))
			}, 30000)

			this.pendingRequests.set(requestId, {
				resolve: (value) => {
					clearTimeout(timeout)
					resolve(value)
				},
				reject: (error) => {
					clearTimeout(timeout)
					reject(error)
				}
			})

			// Send request to parent thread which will forward to server
			if (parentPort) {
				parentPort.postMessage({
					type: 'request',
					route,
					data: {
						...data,
						workflowId: this.workflowId
					},
					requestId
				})
			} else {
				this.pendingRequests.delete(requestId)
				reject(new Error('No parent port available'))
			}
		})
	}

	async subscribeFromServer({ event, params, eventData }: { event: ISubscriberType; params?: string[]; eventData: any }) {
		const newEvent = params && Array.isArray(params) ? `${event}:${params.join(':')}` : event
		this.requestFromServer('worker:subscribe', { event: newEvent, eventData })
	}

	async sendStats(stats: any) {
		if (parentPort) {
			parentPort.postMessage({
				type: 'stats',
				data: stats,
				workerId: this.workflowId
			})
		}
	}

	async sendReady() {
		if (parentPort) {
			parentPort.postMessage({
				type: 'ready',
				workerId: this.workflowId
			})
		}
	}

	async sendError(error: string) {
		if (parentPort) {
			parentPort.postMessage({
				type: 'error',
				data: { message: error },
				workerId: this.workflowId
			})
		}
	}
}

/**
 * Initialize server communication for the worker
 */
export class ServerCommunication extends WorkerServerComm {
	/**
	 * Request nodes list from server
	 */
	async getNodesFromServer(): Promise<any> {
		try {
			return await this.requestFromServer('nodes:list')
		} catch (error) {
			console.error('Error getting nodes from server:', error)
			throw error
		}
	}

	/**
	 * Request specific node information from server
	 */
	async getNodeFromServer(nodeType: string): Promise<any> {
		try {
			return await this.requestFromServer('nodes:get', { type: nodeType })
		} catch (error) {
			console.error(`Error getting node ${nodeType} from server:`, error)
			throw error
		}
	}

	/**
	 * Request system health information from server
	 */
	async getSystemHealthFromServer(): Promise<any> {
		try {
			return await this.requestFromServer('system:health')
		} catch (error) {
			console.error('Error getting system health from server:', error)
			throw error
		}
	}

	/**
	 * Send debug data to server
	 */
	async sendDebug(data: any): Promise<void> {
		try {
			await this.requestFromServer('debug:send', data)
		} catch (error) {
			console.error('Error sending debug data to server:', error)
			throw error
		}
	}

	/**
	 * Report worker progress to server
	 */
	async reportProgress(progress: {
		nodeId?: string
		stepName?: string
		percentage?: number
		message?: string
		data?: any
	}): Promise<void> {
		try {
			await this.requestFromServer('worker:progress', {
				...progress,
				timestamp: new Date().toISOString()
			})
		} catch (error) {
			console.warn('Failed to report progress to server:', error)
		}
	}

	/**
	 * Request database connection info or perform database operations through server
	 */
	async requestDatabaseOperation(operation: string, params: any): Promise<any> {
		try {
			return await this.requestFromServer('database:operation', {
				operation,
				params
			})
		} catch (error) {
			console.error(`Error performing database operation ${operation}:`, error)
			throw error
		}
	}

	/**
	 * Request external API call through server (for rate limiting, auth, etc.)
	 */
	async requestExternalAPI(config: {
		url: string
		method?: string
		headers?: Record<string, string>
		data?: any
		timeout?: number
	}): Promise<any> {
		try {
			return await this.requestFromServer('external:api', config)
		} catch (error) {
			console.error('Error making external API request through server:', error)
			throw error
		}
	}

	/**
	 * Request file operations through server
	 */
	async requestFileOperation(
		operation: 'read' | 'write' | 'delete' | 'list',
		params: {
			path: string
			data?: any
			encoding?: string
		}
	): Promise<any> {
		try {
			return await this.requestFromServer('file:operation', {
				operation,
				...params
			})
		} catch (error) {
			console.error(`Error performing file operation ${operation}:`, error)
			throw error
		}
	}

	/**
	 * Send worker metrics to server for monitoring
	 */
	async sendMetrics(metrics: {
		executionTime?: number
		memoryUsage?: any
		cpuUsage?: any
		nodesProcessed?: number
		errorsCount?: number
		customMetrics?: Record<string, any>
	}): Promise<void> {
		try {
			await this.requestFromServer('worker:metrics', {
				...metrics,
				timestamp: new Date().toISOString()
			})
		} catch (error) {
			console.warn('Failed to send metrics to server:', error)
		}
	}

	/**
	 * Request environment variables from server
	 */
	async getEnvironmentFromServer(key?: string): Promise<any> {
		try {
			const data = await this.requestFromServer('worker:environment', { key })
			return data
		} catch (error) {
			console.error('Error getting environment from server:', error)
			throw error
		}
	}
}
