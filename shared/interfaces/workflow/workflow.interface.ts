import type { INodeFull, INodeConnection, INodeWorker } from '../node/node.interface.js'
import type { IProjectBase } from '../standardized.js'
import type { IPropertiesType } from '../workflow.properties.interface.js'

/**
 * Información básica del workflow
 */
export interface IWorkflowInfo {
	uid: string
	name: string
	disabled?: boolean
}

/**
 * Propiedades del workflow
 */
export interface IWorkflowProperties {
	basic: {
		router: string
	}
	deploy: number | null
}

/**
 * Dependencias del workflow
 */
export interface IWorkflowDependencies {
	secrets: Set<{
		idNode: string
		type: string
		name: string
		secret: string
	}>
	credentials: Set<{
		idNode: string
		type: string
		name: string
		credentials: string[]
	}>
}

/**
 * Interfaz base para workflow
 */
export interface IWorkflowBase {
	version?: string
	project?: IProjectBase
	info: IWorkflowInfo
	properties: IWorkflowProperties
	environment: string[]
	secrets: string[]
}

export interface IWorkflowData {
	nodes: { [key: string]: INodeFull }
	connections: INodeConnection[]
	notes?: {
		id: string
		content: string
		color: string
		position: { x: number; y: number }
		size: { width: number; height: number }
		createdAt: string
		updatedAt: string
	}[]
	groups?: {
		id: string
		label: string
		color: string
		nodeIds: string[]
		position: { x: number; y: number }
		size: { width: number; height: number }
		createdAt: string
		updatedAt: string
	}[]
}

/**
 * Interfaz para workflow completo
 */
export interface IWorkflowFull extends IWorkflowBase, IWorkflowData {}

/**
 * Interfaz para workflow del worker
 */
export interface IWorkflowWorker extends IWorkflowBase {
	nodes: { [key: string]: INodeWorker }
	connections: INodeConnection[]
}

/**
 * Interfaz para workflow del cliente
 */
export interface IWorkflowClient extends IWorkflowBase {
	nodes: { [key: string]: INodeFull }
	connections: INodeConnection[]
}

/**
 * Interfaz para contexto de ejecución de workflow
 */
export interface IWorkflowExecutionContext {
	project?: IProjectBase
	info: IWorkflowInfo
	properties: IWorkflowProperties
	variables?: string[]
	secrets?: string[]
	currentNode: {
		id: string
		name: string
		type: string
		meta?: object
	} | null
	onCustomEvent?: (eventName: string, callback: (...args: any[]) => any) => any
}

/**
 * Interfaz para ejecución de workflow
 */
export interface IWorkflowExecution {
	isTest: boolean
	getNodeById: (id: string) => INodeWorker | null
	getNodeByType: (type: string) => {
		node: INodeWorker
		meta?: { [key: string]: any }
		data: object
	} | null
	getNodesInputs: (idNode: string) => Set<string> | null
	getNodesOutputs: (idNode: string) => Set<string> | null
	getExecuteData: () => Map<string, { data: object; meta?: object; time: number }>
	setExecuteData: (data: Map<string, { data: object; meta?: object; time: number }>) => void
	setGlobalData: ({ type, key, value }: { type: string; key: string; value: any }) => void
	getGlobalData: ({ type, key }: { type: string; key: string }) => any
	deleteGlobalData: ({ type, key }: { type: string; key: string }) => void
	ifExecute: () => boolean
	stop: () => void
}

/**
 * Interfaz para workflow del servidor
 */
export interface IWorkflowServer extends IWorkflowBase {
	id: string
	projectId: string
	version: string
	status: 'active' | 'inactive' | 'draft'
	createdAt: Date
	updatedAt: Date
	nodes: { [key: string]: INodeFull }
	connections: INodeConnection[]
}

/**
 * Interfaz para crear workflow
 */
export interface IWorkflowCreate extends Omit<IWorkflowServer, 'id' | 'createdAt' | 'updatedAt'> {
	id?: string
	createdAt?: Date
	updatedAt?: Date
}

/**
 * Interfaz para actualizar workflow
 */
export interface IWorkflowUpdate extends Partial<Omit<IWorkflowServer, 'id' | 'createdAt' | 'updatedAt'>> {
	updatedAt?: Date
}

/**
 * Interfaz legacy para compatibilidad - será depreciada
 * @deprecated Usar IWorkflowFull en su lugar
 */
export interface IWorkflow extends IWorkflowFull {}

/**
 * Interfaz legacy para compatibilidad - será depreciada
 * @deprecated Usar IWorkflowExecutionContext en su lugar
 */
export interface IWorkflowExecutionContextInterface extends IWorkflowExecutionContext {}

/**
 * Interfaz legacy para compatibilidad - será depreciada
 * @deprecated Usar IWorkflowExecution en su lugar
 */
export interface IWorkflowExecutionInterface extends IWorkflowExecution {}

/**
 * Interfaz legacy para compatibilidad - será depreciada
 * @deprecated Usar IWorkflowClient en su lugar
 */
export interface Workflow extends IWorkflowClient {}
