import type { IRole } from './standardized'
import type { StatusType } from './status.interface'

export interface IDeployment {
	id: string
	name: string
	description: string
	color: string
	status: StatusType
	createdAt: Date
	updatedAt: Date

	instances?: IDeploymentInstance[]
}

export interface IDeploymentInstance {
	id: string
	name: string
	description: string
	versionChange: 'none' | 'patch' | 'minor' | 'major'
	// Solo para el cliente
	deployType: string // Viene del listado de deploy.store.ts
	deployTypeConfiguration: Record<string, any> // Configuración específica del tipo de deploy
	roles: IRole[]

	status: StatusType
	predecessors: string[] // Array de IDs de instancias predecesoras
	autoApprove: boolean // Indica si la instancia se auto-aprueba automáticamente
	executionOrder: number // Orden de ejecución de la instancia (0 = primera)
	createdAt: Date
	updatedAt: Date
}

export interface IDeploymentInstanceAssignment {
	id: string
	deploymentId: string
	instanceId: string
	deployType: string
	assignedAt: Date
	assignedBy: string
	status: StatusType
	priority: number
	executionOrder: number // Orden de ejecución en el deployment
	autoApprove: boolean // Auto-aprobación automática para esta asignación
	configuration?: Record<string, any>
	createdAt: Date
	updatedAt: Date
}

export interface IDeploymentQueue {
	id: string
	deploymentId: string
	instanceId?: string // ID de la instancia específica donde se desplegará
	workflowId: string
	workflowVersionId?: string
	description: string
	flow: IWorkflowFull
	meta: {
		path?: string
		version?: string
		trigger?: string
		requestedBy?: string
		deploymentConfig?: Record<string, any>
	}
	status: StatusType
	requestedBy?: string
	scheduledAt?: Date
	startedAt?: Date
	completedAt?: Date
	errorMessage?: string
	deploymentResult?: Record<string, any>
	createdAt: Date
	updatedAt: Date

	// Relaciones opcionales para el frontend
	deployment?: IDeployment
	instance?: IDeploymentInstance // Nueva relación con instancia
	workflow?: any // Workflow simplificado
	requestedByUser?: {
		id: string
		name: string
		email: string
	}
}

import type { IWorkflowFull } from './standardized.js'

import type { IPropertiesType } from './workflow.properties.interface.js'

export interface classOnExecuteInterface {
	context: {
		path: string
		flow: string
	}
}

export interface infoInterface {
	title: string
	desc: string
	icon: string
}

export interface classDeployInterface {
	info: infoInterface
	properties: IPropertiesType
	meta?: { [key: string]: any }
	onExecute(o: classOnExecuteInterface): Promise<void>
}

export interface newClassDeployInterface extends Omit<classDeployInterface, 'onExecute'> {
	name: string
	class: classDeployInterface
}

export interface IDeploymentType extends Omit<classDeployInterface, 'onExecute'> {
	name: string
}
