import { useWorkspaceStore } from '@/stores'
import type { SocketData } from '@/types/socket'
import type { infoInterface, IPropertiesType } from '@shared/interfaces'
import type { Socket } from 'socket.io-client'

export function socketStorage(socket: Socket | null) {
	const workspaceStore = useWorkspaceStore()
	const workspaceId = workspaceStore.currentWorkspaceId

	// Setup listener for credential URL opening
	if (socket) {
		socket.on('credential:open-url', async (data: { token: string }) => {
			// Open URL in a new window/tab
			const serverUrl = import.meta.env.VITE_SERVER_URL
			window.open(
				`${serverUrl}/api/external/credentials/open?token=${data.token}`,
				'credential-auth',
				'width=600,height=700,scrollbars=yes,resizable=yes'
			)
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
		// Creación de storage
		createStorage(data: {
			name: string
			description?: string
			type: 'file' | 'credential' | 'other'
			nodeType?: string
			properties: Record<string, any>
			data?: Record<string, any>
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
