import type {
	IProjectTransportConfig,
	IProjectTransportConfigByType,
	IProjectTransportType,
	IWorkflowInfo,
	IWorkflowProperties
} from './standardized'

export interface IWorkflowExecutionProject {
	type: string
	config: { [key: string]: any }
}

export interface IWorkflowExecutionContextInterface {
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
