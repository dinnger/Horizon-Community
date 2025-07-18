import { DataTypes, Model, type Optional } from 'sequelize'
import { sequelize } from '../config/database.js'
import { type StatusType, type IStatusEntity, EnumStatus } from '@shared/interfaces/status.interface.js'
import Deployment from './Deployment.js'
import DeploymentInstance from './DeploymentInstance.js'
import Workflow from './Workflow.js'
import User from './User.js'
import type { IWorkflowFull } from '@shared/interfaces/standardized.js'

export interface DeploymentQueueAttributes extends IStatusEntity {
	id: string
	deploymentId: string
	instanceId?: string // ID de la instancia específica donde se desplegará
	workflowId: string
	workflowVersionId?: string // ID del historial del workflow si es una versión específica
	description: string
	flow: IWorkflowFull // El workflow completo tal como será desplegado
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
}

export interface DeploymentQueueCreationAttributes
	extends Optional<
		DeploymentQueueAttributes,
		| 'id'
		| 'instanceId'
		| 'workflowVersionId'
		| 'requestedBy'
		| 'scheduledAt'
		| 'startedAt'
		| 'completedAt'
		| 'errorMessage'
		| 'deploymentResult'
		| 'createdAt'
		| 'updatedAt'
	> {}

export class DeploymentQueue
	extends Model<DeploymentQueueAttributes, DeploymentQueueCreationAttributes>
	implements DeploymentQueueAttributes
{
	public id!: string
	public deploymentId!: string
	public instanceId?: string
	public workflowId!: string
	public workflowVersionId?: string
	public description!: string
	public flow!: IWorkflowFull
	public meta!: {
		path?: string
		version?: string
		trigger?: string
		requestedBy?: string
		deploymentConfig?: Record<string, any>
	}
	public status!: StatusType
	public requestedBy?: string
	public scheduledAt?: Date
	public startedAt?: Date
	public completedAt?: Date
	public errorMessage?: string
	public deploymentResult?: Record<string, any>

	// timestamps!
	public readonly createdAt!: Date
	public readonly updatedAt!: Date
}

DeploymentQueue.init(
	{
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true
		},
		deploymentId: {
			type: DataTypes.UUID,
			allowNull: false,
			references: {
				model: Deployment,
				key: 'id'
			},
			onUpdate: 'CASCADE',
			onDelete: 'CASCADE'
		},
		instanceId: {
			type: DataTypes.UUID,
			allowNull: true,
			references: {
				model: 'deployment_instances',
				key: 'id'
			},
			onUpdate: 'CASCADE',
			onDelete: 'SET NULL',
			comment: 'Instancia específica donde se desplegará'
		},
		workflowId: {
			type: DataTypes.UUID,
			allowNull: false,
			references: {
				model: Workflow,
				key: 'id'
			},
			onUpdate: 'CASCADE',
			onDelete: 'CASCADE'
		},
		workflowVersionId: {
			type: DataTypes.UUID,
			allowNull: true,
			comment: 'ID del historial del workflow si se despliega una versión específica'
		},
		description: {
			type: DataTypes.TEXT,
			allowNull: false
		},
		flow: {
			type: DataTypes.JSON,
			allowNull: false,
			comment: 'Workflow completo tal como será desplegado'
		},
		meta: {
			type: DataTypes.JSON,
			allowNull: false,
			defaultValue: {},
			comment: 'Metadatos adicionales como path, versión, trigger, etc.'
		},
		status: {
			type: EnumStatus,
			allowNull: false,
			defaultValue: 'pending'
		},
		requestedBy: {
			type: DataTypes.UUID,
			allowNull: true,
			references: {
				model: User,
				key: 'id'
			},
			onUpdate: 'CASCADE',
			onDelete: 'SET NULL'
		},
		scheduledAt: {
			type: DataTypes.DATE,
			allowNull: true,
			comment: 'Fecha programada para el despliegue (opcional)'
		},
		startedAt: {
			type: DataTypes.DATE,
			allowNull: true,
			comment: 'Fecha de inicio del despliegue'
		},
		completedAt: {
			type: DataTypes.DATE,
			allowNull: true,
			comment: 'Fecha de finalización del despliegue'
		},
		errorMessage: {
			type: DataTypes.TEXT,
			allowNull: true,
			comment: 'Mensaje de error en caso de fallo'
		},
		deploymentResult: {
			type: DataTypes.JSON,
			allowNull: true,
			comment: 'Resultado del despliegue (URLs, puertos, etc.)'
		},
		createdAt: {
			type: DataTypes.DATE,
			allowNull: false,
			defaultValue: DataTypes.NOW
		},
		updatedAt: {
			type: DataTypes.DATE,
			allowNull: false,
			defaultValue: DataTypes.NOW
		}
	},
	{
		sequelize,
		modelName: 'DeploymentQueue',
		tableName: 'deployment_queue',
		timestamps: true,
		indexes: [
			{
				fields: ['deployment_id']
			},
			{
				fields: ['instance_id']
			},
			{
				fields: ['workflow_id']
			},
			{
				fields: ['status']
			},
			{
				fields: ['status', 'created_at']
			},
			{
				fields: ['requested_by']
			},
			{
				fields: ['scheduled_at']
			},
			{
				fields: ['created_at']
			}
		],
		hooks: {
			beforeCreate: async (deploymentQueue: DeploymentQueue) => {
				// Auto-generar descripción si no se proporciona
				if (!deploymentQueue.description) {
					deploymentQueue.description = `Despliegue de ${deploymentQueue.flow.info?.name || 'workflow'} solicitado automáticamente`
				}
			}
		}
	}
)

// Define associations
DeploymentQueue.belongsTo(Deployment, {
	foreignKey: 'deploymentId',
	as: 'deployment'
})

DeploymentQueue.belongsTo(Workflow, {
	foreignKey: 'workflowId',
	as: 'workflow'
})

DeploymentQueue.belongsTo(User, {
	foreignKey: 'requestedBy',
	as: 'requestedByUser'
})

// Nueva asociación con DeploymentInstance
DeploymentQueue.belongsTo(DeploymentInstance, {
	foreignKey: 'instanceId',
	as: 'instance'
})

export default DeploymentQueue
