/**
 * Worker Manager Service
 *
 * Manages workflow execution workers, their lifecycle, and communication
 * between the main server and worker processes.
 *
 * Emits events to subscribers:
 * - worker:request - A request has been received from a worker
 * - worker:error - A worker encountered an error
 * - worker:exit - A worker has exited
 * - worker:ready - A worker has finished initializing
 */
import type { Express } from 'express'
import type { Server } from 'socket.io'
import type { IWorkerInfo, IWorkerMessage } from '@shared/interfaces/worker.interface.js'
import type { ServerRouterEvents } from '../routes/socket/index.js'
import { Worker } from 'node:worker_threads'
import { EventEmitter } from 'node:events'
import { v4 as uuidv4 } from 'uuid'
import { createProxyMiddleware } from 'http-proxy-middleware'
import path from 'node:path'
import WorkflowExecution from '../models/WorkflowExecution.js'

class WorkerManager extends EventEmitter {
	private workers: Map<
		string,
		{
			info: IWorkerInfo
			process: Worker
			pendingRequests: Map<string, (response: any) => void>
		}
	> = new Map()

	private portRange = { start: 3100, end: 5000 }
	private usedPorts: Map<string, { port: number; workerId: string }> = new Map()
	private io: Server | null = null
	private app: Express | null = null

	constructor() {
		super()
		this.setupCleanup()
	}

	initWorkerManager({ app, io }: { app: Express; io: Server }) {
		this.app = app
		this.io = io
	}

	/**
	 * Create and start a new worker for workflow execution
	 */
	async createWorker(options: {
		workflowId: string
		version?: string
	}): Promise<IWorkerInfo> {
		const workerId = uuidv4()
		const port = this.getAvailablePort({ workflowId: options.workflowId })

		if (!port) {
			throw new Error('No hay puertos disponibles para el worker')
		}

		// Proxy para el flujo de trabajo
		if (!port.exist) {
			this.app?.use(
				createProxyMiddleware({
					secure: false,
					target: `http://127.0.0.1:${port.value}`,
					changeOrigin: true,
					pathFilter: `/f_${options.workflowId}/api`
				})
			)
		}

		// Create execution record
		const execution = await WorkflowExecution.create({
			workflowId: options.workflowId,
			status: 'running',
			startTime: new Date(),
			trigger: 'manual',
			version: options.version // Store the executed version
		})

		const workerInfo: IWorkerInfo = {
			id: workerId,
			workflowId: options.workflowId,
			processId: 0, // Will be set when process starts
			port: port.value,
			status: 'starting',
			startTime: new Date(),
			lastActivity: new Date(),
			executionId: execution.id,
			version: options.version
		}

		try {
			const workerProcess = await this.spawnWorkerProcess(workerId, options.workflowId, port.value)

			// Workers in worker_threads don't have a pid property like child_process
			// We'll use the worker threadId if available, or just use a placeholder
			workerInfo.processId = workerProcess.threadId || 0
			workerInfo.status = 'running'

			this.workers.set(workerId, {
				info: workerInfo,
				process: workerProcess,
				pendingRequests: new Map()
			})

			this.usedPorts.set(options.workflowId, { port: port.value, workerId })
			this.emit('worker:created', workerInfo)

			return { ...workerInfo, executionId: execution.id }
		} catch (error) {
			this.usedPorts.delete(options.workflowId)
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
	async handleWorkerRequest(workerId: string, route: ServerRouterEvents, data: any, requestId: string): Promise<void> {
		const worker = this.workers.get(workerId)
		if (!worker) {
			return
		}

		try {
			this.emit('worker:request', {
				route,
				data,
				callback: (data: { success: boolean; message?: string }) => {
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
	getActiveWorkers(): IWorkerInfo[] {
		return Array.from(this.workers.values()).map((w) => w.info)
	}

	/**
	 * Get worker by ID
	 */
	getWorker(workerId: string): IWorkerInfo | undefined {
		return this.workers.get(workerId)?.info
	}

	/**
	 * Get workers by workflow ID
	 */
	getWorkersByWorkflow(workflowId: string): IWorkerInfo[] {
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
			memoryUsage?: IWorkerInfo['memoryUsage']
			cpuUsage?: IWorkerInfo['cpuUsage']
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
			workerProcess.on('message', (message: IWorkerMessage) => {
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

	private handleWorkerMessage(workerId: string, message: IWorkerMessage): void {
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

	private async handleWorkerError(workerId: string, error: Error): Promise<void> {
		const worker = this.workers.get(workerId)
		if (worker) {
			worker.info.status = 'error'
			await WorkflowExecution.update(
				{
					status: 'failed',
					endTime: new Date(),
					errorMessage: error.message
				},
				{
					where: {
						id: worker.info.executionId
					}
				}
			)
			this.emit('worker:error', { workerId, workflowId: worker.info.workflowId, error: error.message })
		}
	}

	private async handleWorkerExit(workerId: string, code: number | null, signal: NodeJS.Signals | null): Promise<void> {
		const worker = this.workers.get(workerId)
		this.cleanupWorker(workerId)
		if (!worker) return

		const endTime = new Date()
		const duration = `${Math.floor((endTime.getTime() - worker.info.startTime.getTime()) / 1000)}s`

		// Determine final status based on exit code
		const finalStatus = code === 0 ? 'success' : 'failed'

		// Update execution record
		await WorkflowExecution.update(
			{
				status: finalStatus,
				endTime,
				duration
			},
			{
				where: {
					id: worker.info.executionId
				}
			}
		)

		this.emit('worker:exit', { workerId, workflowId: worker.info.workflowId, code, signal })
	}

	private cleanupWorker(workerId: string): void {
		const worker = this.workers.get(workerId)
		if (worker) {
			worker.info.status = 'stopped'

			// Reject any pending requests
			for (const [requestId, callback] of worker.pendingRequests) {
				callback({ success: false, message: 'Worker stopped' })
			}
			worker.pendingRequests.clear()

			this.workers.delete(workerId)
		}
	}

	private getAvailablePort({ workflowId }: { workflowId: string }): { value: number; exist: boolean } | null {
		const verify = this.usedPorts.get(workflowId)
		if (verify) return { value: verify.port, exist: true }

		const usedPorts = Array.from(this.usedPorts.values()).map((p) => p.port)
		for (let value = this.portRange.start; value <= this.portRange.end; value++) {
			if (!usedPorts.includes(value)) {
				return { value, exist: false }
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
