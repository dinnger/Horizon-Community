import { socketService } from '@/services/socket'
import type { IClientContext, IClientCredentialContext } from '@shared/interfaces'

export const getClientContext = (contextComposable: any): IClientContext => {
	return {
		...contextComposable,
		createWebhookCallback: () => new Date(),
		getEnvironment: (key: string) => {
			const envMap: Record<string, string> = {
				serverUrl: import.meta.env.VITE_SERVER_URL || '',
				baseUrl: '/'
			}
			return envMap[key] || ''
		}
	}
}

export const getClientCredentialContext = (): IClientCredentialContext => {
	console.log('getClientCredentialContext called', socketService.getSocket()?.id)
	return {
		environments: {
			serverUrl: import.meta.env.VITE_SERVER_URL || '',
			baseUrl: '/',
			callback: `${import.meta.env.VITE_SERVER_URL || ''}/api/external/callback/${socketService.getSocket()?.id || ''}`
		}
	}
}
