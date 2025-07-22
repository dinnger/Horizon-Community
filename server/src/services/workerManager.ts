/**
 * Worker Manager Service
 *
 * Manages workflow execution workers, their lifecycle, and communication
 * between the main server and worker processes.
 */

import type { Server } from 'socket.io'
import { Worker } from 'node:worker_threads'
import { EventEmitter } from 'node:events'
import { v4 as uuidv4 } from 'uuid'
import { serverRouter } from '../routes/socket/index.js'
import path from 'node:path'

export interface WorkerInfo {
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

export interface WorkerMessage {
	type: string
	data?: any
	requestId?: string
	workerId?: string
	route?: string
	success?: boolean
	message?: string
}

export interface WorkerRequest {
	route: string
	data: any
	callback: (response: any) => void
}

class WorkerManager extends EventEmitter {
	private workers: Map<
		string,
		{
			info: WorkerInfo
			process: Worker
			pendingRequests: Map<string, (response: any) => void>
		}
	> = new Map()

	private portRange = { start: 3100, end: 5000 }
	private usedPorts: Set<number> = new Set()
	private io: Server | null = null

	constructor() {
		super()
		this.setupCleanup()
	}

	setIo(io: Server) {
		this.io = io
	}

	/**
	 * Create and start a new worker for workflow execution
	 */
	async createWorker(options: {
		workflowId: string
		executionId?: string
		version?: string
	}): Promise<WorkerInfo> {
		const workerId = uuidv4()
		const port = this.getAvailablePort()

		if (!port) {
			throw new Error('No hay puertos disponibles para el worker')
		}

		const workerInfo: WorkerInfo = {
			id: workerId,
			workflowId: options.workflowId,
			processId: 0, // Will be set when process starts
			port,
			status: 'starting',
			startTime: new Date(),
			lastActivity: new Date(),
			executionId: options.executionId,
			version: options.version
		}

		try {
			const workerProcess = await this.spawnWorkerProcess(workerId, options.workflowId, port)

			// Workers in worker_threads don't have a pid property like child_process
			// We'll use the worker threadId if available, or just use a placeholder
			workerInfo.processId = workerProcess.threadId || 0
			workerInfo.status = 'running'

			this.workers.set(workerId, {
				info: workerInfo,
				process: workerProcess,
				pendingRequests: new Map()
			})

			this.usedPorts.add(port)
			this.emit('worker:created', workerInfo)

			return workerInfo
		} catch (error) {
			this.usedPorts.delete(port)
			workerInfo.status = 'error'
			throw error
		}
	}

	/**
	 * Stop and remove a worker
	 */
	async stopWorker(workerId: string): Promise<boolean> {
		const worker = this.workers.get(workerId)
		if (!worker) {
			return false
		}

		worker.info.status = 'stopping'

		try {
			// Send shutdown signal
			worker.process.postMessage({ type: 'shutdown' })

			// Give it time to shutdown gracefully
			await new Promise<void>((resolve) => {
				const timeout = setTimeout(() => {
					worker.process.terminate()
					resolve()
				}, 5000)

				worker.process.on('exit', () => {
					clearTimeout(timeout)
					resolve()
				})
			})

			this.cleanupWorker(workerId)
			this.emit('worker:stopped', worker.info)

			return true
		} catch (error) {
			console.error(`Error deteniendo worker ${workerId}:`, error)
			worker.process.terminate()
			this.cleanupWorker(workerId)
			return false
		}
	}

	/**
	 * Send a request to a specific worker
	 */
	async sendRequestToWorker(workerId: string, route: string, data: any = {}): Promise<any> {
		const worker = this.workers.get(workerId)
		if (!worker || worker.info.status !== 'running') {
			throw new Error(`Worker ${workerId} no está disponible`)
		}

		return new Promise((resolve, reject) => {
			const requestId = uuidv4()
			const timeout = setTimeout(() => {
				worker.pendingRequests.delete(requestId)
				reject(new Error('Timeout en la solicitud al worker'))
			}, 30000)

			worker.pendingRequests.set(requestId, (response) => {
				clearTimeout(timeout)
				if (response.success) {
					resolve(response.data)
				} else {
					reject(new Error(response.message || 'Error en la solicitud al worker'))
				}
			})

			worker.process.postMessage({
				type: 'request',
				route,
				data,
				requestId
			})

			worker.info.lastActivity = new Date()
		})
	}

	/**
	 * Handle requests from workers to the main server
	 */
	async handleWorkerRequest(workerId: string, route: string, data: any, requestId: string): Promise<void> {
		const worker = this.workers.get(workerId)
		if (!worker) {
			return
		}

		try {
			if (!serverRouter[route]) {
				throw new Error(`Ruta no encontrada: ${route}`)
			}

			await serverRouter[route]({
				io: this.io,
				socket: null,
				data,
				callback: (data: any) => {
					worker.process.postMessage({
						type: 'response',
						requestId,
						success: data.success,
						data: data,
						message: data.message
					})
				}
			})
			worker.info.lastActivity = new Date()
		} catch (error) {
			console.error(`Error manejando solicitud de worker ${workerId}:`, error)

			worker.process.postMessage({
				type: 'response',
				requestId,
				success: false,
				message: error instanceof Error ? error.message : 'Error interno del servidor'
			})
		}
	}

	/**
	 * Get all active workers
	 */
	getActiveWorkers(): WorkerInfo[] {
		return Array.from(this.workers.values()).map((w) => w.info)
	}

