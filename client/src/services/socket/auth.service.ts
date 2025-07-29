import type { LoginResponse, PermissionCheckResponse, User } from '@/types/socket'
import type { Socket } from 'socket.io-client'

export function socketAuth(socket: Socket | null) {
	return {
		login(email: string, password: string): Promise<LoginResponse> {
			return new Promise((resolve, reject) => {
				console.log('socket', socket)
				if (!socket) return reject(new Error('Socket not connected'))

				socket.emit('auth:login', { email, password }, (response: LoginResponse) => {
					if (response.success) {
						resolve(response)
					} else {
						reject(new Error(response.message || 'Login failed'))
					}
				})
			})
		},

		getCurrentUser(): Promise<User & { socketId: string }> {
			return new Promise((resolve, reject) => {
				if (!socket) {
					reject(new Error('Socket not connected'))
					return
				}

				socket.emit('auth:me', (response: { success: boolean; user?: User; message?: string }) => {
					if (response.success && response.user) {
						resolve({ ...response.user, socketId: socket?.id || '' })
					} else {
						reject(new Error(response.message || 'Failed to get user info'))
					}
				})
			})
		}
	}
}
