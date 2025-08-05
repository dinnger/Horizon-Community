import type { Socket } from 'socket.io-client'

export function socketSettings(socket: Socket | null) {
	return {
		getUserSettings(): Promise<any> {
			return new Promise((resolve, reject) => {
				if (!socket) {
					reject(new Error('Socket not connected'))
					return
				}
				socket.emit('settings:get', {}, (response: any) => {
					if (response.success) {
						resolve(response.settings)
					} else {
						reject(new Error(response.message || 'Failed to get settings'))
					}
				})
			})
		},

		updateUserSettings(settings: any): Promise<any> {
			return new Promise((resolve, reject) => {
				if (!socket) {
					reject(new Error('Socket not connected'))
					return
				}
				socket.emit('settings:update', settings, (response: any) => {
					if (response.success) {
						resolve(response)
					} else {
						reject(new Error(response.message || 'Failed to update settings'))
					}
				})
			})
		}
	}
}
