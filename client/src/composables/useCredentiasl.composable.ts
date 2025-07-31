import socketService from '@/services/socket'
import type { infoInterface, IPropertiesType } from '@shared/interfaces'

export function useCredentialsComposable() {
	const list = async (): Promise<{ name: string; info: infoInterface }[]> => {
		return socketService.credentials().list()
	}

	const getCredentialsProperties = async (name: string): Promise<IPropertiesType> => {
		return socketService.credentials().getCredentialsProperties(name)
	}

	return {
		list,
		getCredentialsProperties
	}
}
