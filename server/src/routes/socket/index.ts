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

export const serverRouter: Record<string, any> = {
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
	...setupDeploymentInstancesRoutes
}

export interface SocketData {
	io: Server
	socket: Required<AuthenticatedSocket>
	data: any
	callback: (data: { success: boolean } & Record<string, any>) => void
}
export class SocketRoutes {
	private io: Server | undefined

	init(io: Server) {
		this.io = io
		this.setupRoutes()
	}

	private setupRoutes() {
		if (!this.io) return
		this.io.on('connection', (socket: AuthenticatedSocket) => {
			console.log('Cliente conectado:', socket.id)

			socket.use(([event, ...args], next) => {
				const data = args.length > 1 ? args[0] : {}
				const callback = args[args.length - 1]
				const ommitedPermissions = ['auth:me', 'auth:login', /^worker:/]

				if (!socket.userId) {
					next(new Error('No se encontró el usuario'))
				}

				if (!verifyPermission(socket as Required<AuthenticatedSocket>, event, ommitedPermissions)) {
					next(new Error(`No cumple permisos para ejecutar el método ${event}`))
					callback({ success: false, message: `No cumple permisos para ejecutar el método ${event}` })
					return
				}

				if (!serverRouter[event]) {
					if (envs.TRACKING_ROUTE) console.log('[TRACKING_ROUTE]', 'No se encontró el método', event)
					console.error(`No se encontró el método ${event}`)
					next(new Error(`No se encontró el método ${event}`))
					return
				}
				if (envs.TRACKING_ROUTE) console.log('[TRACKING_ROUTE]', event, typeof data === 'object' ? JSON.stringify(data) : data)
				serverRouter[event]({ io: this.io, socket, data, callback })
				next()
			})

			socket.on('disconnect', () => {
				console.log('Cliente desconectado:', socket.id)
			})
		})
	}
}

export const socketRoutes = new SocketRoutes()