	/**
	 * Get worker by ID
	 */
	getWorker(workerId: string): WorkerInfo | undefined {
		return this.workers.get(workerId)?.info
	}

	/**
	 * Get workers by workflow ID
	 */
	getWorkersByWorkflow(workflowId: string): WorkerInfo[] {
		return Array.from(this.workers.values())
			.filter((w) => w.info.workflowId === workflowId)
			.map((w) => w.info)
	}

	/**
	 * Update worker statistics
	 */
	updateWorkerStats(
		workerId: string,
		stats: {
			memoryUsage?: WorkerInfo['memoryUsage']
			cpuUsage?: WorkerInfo['cpuUsage']
		}
	): void {
		const worker = this.workers.get(workerId)
		if (worker) {
			if (stats.memoryUsage) {
				worker.info.memoryUsage = stats.memoryUsage
			}
			if (stats.cpuUsage) {
				worker.info.cpuUsage = stats.cpuUsage
			}
			worker.info.lastActivity = new Date()
		}
	}

	private async spawnWorkerProcess(workerId: string, workflowId: string, port: number): Promise<Worker> {
		try {
			const workerProcess = await this.trySpawnWorker(workerId, workflowId, port)

			// Handle worker messages
			workerProcess.on('message', (message: WorkerMessage) => {
				this.handleWorkerMessage(workerId, message)
			})

			// Handle worker errors (after spawn)
			workerProcess.on('error', (error: Error) => {
				console.error(`Error en worker ${workerId} después del spawn:`, error)
				this.handleWorkerError(workerId, error)
			})

			// Handle worker exit
			workerProcess.on('exit', (code: number) => {
				console.log(`Worker ${workerId} terminó con código ${code}`)
				this.handleWorkerExit(workerId, code, null)
			})

			return workerProcess
		} catch (error) {
			console.error(`Error al crear worker ${workerId}:`, error)
			throw error
		}
	}

	/**
	 * Try different commands to spawn the worker process
	 */
	private async trySpawnWorker(workerId: string, workflowId: string, port: number, retryCount = 0): Promise<Worker> {
		const workerPath = path.join(process.cwd(), 'dist', 'worker', 'index.js')

		try {
			const worker = new Worker(workerPath, {
				workerData: {
					workerId,
					workflowId,
					port,
					serverPort: process.env.SERVER_PORT || '3000',
					nodeEnv: process.env.NODE_ENV || 'development'
				}
			})

			return new Promise((resolve, reject) => {
				// Handle worker ready signal
				worker.on('message', (message) => {
					if (message.type === 'ready') {
						console.log(`Worker ${workerId} iniciado exitosamente`)
						resolve(worker)
					}
				})

				// Handle worker errors
				worker.on('error', (error) => {
					reject(error)
				})

				// Handle timeout
				const timeout = setTimeout(() => {
					reject(new Error(`Timeout al iniciar worker ${workerId}`))
				}, 10000)

				worker.on('message', (message) => {
					if (message.type === 'ready') {
						clearTimeout(timeout)
					}
				})
			})
		} catch (error) {
			console.error(`Error al crear worker ${workerId}:`, error)
			throw error
		}
	}

	private handleWorkerMessage(workerId: string, message: WorkerMessage): void {
		const worker = this.workers.get(workerId)
		if (!worker) return

		switch (message.type) {
			case 'request':
				if (message.requestId && message.route) {
					this.handleWorkerRequest(workerId, message.route, message.data, message.requestId)
				}
				break
			case 'response':
				if (message.requestId) {
					const callback = worker.pendingRequests.get(message.requestId)
					if (callback) {
						callback(message)
						worker.pendingRequests.delete(message.requestId)
					}
				}
				break
			case 'stats':
				this.updateWorkerStats(workerId, message.data)
				break
			case 'ready':
				worker.info.status = 'running'
				this.emit('worker:ready', worker.info)
				break
			case 'error':
				this.handleWorkerError(workerId, new Error(message.data?.message || 'Worker error'))
				break
		}
	}

	private handleWorkerError(workerId: string, error: Error): void {
		const worker = this.workers.get(workerId)
		if (worker) {
			worker.info.status = 'error'
			this.emit('worker:error', { workerId, error: error.message })
		}
	}

	private handleWorkerExit(workerId: string, code: number | null, signal: NodeJS.Signals | null): void {
		this.cleanupWorker(workerId)
		this.emit('worker:exit', { workerId, code, signal })
	}

	private cleanupWorker(workerId: string): void {
		const worker = this.workers.get(workerId)
		if (worker) {
			this.usedPorts.delete(worker.info.port)
			worker.info.status = 'stopped'

			// Reject any pending requests
			for (const [requestId, callback] of worker.pendingRequests) {
				callback({ success: false, message: 'Worker stopped' })
			}
			worker.pendingRequests.clear()

			this.workers.delete(workerId)
		}
	}

	private getAvailablePort(): number | null {
		for (let port = this.portRange.start; port <= this.portRange.end; port++) {
			if (!this.usedPorts.has(port)) {
				return port
			}
		}
		return null
	}

	private setupCleanup(): void {
		const cleanup = () => {
			console.log('Deteniendo todos los workers...')
			const stopPromises = Array.from(this.workers.keys()).map((id) => this.stopWorker(id))
			Promise.all(stopPromises).then(() => {
				process.exit(0)
			})
		}

		process.on('SIGTERM', cleanup)
		process.on('SIGINT', cleanup)
		process.on('exit', cleanup)
	}
}

// Singleton instance
export const workerManager = new WorkerManager()
