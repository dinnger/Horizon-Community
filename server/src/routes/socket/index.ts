import type { Server } from 'socket.io'
import type { Socket } from 'socket.io'
import type { User, Role, Permission } from '../../models/index.js'
import { envs } from '../../config/envs.js'
import { setupAuthRoutes } from './auth.js'
import { setupWorkspaceRoutes } from './workspaces.js'
import { setupProjectRoutes } from './projects.js'
import { setupWorkflowRoutes } from './workflows.js'
import { setupWorkflowHistoryRoutes } from './workflowHistory.js'
import { setupSettingsRoutes } from './settings.js'
import { setupAdminRoutes } from './admin.js'
import { setupNodeRoutes } from './nodes.js'
import { setupWorkersListeners, setupWorkersRoutes } from './workers.js'
import { setupWorkerRoutes } from './worker.js'
import { setupDeploymentInstancesRoutes } from './deploymentsInstances.js'
import { setupDeploymentTypesRoutes } from './deploymentsTypes.js'
import { setupDeploymentRoutes } from './deployments.js'
import { setupDeploymentQueueRoutes } from './deploymentQueue.js'
import { verifyPermission } from '../../middleware/permissions.js'
import { setupSubscribersRoutes } from './subscribers.js'
import NodeCache from 'node-cache'
import { setupCredentialsRoutes } from './credentials.js'

export interface AuthenticatedSocket extends Socket {
	userId?: string
	user?: User & {
		roleId?: string
		permissions?: Permission[]
	}
}

export const cacheRouter = new NodeCache({ stdTTL: 100, checkperiod: 120 })

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
	...setupSubscribersRoutes,
	...setupCredentialsRoutes
} as const

export const serverListeners = [setupWorkersListeners]

// Tipo dinámico que extrae todas las claves del serverRouter
export type ServerRouterEvents = keyof typeof serverRouter

// Tipo helper para el eventRouter con mejor tipado
// Esto proporciona autocompletado para todos los eventos disponibles en serverRouter
export type EventRouter = <T extends ServerRouterEvents>(
	event: T,
	data: any,
	callback: (data: { success: boolean } & Record<string, any>) => void
) => void

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
		this.setupListeners()
	}

	setupListeners() {
		for (const listener of serverListeners) {
			listener(this.execRoute.bind(this))
		}
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

			const req = socket.request as any
			socket.userId = req.session?.passport?.user?.userId
			socket.user = req.session?.passport?.user

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
