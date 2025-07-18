import { DataTypes, Model, type Optional } from 'sequelize'
import { sequelize } from '../config/database.js'
import { type StatusType, type IStatusEntity, EnumStatus } from '@shared/interfaces/status.interface.js'

// Define the attributes for the Deployment model
export interface DeploymentAttributes extends IStatusEntity {
	id: string
	name: string
	description: string
	color: string
	status: StatusType
	createdAt: Date
	updatedAt: Date
}

// Define creation attributes (optional fields for creation)
export interface DeploymentCreationAttributes extends Optional<DeploymentAttributes, 'id' | 'createdAt' | 'updatedAt' | 'status'> {}

// Define the Deployment model class
class Deployment extends Model<DeploymentAttributes, DeploymentCreationAttributes> implements DeploymentAttributes {
	public id!: string
	public name!: string
	public description!: string
	public color!: string
	public deployType!: string
	public status!: StatusType

	// Timestamps
	public readonly createdAt!: Date
	public readonly updatedAt!: Date
}

// Initialize the Deployment model
Deployment.init(
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
		color: {
			type: DataTypes.STRING,
			allowNull: false,
			defaultValue: '#3B82F6',
			validate: {
				is: /^#[0-9A-Fa-f]{6}$/
			}
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
		tableName: 'deployments',
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

export default Deployment
