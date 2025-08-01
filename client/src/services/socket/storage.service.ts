import { useWorkspaceStore } from '@/stores'
import type { SocketData } from '@/types/socket'
import type { infoInterface, IPropertiesType } from '@shared/interfaces'
import type { Socket } from 'socket.io-client'

export function socketStorage(socket: Socket | null) {
	const workspaceStore = useWorkspaceStore()
	const workspaceId = workspaceStore.currentWorkspaceId

	// Setup listener for credential URL opening
	if (socket) {
		socket.on('credential:open-url', async (options: any, callback: (response: any) => void) => {
			try {
				// Open URL in a new window/tab
				const authWindow = window.open(
					`${options.uri}?${new URLSearchParams(options.queryParams).toString()}`,
					'credential-auth',
					'width=600,height=700,scrollbars=yes,resizable=yes'
				)

				if (!authWindow) {
					callback({
						success: false,
						message: 'No se pudo abrir la ventana de autenticación. Verifica que no esté bloqueada por el navegador.'
					})
					return
				}

				// Wait for the callback URL (usually contains authorization code)
				const checkClosed = setInterval(() => {
					if (authWindow.closed) {
						clearInterval(checkClosed)
						callback({
							success: false,
							message: 'La ventana de autenticación fue cerrada antes de completar el proceso'
						})
					}
				}, 1000)

				// Listen for postMessage from the auth window
				const messageListener = (event: MessageEvent) => {
					if (event.origin !== window.location.origin) return

					if (event.data.type === 'credential-callback') {
						clearInterval(checkClosed)
						authWindow.close()
						window.removeEventListener('message', messageListener)

						callback({
							success: true,
							data: event.data.data
						})
					}
				}

				window.addEventListener('message', messageListener)

				// Timeout after 5 minutes
				setTimeout(() => {
					clearInterval(checkClosed)
					if (!authWindow.closed) {
						authWindow.close()
					}
					window.removeEventListener('message', messageListener)
					callback({
						success: false,
						message: 'Timeout: El proceso de autenticación tardó demasiado tiempo'
					})
				}, 300000)
			} catch (error) {
				console.error('Error opening credential URL:', error)
				callback({
					success: false,
					message: 'Error al abrir la URL de credenciales'
				})
			}
		})
	}

	return {
		// =========================================================
		// CREDENTIALS METHODS
		// =========================================================
		getCredentialsList(): Promise<{ name: string; info: infoInterface }[]> {
			return new Promise((resolve, reject) => {
				if (!socket) return reject(new Error('Socket not connected'))

				socket.emit('storage-credentials:list', {}, (response: any) => {
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

				socket.emit('storage-credentials:get', { node }, (response: any) => {
					if (response.success) {
						return resolve(response.credentials)
					}
					return reject(new Error(response.message || 'Failed to get credentials properties'))
				})
			})
		},
		// =========================================================
		// STORAGE METHODS
		// =========================================================
		getStorageList({ type }: { type: string }): Promise<SocketData[]> {
			return new Promise((resolve, reject) => {
				if (!socket) return reject(new Error('Socket not connected'))

				socket.emit('storage:list', { workspaceId, type }, (response: any) => {
					if (response.success) {
						return resolve(response.storages)
					}
					return reject(new Error(response.message || 'Failed to get storage list'))
				})
			})
		},
		createStorage(data: {
			name: string
			description?: string
			type: 'file' | 'credential' | 'other'
			nodeType: string
			data: Record<string, any>
			metadata?: Record<string, any>
		}): Promise<any> {
			return new Promise((resolve, reject) => {
				if (!socket) return reject(new Error('Socket not connected'))

				socket.emit('storage:create', { workspaceId, ...data }, (response: any) => {
					if (response.success) {
						return resolve(response.storage)
					}
					return reject(new Error(response.message || 'Failed to create storage'))
				})
			})
		},
		getStorageById(storageId: string): Promise<any> {
			return new Promise((resolve, reject) => {
				if (!socket) return reject(new Error('Socket not connected'))

				socket.emit('storage:get', { id: storageId }, (response: any) => {
					if (response.success) {
						return resolve(response.storage)
					}
					return reject(new Error(response.message || 'Failed to get storage by ID'))
				})
			})
		}
	}
}
