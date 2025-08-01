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
	return {
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
