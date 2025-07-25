/**
 * Worker Routes
 *
 * Provides socket routes for managing and monitoring workflow execution workers:
 * - workers:list - List all active workers
 * - workers:get - Get specific worker information
 * - workers:stop - Stop a specific worker
 * - workers:stats - Get worker statistics and metrics
 * - workers:dashboard - Get dashboard data for worker monitoring
 * - workers:send-message - Send message to specific worker
 */

import type { SocketData } from './index.js'
import { workerManager } from '../../services/workerManager.js'

export const setupWorkersRoutes = {
	// List all active workers - requires admin permission
	'workers:list': async ({ socket, data, callback }: SocketData) => {
		try {
			const workers = workerManager.getActiveWorkers()
			callback({ success: true, workers })
		} catch (error) {
			console.error('Error listando workers:', error)
			callback({ success: false, message: 'Error al cargar workers' })
		}
	},

	// Get specific worker information - requires admin permission
	'workers:get': async ({ socket, data, callback }: SocketData) => {
		try {
			const { workerId } = data

			if (!workerId) {
				callback({ success: false, message: 'ID de worker requerido' })
				return
			}

			const worker = workerManager.getWorker(workerId)
			if (!worker) {
				callback({ success: false, message: 'Worker no encontrado' })
				return
			}

			callback({ success: true, worker })
		} catch (error) {
			console.error('Error obteniendo worker:', error)
			callback({ success: false, message: 'Error al obtener worker' })
		}
	},

	// Stop a specific worker - requires admin permission
	'workers:stop': async ({ socket, data, callback }: SocketData) => {
		try {
			const { workerId } = data

			if (!workerId) {
				callback({ success: false, message: 'ID de worker requerido' })
				return
			}

			const success = await workerManager.stopWorker(workerId)
			if (success) {
				callback({ success: true, message: 'Worker detenido exitosamente' })
			} else {
				callback({ success: false, message: 'Error al detener worker o worker no encontrado' })
			}
		} catch (error) {
			console.error('Error deteniendo worker:', error)
			callback({ success: false, message: 'Error al detener worker' })
		}
	},

	// Get workers by workflow - requires read permission
	'workers:by-workflow': async ({ socket, data, callback }: SocketData) => {
		try {
			const { workflowId } = data

			if (!workflowId) {
				callback({ success: false, message: 'ID de workflow requerido' })
				return
			}

			const workers = workerManager.getWorkersByWorkflow(workflowId)
			callback({ success: true, workers })
		} catch (error) {
			console.error('Error obteniendo workers por workflow:', error)
			callback({ success: false, message: 'Error al obtener workers del workflow' })
		}
	},

	// Get worker statistics and metrics - requires admin permission
	'workers:stats': async ({ socket, data, callback }: SocketData) => {
		try {
			const workers = workerManager.getActiveWorkers()

			const stats = {
				totalWorkers: workers.length,
				runningWorkers: workers.filter((w) => w.status === 'running').length,
				startingWorkers: workers.filter((w) => w.status === 'starting').length,
				stoppingWorkers: workers.filter((w) => w.status === 'stopping').length,
				errorWorkers: workers.filter((w) => w.status === 'error').length,

				// Memory usage statistics
				totalMemoryUsage: workers.reduce((total, w) => total + (w.memoryUsage?.rss || 0), 0),
				averageMemoryUsage: workers.length > 0 ? workers.reduce((total, w) => total + (w.memoryUsage?.rss || 0), 0) / workers.length : 0,

				// Port usage
				usedPorts: workers.map((w) => w.port),

				// Uptime statistics
				oldestWorker: workers.length > 0 ? Math.min(...workers.map((w) => w.startTime.getTime())) : null,

				// Group by workflow
				workflowDistribution: workers.reduce(
					(acc, w) => {
						acc[w.workflowId] = (acc[w.workflowId] || 0) + 1
						return acc
					},
					{} as Record<string, number>
				)
			}

			callback({ success: true, stats })
		} catch (error) {
			console.error('Error obteniendo estadísticas de workers:', error)
			callback({ success: false, message: 'Error al obtener estadísticas de workers' })
		}
	},

	// Get dashboard data for worker monitoring - requires admin permission
	'workers:dashboard': async ({ socket, data, callback }: SocketData) => {
		try {
			const workers = workerManager.getActiveWorkers()

			// Recent activity (last 24 hours)
			const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
			const recentWorkers = workers.filter((w) => w.startTime > oneDayAgo)

			const dashboard = {
				overview: {
					totalActive: workers.length,
					running: workers.filter((w) => w.status === 'running').length,
					errors: workers.filter((w) => w.status === 'error').length,
					starting: workers.filter((w) => w.status === 'starting').length
				},

				recentActivity: {
					workersStartedToday: recentWorkers.length,
					recentWorkers: recentWorkers
						.sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
						.slice(0, 10)
						.map((w) => ({
							id: w.id,
							workflowId: w.workflowId,
							status: w.status,
							startTime: w.startTime,
							port: w.port,
							memoryUsage: w.memoryUsage?.rss
						}))
				},

				performance: {
					totalMemoryUsage: workers.reduce((total, w) => total + (w.memoryUsage?.rss || 0), 0),
					averageMemoryPerWorker:
						workers.length > 0 ? workers.reduce((total, w) => total + (w.memoryUsage?.rss || 0), 0) / workers.length : 0,
					highMemoryWorkers: workers
						.filter((w) => w.memoryUsage && w.memoryUsage.rss > 100 * 1024 * 1024) // > 100MB
						.map((w) => ({
							id: w.id,
							workflowId: w.workflowId,
							memoryUsage: w.memoryUsage?.rss,
							port: w.port
						}))
				},

				workflows: {
					distribution: workers.reduce(
						(acc, w) => {
							if (!acc[w.workflowId]) {
								acc[w.workflowId] = {
									workflowId: w.workflowId,
									count: 0,
									workers: []
								}
							}
							acc[w.workflowId].count++
							acc[w.workflowId].workers.push({
								id: w.id,
								status: w.status,
								port: w.port,
								startTime: w.startTime
							})
							return acc
						},
						{} as Record<string, any>
					)
				}
			}

			callback({ success: true, dashboard })
		} catch (error) {
			console.error('Error obteniendo dashboard de workers:', error)
			callback({ success: false, message: 'Error al obtener dashboard de workers' })
		}
	},

	// Send message to specific worker - requires admin permission
	'workers:send-message': async ({ socket, data, callback }: SocketData) => {
		try {
			const { workerId, route, messageData } = data

			if (!workerId || !route) {
				callback({ success: false, message: 'ID de worker y ruta requeridos' })
				return
			}

			const response = await workerManager.sendRequestToWorker(workerId, route, messageData)
			callback({ success: true, response })
		} catch (error) {
			console.error('Error enviando mensaje a worker:', error)
			callback({ success: false, message: error instanceof Error ? error.message : 'Error al enviar mensaje al worker' })
		}
	},

	// Get worker logs (if implemented) - requires admin permission
	'workers:logs': async ({ socket, data, callback }: SocketData) => {
		try {
			const { workerId, lines = 100 } = data

			if (!workerId) {
				callback({ success: false, message: 'ID de worker requerido' })
				return
			}

			// This could be extended to read actual log files
			// For now, return a placeholder response
			callback({
				success: true,
				logs: [`[${new Date().toISOString()}] Worker ${workerId} log placeholder`],
				message: 'Funcionalidad de logs en desarrollo'
			})
		} catch (error) {
			console.error('Error obteniendo logs de worker:', error)
			callback({ success: false, message: 'Error al obtener logs del worker' })
		}
	},

	// Restart worker - requires admin permission
	'workers:restart': async ({ socket, data, callback }: SocketData) => {
		try {
			const { workerId } = data

			if (!workerId) {
				callback({ success: false, message: 'ID de worker requerido' })
				return
			}

			const worker = workerManager.getWorker(workerId)
			if (!worker) {
				callback({ success: false, message: 'Worker no encontrado' })
				return
			}

			// Stop the current worker
			const stopped = await workerManager.stopWorker(workerId)
			if (!stopped) {
				callback({ success: false, message: 'Error al detener worker' })
				return
			}

			// Create a new worker with the same configuration
			const newWorker = await workerManager.createWorker({
				workflowId: worker.workflowId,
				version: worker.version
			})

			callback({ success: true, worker: newWorker, message: 'Worker reiniciado exitosamente' })
		} catch (error) {
			console.error('Error reiniciando worker:', error)
			callback({ success: false, message: 'Error al reiniciar worker' })
		}
	}
}
