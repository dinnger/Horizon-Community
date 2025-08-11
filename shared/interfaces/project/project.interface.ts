import type { StatusType } from '../status.interface.js'

/**
 * Configuración de transporte para proyectos
 */
export interface IProjectTransportConfig {
	// TCP
	host?: string
	port?: number
	maxRetries?: number

	// RabbitMQ
	url?: string
	exchange?: string
	queue?: string
	routingKey?: string

	// Kafka
	brokers?: string[]
	clientId?: string
	groupId?: string
	topic?: string

	// NATS
	subject?: string

	// HTTP/REST
	timeout?: number

	// Common
	username?: string
	password?: string
	ssl?: boolean
	retries?: number
	retryDelay?: number
}

/**
 * Tipos de transporte soportados
 */
export type IProjectTransportType = 'none' | 'tcp' | 'rabbitmq' | 'kafka' | 'nats' | 'http' | 'websocket' | 'mqtt'

/**
 * Configuración específica para cada tipo de transporte
 */
export interface ITcpTransportConfig {
	host: string
	port: number
	maxRetries?: number
	username?: string
	password?: string
	ssl?: boolean
	retries?: number
	retryDelay?: number
}

export interface IRabbitMqTransportConfig {
	amqpUrl: string
	exchange?: string
	queue?: string
	routingKey?: string
	username?: string
	password?: string
	ssl?: boolean
	maxRetries?: number
	retryDelay?: number
}

export interface IKafkaTransportConfig {
	brokers: string[]
	clientId?: string
	groupId?: string
	topic?: string
	username?: string
	password?: string
	ssl?: boolean
	retries?: number
	retryDelay?: number
}

export interface INatsTransportConfig {
	url: string
	subject?: string
	username?: string
	password?: string
	ssl?: boolean
	retries?: number
	retryDelay?: number
}

export interface IHttpTransportConfig {
	baseUrl: string
	timeout?: number
	username?: string
	password?: string
	ssl?: boolean
	retries?: number
	retryDelay?: number
}

export interface IWebSocketTransportConfig {
	wsUrl: string
	username?: string
	password?: string
	ssl?: boolean
	retries?: number
	retryDelay?: number
}

export interface IMqttTransportConfig {
	mqttUrl: string
	username?: string
	password?: string
	ssl?: boolean
	retries?: number
	retryDelay?: number
}

export type IProjectTransportConfigByType =
	| { type: 'none'; configtransportConfig?: undefined }
	| { type: 'tcp'; transportConfig: ITcpTransportConfig }
	| { type: 'rabbitmq'; transportConfig: IRabbitMqTransportConfig }
	| { type: 'kafka'; transportConfig: IKafkaTransportConfig }
	| { type: 'nats'; transportConfig: INatsTransportConfig }
	| { type: 'http'; transportConfig: IHttpTransportConfig }
	| { type: 'websocket'; transportConfig: IWebSocketTransportConfig }
	| { type: 'mqtt'; transportConfig: IMqttTransportConfig }

/**
 * Patrones de transporte soportados
 */
export type IProjectTransportPattern = 'request-response' | 'publish-subscribe' | 'push-pull' | 'stream'

/**
 * Estados de proyecto (usando el status unificado del sistema)
 */
export type IProjectStatus = StatusType

/**
 * Interfaz base para un proyecto
 */
export interface IProjectBase {
	id: string
	name: string
	description: string
	workspaceId?: string
	status: IProjectStatus
	transportType?: IProjectTransportType
	transportPattern?: IProjectTransportPattern
	transportConfig?: IProjectTransportConfig
	deploymentId?: string | null
	deploymentConfiguration?: Record<string, any>
	createdAt: Date
	updatedAt: Date
}

/**
 * Interfaz para proyecto del cliente
 */
export interface IProjectClient extends IProjectBase {
	// Propiedades específicas del cliente
}

/**
 * Interfaz para proyecto del servidor
 */
export interface IProjectServer extends IProjectBase {
	// Propiedades específicas del servidor
}

/**
 * Interfaz para crear un proyecto
 */
export interface IProjectCreate extends Omit<IProjectBase, 'id' | 'createdAt' | 'updatedAt'> {
	id?: string
	createdAt?: Date
	updatedAt?: Date
}

/**
 * Interfaz para actualizar un proyecto
 */
export interface IProjectUpdate extends Partial<Omit<IProjectBase, 'id' | 'createdAt' | 'updatedAt'>> {
	updatedAt?: Date
}

/**
 * Interfaz legacy para compatibilidad - será depreciada
 * @deprecated Usar IProjectClient en su lugar
 */
export interface Project extends IProjectClient {}

/**
 * Interfaz legacy para compatibilidad - será depreciada
 * @deprecated Usar IProjectTransportConfig en su lugar
 */
export interface ProjectTransportConfig extends IProjectTransportConfig {}

/**
 * Interfaz legacy para compatibilidad - será depreciada
 * @deprecated Usar IProjectServer en su lugar
 */
export interface ProjectAttributes extends IProjectServer {}
