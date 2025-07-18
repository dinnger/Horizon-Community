import { DataTypes, Model, type Optional } from 'sequelize'
import { sequelize } from '../config/database.js'

// Define the attributes for the DeployType model
export interface DeployTypeAttributes {
	id: string
	name: string
	title: string
	description: string
	icon: string
	properties: Record<string, any> // Configuraciones específicas del tipo
	isActive: boolean
	createdAt: Date
	updatedAt: Date
}

// Define creation attributes (optional fields for creation)
export interface DeployTypeCreationAttributes
	extends Optional<DeployTypeAttributes, 'id' | 'createdAt' | 'updatedAt' | 'isActive' | 'properties'> {}

// Define the DeployType model class
class DeployType extends Model<DeployTypeAttributes, DeployTypeCreationAttributes> implements DeployTypeAttributes {
	public id!: string
	public name!: string
	public title!: string
	public description!: string
	public icon!: string
	public properties!: Record<string, any>
	public isActive!: boolean

	// Timestamps
	public readonly createdAt!: Date
	public readonly updatedAt!: Date
}

// Initialize the DeployType model
DeployType.init(
	{
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true
		},
		name: {
			type: DataTypes.STRING,
			allowNull: false,
			unique: true,
			validate: {
				notEmpty: true,
				len: [1, 100]
			}
		},
		title: {
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
		icon: {
			type: DataTypes.STRING,
			allowNull: false,
			validate: {
				notEmpty: true
			}
		},
		properties: {
			type: DataTypes.JSON,
			allowNull: false,
			defaultValue: {},
			get() {
				const value = this.getDataValue('properties')
				return typeof value === 'object' && value !== null ? value : {}
			}
		},
		isActive: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: true
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
		tableName: 'deploy_types',
		timestamps: true,
		indexes: [
			{
				fields: ['name'],
				unique: true
			},
			{
				fields: ['is_active']
			}
		]
	}
)

export default DeployType
