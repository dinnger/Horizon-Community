import { DataTypes, Model, type Optional } from 'sequelize'
import { sequelize } from '../config/database.js'
import { type StatusType, type IStatusEntity, EnumStatus } from '@shared/interfaces/status.interface.js'

export interface DeploymentInstanceAssignmentRoleAttributes extends IStatusEntity {
	id: string
	assignmentId: string
	roleId: string
	grantedAt: Date
	grantedBy?: string // ID del usuario que otorgó el rol
	expiresAt?: Date // Opcional: fecha de expiración del rol
	status: StatusType
	createdAt: Date
	updatedAt: Date
}

export interface DeploymentInstanceAssignmentRoleCreationAttributes
	extends Optional<
		DeploymentInstanceAssignmentRoleAttributes,
		'id' | 'grantedAt' | 'grantedBy' | 'expiresAt' | 'status' | 'createdAt' | 'updatedAt'
	> {}

class DeploymentInstanceAssignmentRole
	extends Model<DeploymentInstanceAssignmentRoleAttributes, DeploymentInstanceAssignmentRoleCreationAttributes>
	implements DeploymentInstanceAssignmentRoleAttributes
{
	public id!: string
	public assignmentId!: string
	public roleId!: string
	public grantedAt!: Date
	public grantedBy?: string
	public expiresAt?: Date
	public status!: StatusType

	// Timestamps
	public readonly createdAt!: Date
	public readonly updatedAt!: Date
}

// Initialize the DeploymentInstanceAssignmentRole model
DeploymentInstanceAssignmentRole.init(
	{
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true
		},
		assignmentId: {
			type: DataTypes.UUID,
			allowNull: false,
			references: {
				model: 'deployment_instance_assignments',
				key: 'id'
			},
			onUpdate: 'CASCADE',
			onDelete: 'CASCADE'
		},
		roleId: {
			type: DataTypes.UUID,
			allowNull: false,
			references: {
				model: 'roles',
				key: 'id'
			},
			onUpdate: 'CASCADE',
			onDelete: 'CASCADE'
		},
		grantedAt: {
			type: DataTypes.DATE,
			allowNull: false,
			defaultValue: DataTypes.NOW
		},
		grantedBy: {
			type: DataTypes.UUID,
			allowNull: true,
			comment: 'ID del usuario que otorgó el rol'
		},
		expiresAt: {
			type: DataTypes.DATE,
			allowNull: true,
			comment: 'Fecha de expiración del rol (opcional)'
		},
		status: {
			type: EnumStatus,
			allowNull: false,
			defaultValue: 'active'
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
		tableName: 'deployment_instance_assignment_roles',
		timestamps: true,
		indexes: [
			{
				fields: ['assignment_id', 'role_id'],
				unique: true,
				name: 'unique_assignment_role'
			},
			{
				fields: ['assignment_id']
			},
			{
				fields: ['role_id']
			},
			{
				fields: ['status']
			},
			{
				fields: ['granted_at']
			},
			{
				fields: ['expires_at']
			}
		]
	}
)

export default DeploymentInstanceAssignmentRole
