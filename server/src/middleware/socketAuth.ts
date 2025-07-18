import type { Socket } from 'socket.io'
import { User, Role, Permission } from '../models/index.js'

export interface AuthenticatedSocket extends Socket {
	userId?: string
	user?: User & {
		role?: Role & { permissions?: Permission[] }
	}
}

export interface SocketAuthData {
	token?: string
	userId?: string
}

// Store authenticated users in memory (in production, use Redis or similar)
const authenticatedUsers = new Map<string, string>() // socketId -> userId

export const socketAuthMiddleware = async (socket: AuthenticatedSocket, next: (err?: Error) => void) => {
	try {
		const { token, userId } = socket.handshake.auth as SocketAuthData

		// Allow connection without authentication initially
		// Individual routes will check authentication as needed
		if (!userId) {
			socket.userId = undefined
			socket.user = undefined
			return next()
		}

		// Verify user exists and is active
		const user = await User.findOne({
			where: { id: userId, status: 'active' },
			include: [
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

		if (!user) {
			socket.userId = undefined
			socket.user = undefined
			return next()
		}

		// Attach user info to socket
		socket.userId = userId
		socket.user = user as User & {
			role?: Role & { permissions?: Permission[] }
		}

		// Store in authenticated users map
		authenticatedUsers.set(socket.id, userId)

		// Clean up on disconnect
		socket.on('disconnect', () => {
			authenticatedUsers.delete(socket.id)
		})

		next()
	} catch (error) {
		console.error('Socket authentication error:', error)
		// Don't block connection, but don't authenticate
		socket.userId = undefined
		socket.user = undefined
		next()
	}
}

export const requireAuth = (socket: AuthenticatedSocket, next: (err?: Error) => void) => {
	if (!socket.userId || !socket.user) {
		return next(new Error('Authentication required'))
	}
	next()
}

export const requirePermission = (module: string, action: string) => {
	return (socket: AuthenticatedSocket, next: (err?: Error) => void) => {
		if (!socket.user?.role?.permissions) {
			return next(new Error('Insufficient permissions'))
		}

		const hasPermission = socket.user.role.permissions.some((permission) => permission.module === module && permission.action === action)

		if (!hasPermission) {
			return next(new Error(`Permission denied: ${module}.${action}`))
		}

		next()
	}
}

export const getAuthenticatedUsers = () => authenticatedUsers
