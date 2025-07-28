import type { Server } from 'socket.io'
import type { AuthenticatedSocket } from '../../middleware/socketAuth.js'
import { envs } from '../../config/envs.js'
import { setupAuthRoutes } from './auth.js'
import { setupWorkspaceRoutes } from './workspaces.js'
import { setupProjectRoutes } from './projects.js'
import { setupWorkflowRoutes } from './workflows.js'
import { setupWorkflowHistoryRoutes } from './workflowHistory.js'
import { setupSettingsRoutes } from './settings.js'
import { setupAdminRoutes } from './admin.js'
import { setupNodeRoutes } from './nodes.js'
import { setupWorkersRoutes } from './workers.js'
import { setupWorkerRoutes } from './worker.js'
import { setupDeploymentInstancesRoutes } from './deploymentsInstances.js'
import { setupDeploymentTypesRoutes } from './deploymentsTypes.js'
import { setupDeploymentRoutes } from './deployments.js'
import { setupDeploymentQueueRoutes } from './deploymentQueue.js'
import { verifyPermission } from '../../middleware/permissions.js'
import { setupSubscribersRoutes } from './subscribers.js'
import { workerManager } from '@server/src/services/workerManager.js'

export const serverRouter = {
	...setupAuthRoutes,
	...setupWorkspaceRoutes,
	...setupProjectRoutes,
	...setupWorkflowRoutes,
	...setupWorkflowHistoryRoutes,
	...setupSettingsRoutes,
	...setupAdminRoutes,
	...setupNodeRoutes,
	...setupWorkersRoutes,
	...setupWorkerRoutes,
	...setupDeploymentRoutes,
	...setupDeploymentQueueRoutes,
	...setupDeploymentTypesRoutes,
	...setupDeploymentInstancesRoutes,
	...setupSubscribersRoutes
} as const

// Tipo dinámico que extrae todas las claves del serverRouter
export type ServerRouterEvents = keyof typeof serverRouter

// Tipo helper para el eventRouter con mejor tipado
// Esto proporciona autocompletado para todos los eventos disponibles en serverRouter
export type EventRouter = <T extends ServerRouterEvents>(
	event: T,
	data: any,
	callback: (data: { success: boolean } & Record<string, any>) => void
) => void

/**
 * Interfaz principal para los datos que reciben las rutas de Socket.IO
 *
 * @example
 * // En un archivo de rutas, cuando uses eventRouter tendrás autocompletado:
 * export const setupExampleRoutes = {
 *   'example:action': async ({ eventRouter, data, callback }: SocketData) => {
 *     // eventRouter ahora tiene tipado dinámico para todos los eventos disponibles
 *     eventRouter('auth:login', { email: 'test', password: 'test' }, callback)
 *     eventRouter('subscribe:join', { room: 'test' }, callback)
 *     // Y muchos más eventos con autocompletado...
 *   }
 * }
 */
export interface SocketData {
	io: Server
	socket: Required<AuthenticatedSocket>
	data: any
	callback: (data: { success: boolean } & Record<string, any>) => void
	eventRouter: EventRouter
}

export class SocketRoutes {
	private io: Server | undefined

	init(io: Server) {
		this.io = io
		this.setupRoutes()
		this.listenToWorkerEvents()
	}

	/**
	 * Sets up Socket.IO event routes for handling client connections.
	 *
	 * - Registers a connection handler that logs when a client connects or disconnects.
	 * - Applies middleware to each socket to validate the presence of a user ID and execute route logic.
	 * - Handles errors during route execution and passes them to the next middleware.
	 *
	 * @private
	 */
	private listenToWorkerEvents() {
		workerManager.on('worker:request', ({ route, data, callback }) => {
			this.execRoute({ event: route as ServerRouterEvents, data, callback })
		})
		workerManager.on('worker:error', ({ workflowId }) => {
			const event = `worker:status:${workflowId}`
			this.execRoute({
				event: 'subscribe:emit',
				data: {
					event,
					eventData: { success: true, workers: [] }
				},
				callback: (data: any) => console.log(data)
			})
		})
		workerManager.on('worker:exit', ({ workflowId }) => {
			const event = `worker:status:${workflowId}`
			this.execRoute({
				event: 'subscribe:emit',
				data: {
					event,
					eventData: { success: true, workers: [] }
				},
				callback: (data: any) => console.log(data)
			})
		})
		workerManager.on('worker:ready', (workerInfo) => {
			const event = `worker:status:${workerInfo.workflowId}`
			this.execRoute({
				event: 'subscribe:emit',
				data: {
					event,
					eventData: { success: true, workers: [workerInfo] }
				},
				callback: (data: any) => console.log(data)
			})
		})
	}

