import type { SocketData } from './index.js'
import bcrypt from 'bcrypt'
import { User, Role, Permission, UserSettings } from '../../models/index.js'

export const setupAuthRoutes = {
	// Authentication
	'auth:login': async ({ data, callback }: SocketData) => {
		try {
			const { email, password } = data
			const user = await User.findOne({
				where: { email, status: 'active' },
				include: [
					{
						model: UserSettings,
						as: 'settings'
					},
					{
						model: Role,
						as: 'role',
						include: [
							{
								model: Permission,
								as: 'permissions',
								through: {
									where: { granted: true },
									attributes: []
								}
							}
						]
					}
				]
			})

			if (user && (await bcrypt.compare(password, user.password))) {
				// Update last login
				await user.update({ lastLoginAt: new Date() })

				const userWithRole = user as User & {
					settings?: UserSettings
					role?: Role & { permissions?: Permission[] }
				}

				const userResponse = {
					id: user.id,
					name: user.name,
					avatar: user.avatar,
					role: userWithRole.role,
					settings: userWithRole.settings
				}

				callback({ success: true, user: userResponse })
			} else {
				callback({ success: false, message: 'Credenciales inválidas' })
			}
		} catch (error) {
			console.error('Error en login:', error)
			callback({ success: false, message: 'Error interno del servidor' })
		}
	},

	// Permission check helper
	'auth:check-permission': async ({ data, callback }: SocketData) => {
		try {
			const { userId, module, action } = data
			const user = await User.findByPk(userId, {
				include: [
					{
						model: Role,
						as: 'role',
						include: [
							{
								model: Permission,
								as: 'permissions',
								where: { module, action, status: 'active' },
								through: {
									where: { granted: true },
									attributes: []
								},
								required: false
							}
						]
					}
				]
			})

			const userWithRole = user as User & {
				role?: Role & { permissions?: Permission[] }
			}
			const hasPermission = user && userWithRole.role?.permissions && userWithRole.role.permissions.length > 0

			callback({ success: true, hasPermission })
		} catch (error) {
			console.error('Error verificando permisos:', error)
			callback({ success: false, hasPermission: false })
		}
	},

	// Get current user info (requires authentication)
	'auth:me': async ({ socket, callback }: SocketData) => {
		try {
			const userResponse = {
				id: socket.user.id,
				email: socket.user.email,
				name: socket.user.name,
				avatar: socket.user.avatar,
				// role: socket.user.role,
				permissions: socket.user.role?.permissions || []
			}

			callback({ success: true, user: userResponse })
		} catch (error) {
			console.error('Error obteniendo usuario actual:', error)
			callback({ success: false, message: 'Error interno del servidor' })
		}
	}
}
