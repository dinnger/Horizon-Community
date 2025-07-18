import { DataTypes, Model, type Optional } from 'sequelize'
import { sequelize } from '../config/database.js'
import { type StatusType, type IStatusEntity, EnumStatus } from '@shared/interfaces/status.interface.js'
import DeploymentInstanceAssignmentRole from './DeploymentInstanceAssignmentRole.js'
import Role from './Role.js'
import Deployment from './Deployment.js'
import DeploymentInstance from './DeploymentInstance.js'

export interface DeploymentInstanceAssignmentAttributes extends IStatusEntity {
	id: string
	deploymentId: string
	instanceId: string
	deployType: string // Tipo de deploy (docker, kubernetes, etc.)
	assignedAt: Date
	assignedBy?: string // ID del usuario que hizo la asignación
	status: StatusType
	priority: number // Prioridad de la instancia en el deployment (0 = mayor prioridad)
	executionOrder: number // Orden de ejecución en el deployment
	autoApprove: boolean // Auto-aprobación automática para esta asignación
	configuration?: Record<string, any> // Configuraciones específicas para esta asignación
	createdAt: Date
	updatedAt: Date
}

export interface DeploymentInstanceAssignmentCreationAttributes
	extends Optional<
		DeploymentInstanceAssignmentAttributes,
		| 'id'
		| 'assignedAt'
		| 'assignedBy'
		| 'status'
		| 'priority'
		| 'executionOrder'
		| 'autoApprove'
		| 'configuration'
		| 'createdAt'
		| 'updatedAt'
		| 'deployType'
	> {}

class DeploymentInstanceAssignment
	extends Model<DeploymentInstanceAssignmentAttributes, DeploymentInstanceAssignmentCreationAttributes>
	implements DeploymentInstanceAssignmentAttributes
{
	public id!: string
	public deploymentId!: string
	public instanceId!: string
	public deployType!: string // Tipo de deploy (docker, kubernetes, etc.)
	public assignedAt!: Date
	public assignedBy?: string
	public status!: StatusType
	public priority!: number
	public executionOrder!: number
	public autoApprove!: boolean
	public configuration?: Record<string, any>

	// Timestamps
	public readonly createdAt!: Date
	public readonly updatedAt!: Date
}

// Initialize the DeploymentInstanceAssignment model
DeploymentInstanceAssignment.init(
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
				model: 'deployments',
				key: 'id'
			},
			onUpdate: 'CASCADE',
			onDelete: 'CASCADE'
		},
		instanceId: {
			type: DataTypes.UUID,
			allowNull: false,
			references: {
				model: 'deployment_instances',
				key: 'id'
			},
			onUpdate: 'CASCADE',
			onDelete: 'CASCADE'
		},
		deployType: {
			type: DataTypes.STRING,
			allowNull: false,
			validate: {
				notEmpty: true
			}
		},
		assignedAt: {
			type: DataTypes.DATE,
			allowNull: false,
			defaultValue: DataTypes.NOW
		},
		assignedBy: {
			type: DataTypes.UUID,
			allowNull: true,
			comment: 'ID del usuario que hizo la asignación'
		},
		status: {
			type: EnumStatus,
			allowNull: false,
			defaultValue: 'active'
		},
		priority: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
			validate: {
				min: 0
			}
		},
		executionOrder: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
			validate: {
				min: 0
			},
			comment: 'Orden de ejecución en el deployment'
		},
		autoApprove: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false,
			comment: 'Auto-aprobación automática para esta asignación'
		},
		configuration: {
			type: DataTypes.JSON,
			allowNull: true,
			get() {
				const value = this.getDataValue('configuration')
				return typeof value === 'object' && value !== null ? value : {}
			}
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
		tableName: 'deployment_instance_assignments',
		timestamps: true,
		indexes: [
			{
				fields: ['deployment_id', 'instance_id'],
				unique: true,
				name: 'unique_deployment_instance'
			},
			{
				fields: ['deployment_id']
			},
			{
				fields: ['instance_id']
			},
			{
				fields: ['status']
			},
			{
				fields: ['priority']
			},
			{
				fields: ['assigned_at']
			}
		]
	}
)

// Deployment and DeploymentInstance many-to-many relationship through DeploymentInstanceAssignment
Deployment.belongsToMany(DeploymentInstance, {
	through: DeploymentInstanceAssignment,
	foreignKey: 'deploymentId',
	otherKey: 'instanceId',
	as: 'instances'
})

DeploymentInstance.belongsToMany(Deployment, {
	through: DeploymentInstanceAssignment,
	foreignKey: 'instanceId',
	otherKey: 'deploymentId',
	as: 'deployments'
})

// Direct associations to the junction table
Deployment.hasMany(DeploymentInstanceAssignment, { foreignKey: 'deploymentId', as: 'assignments' })
DeploymentInstance.hasMany(DeploymentInstanceAssignment, { foreignKey: 'instanceId', as: 'assignments' })
DeploymentInstanceAssignment.belongsTo(Deployment, { foreignKey: 'deploymentId', as: 'deployment' })
DeploymentInstanceAssignment.belongsTo(DeploymentInstance, { foreignKey: 'instanceId', as: 'instance' })

// Many-to-many relationship between DeploymentInstanceAssignment and Role
DeploymentInstanceAssignment.belongsToMany(Role, {
	through: DeploymentInstanceAssignmentRole,
	foreignKey: 'assignmentId',
	otherKey: 'roleId',
	as: 'roles'
})

Role.belongsToMany(DeploymentInstanceAssignment, {
	through: DeploymentInstanceAssignmentRole,
	foreignKey: 'roleId',
	otherKey: 'assignmentId',
	as: 'assignments'
})

// Direct associations to the role assignment junction table
DeploymentInstanceAssignment.hasMany(DeploymentInstanceAssignmentRole, { foreignKey: 'assignmentId', as: 'roleAssignments' })
Role.hasMany(DeploymentInstanceAssignmentRole, { foreignKey: 'roleId', as: 'assignmentRoles' })
DeploymentInstanceAssignmentRole.belongsTo(DeploymentInstanceAssignment, { foreignKey: 'assignmentId', as: 'assignment' })
DeploymentInstanceAssignmentRole.belongsTo(Role, { foreignKey: 'roleId', as: 'role' })

export default DeploymentInstanceAssignment
