import { DataTypes } from 'sequelize'

/**
 * Enum unificado para todos los estados posibles en el sistema
 * Utilizado por workflows, proyectos, deployments, etc.
 */
export enum Status {
	// Estados de ejecución
	SUCCESS = 'success',
	RUNNING = 'running',
	FAILED = 'failed',
	PENDING = 'pending',
	WAITING = 'waiting', // Para elementos en cola esperando su turno

	// Estados de disponibilidad
	ACTIVE = 'active',
	INACTIVE = 'inactive',
	ARCHIVED = 'archived',

	// Estados de mantenimiento
	MAINTENANCE = 'maintenance',

	// Estados adicionales para mayor flexibilidad
	PAUSED = 'paused',
	CANCELLED = 'cancelled',
	DRAFT = 'draft',
	PUBLISHED = 'published',
	DELETED = 'deleted'
}

/**
 * Tipo unión para compatibilidad con strings
 */
export type StatusType =
	| 'success'
	| 'running'
	| 'failed'
	| 'pending'
	| 'waiting'
	| 'active'
	| 'inactive'
	| 'archived'
	| 'maintenance'
	| 'paused'
	| 'cancelled'
	| 'draft'
	| 'published'
	| 'deleted'

/**
 * Interfaz base para entidades que tienen status
 */
export interface IStatusEntity {
	status: StatusType
	statusUpdatedAt?: Date
	statusReason?: string
}

/**
 * Configuración de estados con metadatos
 */
export interface IStatusConfig {
	value: StatusType
	label: string
	description: string
	color: string
	icon?: string
	category: 'execution' | 'availability' | 'maintenance' | 'lifecycle'
}

/**
 * Mapeo completo de configuraciones de status
 */
export const STATUS_CONFIG: Record<StatusType, IStatusConfig> = {
	// Estados de ejecución
	success: {
		value: 'success',
		label: 'Exitoso',
		description: 'Proceso completado satisfactoriamente',
		color: '#10B981',
		icon: 'check-circle',
		category: 'execution'
	},
	running: {
		value: 'running',
		label: 'En ejecución',
		description: 'Proceso actualmente en curso',
		color: '#3B82F6',
		icon: 'play-circle',
		category: 'execution'
	},
	failed: {
		value: 'failed',
		label: 'Fallido',
		description: 'Proceso terminado con errores',
		color: '#EF4444',
		icon: 'x-circle',
		category: 'execution'
	},
	pending: {
		value: 'pending',
		label: 'Pendiente',
		description: 'En espera de ejecución',
		color: '#F59E0B',
		icon: 'clock',
		category: 'execution'
	},
	waiting: {
		value: 'waiting',
		label: 'Esperando',
		description: 'En cola esperando su turno',
		color: '#64748B',
		icon: 'hourglass',
		category: 'execution'
	},
	paused: {
		value: 'paused',
		label: 'Pausado',
		description: 'Proceso pausado temporalmente',
		color: '#8B5CF6',
		icon: 'pause-circle',
		category: 'execution'
	},
	cancelled: {
		value: 'cancelled',
		label: 'Cancelado',
		description: 'Proceso cancelado por el usuario',
		color: '#6B7280',
		icon: 'stop-circle',
		category: 'execution'
	},

	// Estados de disponibilidad
	active: {
		value: 'active',
		label: 'Activo',
		description: 'Disponible para uso',
		color: '#10B981',
		icon: 'check',
		category: 'availability'
	},
	inactive: {
		value: 'inactive',
		label: 'Inactivo',
		description: 'No disponible temporalmente',
		color: '#6B7280',
		icon: 'minus-circle',
		category: 'availability'
	},
	archived: {
		value: 'archived',
		label: 'Archivado',
		description: 'Guardado para referencia futura',
		color: '#8B5CF6',
		icon: 'archive',
		category: 'availability'
	},

	// Estados de mantenimiento
	maintenance: {
		value: 'maintenance',
		label: 'Mantenimiento',
		description: 'En proceso de mantenimiento',
		color: '#F59E0B',
		icon: 'wrench',
		category: 'maintenance'
	},

	// Estados de ciclo de vida
	draft: {
		value: 'draft',
		label: 'Borrador',
		description: 'En desarrollo o edición',
		color: '#6B7280',
		icon: 'document',
		category: 'lifecycle'
	},
	published: {
		value: 'published',
		label: 'Publicado',
		description: 'Disponible públicamente',
		color: '#10B981',
		icon: 'globe',
		category: 'lifecycle'
	},
	deleted: {
		value: 'deleted',
		label: 'Eliminado',
		description: 'Marcado para eliminación',
		color: '#EF4444',
		icon: 'trash',
		category: 'lifecycle'
	}
}

/**
 * Utilidades para trabajar con status
 */

/**
 * Obtiene la configuración de un status
 */
export const getStatusConfig = (status: StatusType): IStatusConfig => {
	return STATUS_CONFIG[status]
}

/**
 * Obtiene todos los status de una categoría específica
 */
export const getStatusByCategory = (category: IStatusConfig['category']): StatusType[] => {
	return Object.values(STATUS_CONFIG)
		.filter((config) => config.category === category)
		.map((config) => config.value)
}

/**
 * Verifica si un status indica que el proceso está en ejecución
 */
export const isStatusExecuting = (status: StatusType): boolean => {
	return ['running', 'pending', 'waiting', 'paused'].includes(status)
}

/**
 * Verifica si un status indica que el proceso ha terminado
 */
export const isStatusCompleted = (status: StatusType): boolean => {
	return ['success', 'failed', 'cancelled'].includes(status)
}

/**
 * Verifica si un status indica que la entidad está disponible
 */
export const isStatusAvailable = (status: StatusType): boolean => {
	return ['active', 'success', 'published'].includes(status)
}

/**
 * Obtiene el siguiente status lógico basado en el actual
 */
export const getNextStatus = (
	current: StatusType,
	action: 'start' | 'complete' | 'fail' | 'pause' | 'resume' | 'cancel' | 'archive' | 'activate'
): StatusType => {
	switch (action) {
		case 'start':
			return current === 'pending' || current === 'waiting' ? 'running' : current
		case 'activate':
			return current === 'waiting' ? 'pending' : current
		case 'complete':
			return current === 'running' ? 'success' : current
		case 'fail':
			return ['running', 'pending', 'waiting'].includes(current) ? 'failed' : current
		case 'pause':
			return current === 'running' ? 'paused' : current
		case 'resume':
			return current === 'paused' ? 'running' : current
		case 'cancel':
			return ['running', 'pending', 'waiting', 'paused'].includes(current) ? 'cancelled' : current
		case 'archive':
			return ['success', 'failed', 'cancelled', 'inactive'].includes(current) ? 'archived' : current
		default:
			return current
	}
}

export const EnumStatus = DataTypes.ENUM(
	'success',
	'running',
	'failed',
	'pending',
	'waiting',
	'archived',
	'active',
	'inactive',
	'maintenance',
	'paused',
	'cancelled',
	'draft',
	'published',
	'deleted'
)
