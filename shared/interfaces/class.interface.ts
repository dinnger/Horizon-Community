import type { Express } from 'express'
import type { IPropertiesType } from './workflow.properties.interface.js'
import type { IClientActionResponse, IClientService } from './client.interface.js'
import type { IClientContext, IClientCredentialContext, IWorkerContext } from './context.interface.js'
import type { IWorkflowExecutionInterface } from '@worker/modules/workflow/index.js'
import type { INodeConnectors, INodeMeta } from './standardized.js'

export interface classBaseEnvironmentInterface {
	baseUrl: string
	serverUrl: string
	isDev: boolean
	isSubFlow: boolean
	subFlowBase: string
	subFlowParent: string
}

export interface classDependencyInterface {
	getRequire: (name: string) => Promise<any>
	getSecret: ({ type, subType, name }: { type: string; subType?: string; name?: string }) => Promise<any>
	listSecrets: ({ type, subType }: { type: string; subType?: string }) => Promise<any>
}

export interface classCredentialInterface {
	getCredential: (name: string) => any
}

export interface classOnUpdateInterface<T extends IPropertiesType = IPropertiesType> {
	context: IClientContext
	properties: T
	connectors: INodeConnectors
}

export interface classOnUpdateCredentialInterface<T extends IPropertiesType = IPropertiesType> {
	context: IClientCredentialContext
	properties: T
}

export interface classOnActionsInterface {
	dependency: classDependencyInterface
}

export interface classOnExecuteInterface {
	app: Express
	context: IWorkerContext
	execute: IWorkflowExecutionInterface
	logger: {
		info: (...args: unknown[]) => void
		error: (...args: unknown[]) => void
	}
	environment: classBaseEnvironmentInterface
	dependency: classDependencyInterface
	inputData: { idNode: string; inputName: string; data: object }
	outputData: (outputName: string, data: object, meta?: object) => void
	credential: classCredentialInterface
}

export interface classOnCredential<T extends IPropertiesType = IPropertiesType> {
	action: string
	credentials: T
	dependency: classDependencyInterface
	client: IClientService
}

export type IClassOnCredentialResponse = Promise<IClientActionResponse>

/**
 * Represents the information about a plugin.
 *
 * @interface infoInterface
 * @property {string} title - The title of the plugin.
 * @property {string} desc - The description of the plugin.
 * @property {string} icon - The icon associated with the plugin.
 * @property {string} group - The group to which the plugin belongs.
 * @property {string} color - The color associated with the plugin.
 * @property {boolean} [isTrigger] - Indicates if the plugin is a trigger.
 * @property {boolean} [isSingleton] - Indicates if the plugin maintains a single instance of execution per input.
 * @property {string[]} inputs - The list of input connections for the plugin.
 * @property {string[]} outputs - The list of output connections for the plugin.
 */
export interface infoInterface {
	name: string
	desc: string
	icon: string
	group: string
	color: string
	/**
		Si es true, el nodo reinicia las ejecuciones y la información de los nodos siguientes
	*/
	isTrigger?: boolean
	/**
		Si es true, significa que el nodo mantiene una instancia de ejecución por cada entrada
	*/
	isSingleton?: boolean

	connectors: INodeConnectors
}

/**
 * Interface representing a class node with configurable properties and credentials.
 * The types of properties and credentials are inferred from the actual implementation.
 */
export interface IClassNode {
	/**
	 * Determines if the node can access secrets
	 */
	accessSecrets?: boolean

	/**
	 * List of dependency identifiers required by this node
	 */
	dependencies?: string[]

	/**
	 * Information about the node
	 */
	info: infoInterface

	/**
	 * Configuration properties for the node.
	 * These define the node's behavior and settings.
	 */
	properties: IPropertiesType

	/**
	 * Authentication credentials required by the node
	 */
	credentials?: IPropertiesType

	/**
	 * Additional metadata for the node
	 */
	meta?: INodeMeta

	/**
	 * Action handlers mapped by action names
	 */
	onAction?(o: classOnActionsInterface): Promise<{
		[key: string]: () => Promise<any>
	}>

	/**
	 * Lifecycle method called when the node is deployed
	 */
	onDeploy?(): void

	/**
	 * Lifecycle method called when the node is updated
	 * @param o - Execution context and parameters
	 */
	onUpdateProperties?(o: classOnUpdateInterface<this['properties']>): void

	/**
	 * Lifecycle method called when the node is executed
	 * @param o - Execution context and parameters
	 * @returns A promise that resolves when execution is complete
	 */
	onExecute(o: classOnExecuteInterface): Promise<void>

	/**
	 * Lifecycle method called when the node is updated
	 * @param o - Execution context and parameters
	 */
	onUpdateCredential?(o: classOnUpdateCredentialInterface<NonNullable<this['credentials']>>): void

	/**
	 * Lifecycle method called for credential handling
	 * @param o - Credential context and parameters
	 * @returns A promise that resolves with credential processing results
	 */
	onCredential?(o: classOnCredential<NonNullable<this['credentials']>>): Promise<{ status: boolean; data: any }>

	/**
	 * Lifecycle method called when the node is destroyed
	 */
	onDestroy?(): void
}

export interface newClassInterface extends Omit<IClassNode, 'onExecute'> {
	type: string
	group?: string | string[]
	dependencies?: string[]
	class: IClassNode
}
