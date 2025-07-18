/**
 * Worker Routes
 */

import type { SocketData } from './index.js'

export const setupWorkerRoutes = {
	// List all active workers - requires admin permission
	'worker:environment': async ({ socket, data, callback }: SocketData) => {
		try {
			const envs = process.env
			callback({ success: true, envs })
		} catch (error) {
			console.error('Error listando workers:', error)
			callback({ success: false, message: 'Error al cargar workers' })
		}
	},

	'worker:animations': async ({ io, data, callback }: SocketData) => {
		try {
			const animations = data.animations
			io.to(`workflow:${data.workflowId}`).emit('worker:animations', animations)
			callback({ success: true, message: 'Animaciones enviadas' })
		} catch (error) {
			console.error('Error enviando animaciones:', error)
			callback({ success: false, message: 'Error enviando animaciones' })
		}
	}
}
