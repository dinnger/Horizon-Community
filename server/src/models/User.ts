import { DataTypes, Model, type Optional } from 'sequelize'
import { sequelize } from '../config/database.js'
import Role from './Role.js'

export interface UserAttributes {
	id: string
	email: string
	name: string
	password: string
	avatar?: string
	roleId: string // Cambiar de role a roleId
	status: 'active' | 'inactive' | 'suspended'
	lastLoginAt?: Date
	role?: Role // Añadir la relación role como opcional
	createdAt: Date
	updatedAt: Date
}

export interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'avatar' | 'lastLoginAt' | 'createdAt' | 'updatedAt'> {}

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
	public id!: string
	public email!: string
	public name!: string
	public password!: string
	public avatar?: string
	public roleId!: string // Cambiar de role a roleId
	public status!: 'active' | 'inactive' | 'suspended'
	public lastLoginAt?: Date
	public role?: Role // Añadir la relación role como opcional

	// timestamps!
	public readonly createdAt!: Date
	public readonly updatedAt!: Date
}

User.init(
	{
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true
		},
		email: {
			type: DataTypes.STRING,
			allowNull: false,
			unique: true,
			validate: {
				isEmail: true
			}
		},
		name: {
			type: DataTypes.STRING,
			allowNull: false
		},
		password: {
			type: DataTypes.STRING,
			allowNull: false
		},
		avatar: {
			type: DataTypes.TEXT,
			allowNull: true
		},
		roleId: {
			type: DataTypes.UUID,
			allowNull: false
		},
		status: {
			type: DataTypes.ENUM('active', 'inactive', 'suspended'),
			allowNull: false,
			defaultValue: 'active'
		},
		lastLoginAt: {
			type: DataTypes.DATE,
			allowNull: true
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
		modelName: 'User',
		tableName: 'users',
		indexes: [
			{
				unique: true,
				fields: ['email']
			},
			{
				fields: ['status']
			}
		]
	}
)

Role.hasMany(User, { foreignKey: 'roleId', as: 'users' })
User.belongsTo(Role, { foreignKey: 'roleId', as: 'role' })

export default User
