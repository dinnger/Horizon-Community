import type { IProjectTransportConfigByType, IWorkflowInfo, IWorkflowProperties } from './standardized'

export interface IContextWorkerInterface {
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
	onCustomEvent?: (eventName: string, callback: (...args: any[]) => any) => any
}

export interface IContextClientInterface {
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
