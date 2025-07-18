import { UserSettings } from '../../models/index.js'
import type { SocketData } from './index.js'

export const setupSettingsRoutes = {
	// Get user settings - requires read permission
	'settings:get': async ({ socket, data, callback }: SocketData) => {
		try {
			const { userId = socket.userId } = data

			// Users can only see their own settings unless they are admin
			const targetUserId = socket.user?.role?.name === 'SuperAdmin' ? userId : socket.userId

			const settings = await UserSettings.findOne({
				where: { userId: targetUserId }
			})
			callback({ success: true, settings })
		} catch (error) {
			console.error('Error obteniendo configuraciones:', error)
			callback({
				success: false,
				message: 'Error al cargar configuraciones'
			})
		}
	},

	// Update user settings - requires update permission
	'settings:update': async ({ socket, data, callback }: SocketData) => {
		try {
			const { userId = socket.userId, ...updates } = data

			// Users can only update their own settings unless they are admin
			const targetUserId = socket.user?.role?.name === 'SuperAdmin' ? userId : socket.userId

			const [settings] = await UserSettings.upsert({
				userId: targetUserId,
				...updates
			})

			callback({ success: true, settings })
		} catch (error) {
			console.error('Error actualizando configuraciones:', error)
			callback({
				success: false,
				message: 'Error al actualizar configuraciones'
			})
		}
	}
}
