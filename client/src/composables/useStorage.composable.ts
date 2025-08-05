import socketService from '@/services/socket'
import type { SocketData } from '@/types/socket'
import type { infoInterface, IPropertiesType } from '@shared/interfaces'

export function useStorageComposable() {
	const getCredentialsList = async (): Promise<{ name: string; info: infoInterface }[]> => {
		return socketService.storage().getCredentialsList()
	}

	const getCredentialsProperties = async (name: string): Promise<IPropertiesType> => {
		return socketService.storage().getCredentialsProperties(name)
	}

	const getStorages = async ({ type }: { type: string }) => {
		return await socketService.storage().getStorageList({ type })
	}

	const createStorage = async (data: {
		name: string
		description?: string
		type: 'file' | 'credential' | 'other'
		nodeType?: string
		properties: Record<string, any>
		data?: Record<string, any>
	}) => {
		try {
			const result = await socketService.storage().createStorage(data)
			return { success: true, storage: result.storage }
		} catch (error) {
			console.error('Error creando storage:', error)
			return { success: false, message: 'Error al crear storage', storage: null }
		}
	}
	return {
		getCredentialsList,
		getCredentialsProperties,
		getStorages,
		createStorage
	}
}
