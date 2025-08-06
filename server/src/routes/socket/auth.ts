import { cacheRouter, type SocketData } from './index.js'
import bcrypt from 'bcrypt'
import { User, Role, Permission, UserSettings } from '../../models/index.js'
import crypto from 'crypto'
import { envs } from '@server/src/config/envs.js'

function generateHash(key: string, key2?: string) {
	const hash1 = crypto
		.createHmac('sha256', envs.SECURITY_TOKEN || '')
		.update(key)
		.digest('base64')
	if (!key2) return hash1
	const hash2 = crypto
		.createHmac('sha256', envs.SECURITY_TOKEN || '')
		.update(key2)
		.digest('base64')
	return `${hash1}::${hash2}`
}

export const setupAuthRoutes = {
	// Authentication
	'auth:login': async ({ data, callback }: SocketData) => {
		try {
			const { email, password } = data
			const user = await User.findOne({
				where: { email, status: 'active' },
				include: [
					{
						model: Role,
						as: 'role'
					}
				]
			})

			if (user && (await bcrypt.compare(password, user.password))) {
				// Update last login
				await user.update({ lastLoginAt: new Date() })

				const userWithRole = user as User & {
					settings?: UserSettings
					role?: Role
				}

				const hash = generateHash(user.id, `${user.id}:${userWithRole.role?.id}:${user.password}`)
				const userResponse = {
					userId: user.id,
					hash
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
			const { userId, hash } = data

			if (cacheRouter.get(`auth:check-permission:${userId}:${hash}`)) {
				callback({ success: true, response: cacheRouter.get(`auth:check-permission:${userId}:${hash}`) })
				return
			}

			if (generateHash(userId) !== hash.split('::')[0]) {
				callback({ success: false, message: 'Credenciales incorrectas' })
				return
			}

			const user = await User.findOne({
				include: [
					{
						model: UserSettings,
						as: 'settings'
					},
					{
						model: Role,
						as: 'role',
						where: { status: 'active' },
						include: [
							{
								attributes: ['id', 'module', 'action'],
								model: Permission,
								as: 'permissions',
								through: {
									where: { granted: true },
									attributes: []
								},
								required: false
							}
						]
					}
				],
				where: { id: userId, status: 'active' }
			})

			if (!user) {
				callback({ success: false, message: 'Credenciales incorrectas' })
				return
			}

			const userWithRole = user as User & {
				settings?: UserSettings
				role?: Role & { permissions?: Permission[] }
			}

			const hashGenerated = generateHash(user.id, `${user.id}:${userWithRole.role?.id}:${user.password}`)
			if (hash !== hashGenerated) {
				callback({ success: false, message: 'Credenciales incorrectas' })
				return
			}

			const permissions = user && userWithRole.role?.permissions ? userWithRole.role.permissions : []

			const response = {
				userId: user.id,
				name: user.name,
				avatar: user.avatar,
				roleId: userWithRole.role?.id,
				settings: userWithRole.settings,
				permissions
			}

			// Cache permissions
			cacheRouter.set(`auth:check-permission:${userId}:${hash}`, response)

			if (permissions.length === 0) return callback({ success: false })

			callback({ success: true, response })
		} catch (error) {
			console.error('Error verificando permisos:', error)
			callback({ success: false, hasPermission: false })
		}
	},

	// Get current user info (requires authentication)
	'auth:me': async ({ socket, callback }: SocketData) => {
		try {
			const userResponse = {
				userId: socket.user.userId,
				name: socket.user.name,
				avatar: socket.user.avatar,
				// role: socket.user.role,
				permissions: socket.user.permissions || []
			}
			if (!socket.user?.userId) return callback({ success: false, message: 'No se encontró el usuario' })
			callback({ success: true, user: userResponse })
		} catch (error:any) {
			console.error('Error obteniendo usuario actual:', error.toString())
			callback({ success: false, message: 'Error interno del servidor' })
		}
	}
}
