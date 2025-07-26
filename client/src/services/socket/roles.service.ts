import type { Socket } from 'socket.io-client'
import type { IRole } from '@shared/interfaces/standardized'

export function socketRoles(socket: Socket | null) {
	return {
		getRoles(): Promise<IRole[]> {
			return new Promise((resolve, reject) => {
				if (!socket) {
					reject(new Error('Socket not connected'))
					return
				}
				socket.emit('roles:list', { maxLevelMe: true }, (response: any) => {
					if (response.success && response.roles) {
						resolve(response.roles)
					} else {
						reject(new Error(response.message || 'Failed to get roles'))
					}
				})
			})
		}
	}
}
