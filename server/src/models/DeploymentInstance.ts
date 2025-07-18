import { DataTypes, Model, type Optional } from 'sequelize'
import { sequelize } from '../config/database.js'
import { type StatusType, type IStatusEntity, EnumStatus } from '@shared/interfaces/status.interface.js'

// Define the attributes for the DeploymentInstance model
export interface DeploymentInstanceAttributes extends IStatusEntity {
	id: string
	name: string
	description: string
	versionChange: 'none' | 'patch' | 'minor' | 'major'
	status: StatusType
	predecessors?: string[] // Array de IDs de instancias predecesoras
	createdAt: Date
	updatedAt: Date
}

// Define creation attributes (optional fields for creation)
export interface DeploymentInstanceCreationAttributes
	extends Optional<DeploymentInstanceAttributes, 'id' | 'createdAt' | 'updatedAt' | 'status'> {}

// Define the DeploymentInstance model class
class DeploymentInstance
	extends Model<DeploymentInstanceAttributes, DeploymentInstanceCreationAttributes>
	implements DeploymentInstanceAttributes
{
	public id!: string
	public name!: string
	public description!: string
	public versionChange!: 'none' | 'patch' | 'minor' | 'major'
	public status!: StatusType
	public predecessors!: string[]

	// Timestamps
	public readonly createdAt!: Date
	public readonly updatedAt!: Date
}

// Initialize the DeploymentInstance model
DeploymentInstance.init(
	{
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true
		},
		name: {
			type: DataTypes.STRING,
			allowNull: false,
			validate: {
				notEmpty: true,
				len: [1, 255]
			}
		},
		description: {
			type: DataTypes.TEXT,
			allowNull: false,
			validate: {
				notEmpty: true
			}
		},
		versionChange: {
			type: DataTypes.ENUM('none', 'patch', 'minor', 'major'),
			allowNull: false,
			defaultValue: 'none'
		},
		predecessors: {
			type: DataTypes.JSON,
			allowNull: false,
			defaultValue: []
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
		tableName: 'deployment_instances',
		timestamps: true,
		indexes: [
			{
				fields: ['name']
			},
			{
				fields: ['status']
			},
			{
				fields: ['created_at']
			}
		]
	}
)

export default DeploymentInstance
