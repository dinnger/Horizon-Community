import type { classOnExecuteInterface, IConnectionModule } from '.'
import type { IProjectTransportConfigByType, IWorkflowInfo, IWorkflowProperties } from './standardized'

export interface IWorkerContext {
	project?: IProjectTransportConfigByType
	info: IWorkflowInfo
	properties: IWorkflowProperties
	currentNode: {
		id: string
		name: string
		type: string
		meta?: object
	} | null
	getEnvironment: (name: string) => any
	getSecrets: (name: string) => any
	getMicroserviceModule: ({ context, name }: { context: IWorkerContext; name: string }) => Promise<IConnectionModule>
	onCustomEvent?: (eventName: string, callback: (...args: any[]) => any) => any
}

export interface IWorkerDeployContext {
	project?: IProjectTransportConfigByType
	info: IWorkflowInfo
	path: string
	properties: IWorkflowProperties
	getEnvironment: (name: string) => any
	getSecrets: (name: string) => any
	onCustomEvent?: (eventName: string, callback: (...args: any[]) => any) => any
}

export interface IClientContext {
	project?: IProjectTransportConfigByType
	info: IWorkflowInfo
	properties: IWorkflowProperties
	currentNode: {
		id: string
		name: string
		type: string
		meta?: object
	} | null
	getEnvironment: (name: string) => any
	getSecrets: (name: string) => any
	createWebhookCallback?: () => Promise<string>
	onCustomEvent?: (eventName: string, callback: (...args: any[]) => any) => any
}

export interface IClientCredentialContext {
	environments: {
		serverUrl: string
		baseUrl: string
		callback: string
	}
}