	/**
	 * Executes a server route based on the provided event name, socket, and data.
	 *
	 * @param socket - The authenticated socket instance associated with the request.
	 * @param event - The name of the event or route to execute.
	 * @param data - The payload data to pass to the route handler.
	 * @param callback - A callback function to send the result back to the client. Receives an object with a `success` boolean and additional properties.
	 *
	 * @throws {Error} If the socket does not have permission to execute the event or if the event handler is not found.
	 *
	 * @remarks
	 * - Certain events can bypass permission checks as defined in `bypassPermissions`.
	 * - Logs tracking information if `envs.TRACKING_ROUTE` is enabled.
	 * - Invokes the corresponding handler from `serverRouter` if found.
	 */
	private execRoute({
		socket,
		event,
		data,
		callback
	}: {
		socket?: AuthenticatedSocket
		event: ServerRouterEvents
		data: any
		callback: (data: { success: boolean } & Record<string, any>) => void
	}) {
		// Verificar si existe el método en el router
		if (!(event in serverRouter)) {
			if (envs.TRACKING_ROUTE) console.log('[TRACKING_ROUTE]', 'No se encontró el método', event)
			throw new Error(`No se encontró el método ${event}`)
		}
		// Registrar el método en el router
		if (envs.TRACKING_ROUTE) console.log('[TRACKING_ROUTE]', event, typeof data === 'object' ? JSON.stringify(data) : data)

		// Ejecutar el método en el router (usamos type assertion después de validar que existe)
		const routeHandler = (serverRouter as Record<string, any>)[event]
		routeHandler({
			io: this.io,
			socket,
			data,
			callback,
			eventRouter: (<T extends ServerRouterEvents>(
				event: T,
				data: any,
				callback: (data: { success: boolean } & Record<string, any>) => void
			) => {
				this.execRoute({ socket, event, data, callback })
			}) as EventRouter
		})
	}

	/**
	 * Sets up Socket.IO event routes for handling client connections.
	 *
	 * - Registers a connection handler that logs when a client connects or disconnects.
	 * - Applies middleware to each socket to validate the presence of a user ID and execute route logic.
	 * - Handles errors during route execution and passes them to the next middleware.
	 *
	 * @private
	 */
	private setupRoutes() {
		if (!this.io) return
		this.io.on('connection', (socket: AuthenticatedSocket) => {
			console.log('Cliente conectado:', socket.id)

			socket.use(([event, ...args], next) => {
				const data = args.length >= 1 ? args[0] : {}
				const callback = args.length > 1 ? args[args.length - 1] : () => {}

				if (!socket.userId) {
					next(new Error('No se encontró el usuario'))
				}

				try {
					// Verificar si el usuario tiene permisos para ejecutar el evento
					const bypassPermissions = ['auth:me', 'auth:login', /^subscribe:\w+$/]
					if (!verifyPermission(socket as Required<AuthenticatedSocket>, event, bypassPermissions)) {
						if (callback && typeof callback === 'function') {
							callback({ success: false, message: `No cumple permisos para ejecutar el método ${event}` })
						}
						throw new Error(`No cumple permisos para ejecutar el método ${event}`)
					}
					this.execRoute({ socket, event: event as ServerRouterEvents, data, callback })
					next()
				} catch (error: any) {
					next(error)
				}
			})

			socket.on('disconnect', () => {
				console.log('Cliente desconectado:', socket.id)
			})
		})
	}
}

export const socketRoutes = new SocketRoutes()
