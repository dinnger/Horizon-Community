import type { infoInterface, IPropertiesType } from '@shared/interfaces'
import type { Socket } from 'socket.io-client'

export function socketCredentials(socket: Socket | null) {
	return {
		list(): Promise<{ name: string; info: infoInterface }[]> {
			return new Promise((resolve, reject) => {
				if (!socket) return reject(new Error('Socket not connected'))

				socket.emit('credentials:list', {}, (response: any) => {
					if (response.success) {
						return resolve(response.credentials)
					}
					return reject(new Error(response.message || 'Failed to get credentials list'))
				})
			})
		},
		getCredentialsProperties(node: string): Promise<IPropertiesType> {
			return new Promise((resolve, reject) => {
				if (!socket) return reject(new Error('Socket not connected'))

				socket.emit('credentials:get', { node }, (response: any) => {
					if (response.success) {
						return resolve(response.credentials)
					}
					return reject(new Error(response.message || 'Failed to get credentials properties'))
				})
			})
		}
	}
}
