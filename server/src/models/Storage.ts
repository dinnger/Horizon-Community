import { DataTypes, Model, type Optional } from 'sequelize'
import { sequelize } from '../config/database.js'
import { type StatusType, type IStatusEntity, EnumStatus } from '@shared/interfaces/status.interface.js'
import Workspace from './Workspace.js'
import { encrypt } from '../utils/cryptography.js'

export interface StorageAttributes {
	id: string
	name: string
	description?: string
	type: 'file' | 'credential' | 'other'
	nodeType: string // Ej: 'local', 'aws', 'gcp', 'azure', etc.
	data: any // Ruta o identificador del recurso
	metadata?: Record<string, any> // Información adicional (tamaño, mimetype, etc)
	workspaceId: string
	status: StatusType
	createdAt: Date
	updatedAt: Date
}

// Atributos opcionales para la creación
export interface StorageCreationAttributes
	extends Optional<StorageAttributes, 'id' | 'description' | 'nodeType' | 'data' | 'metadata' | 'createdAt' | 'updatedAt' | 'status'> {}

// Modelo Storage
class Storage extends Model<StorageAttributes, StorageCreationAttributes> implements StorageAttributes {
	public id!: string
	public name!: string
	public description?: string
	public type!: 'file' | 'credential' | 'other'
	public nodeType!: string
	public data: any // Puede ser string o Buffer
	public metadata?: Record<string, any>
	public workspaceId!: string
	public status!: StatusType
	public readonly createdAt!: Date
	public readonly updatedAt!: Date
}

Storage.init(
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
			allowNull: true
		},
		type: {
			type: DataTypes.ENUM('file', 'credential', 'other'),
			allowNull: false
		},
		nodeType: {
			type: DataTypes.STRING,
			allowNull: true
		},
		data: {
			type: DataTypes.BLOB,
			allowNull: true
		},
		metadata: {
			type: DataTypes.JSON,
			allowNull: true
		},

		workspaceId: {
			type: DataTypes.UUID,
			allowNull: false,
			references: {
				model: Workspace,
				key: 'id'
			},
			onUpdate: 'CASCADE',
			onDelete: 'CASCADE'
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
		modelName: 'Storage',
		tableName: 'storages',
		indexes: [{ fields: ['name'] }, { fields: ['type'] }, { fields: ['status'] }, { fields: ['node_type'] }, { fields: ['workspace_id'] }]
	}
)

// Hook para encriptar el campo data antes de crear
Storage.addHook('beforeCreate', (storage: Storage) => {
	if (storage.data && typeof storage.data === 'string') {
		storage.data = Buffer.from(encrypt(storage.data), 'utf-8')
	}
})

// Asociaciones
Storage.belongsTo(Workspace, { foreignKey: 'workspaceId', as: 'workspace' })
Workspace.hasMany(Storage, { foreignKey: 'workspaceId', as: 'storages' })

export default Storage
