import { DataTypes, Model, type Optional } from 'sequelize'
import { sequelize } from '../config/database.js'
import type { IWorkflowData, IWorkflowProperties } from '@shared/interfaces/standardized.js'
import { type StatusType, type IStatusEntity, EnumStatus } from '@shared/interfaces/status.interface.js'
import Project from './Project.js'

export interface WorkflowAttributes extends IStatusEntity {
	id: string
	name: string
	description: string
	projectId: string
	status: StatusType
	lastRun?: Date
	duration?: string
	workflowData: IWorkflowData // JSON para almacenar los nodos y conexiones del canvas
	properties?: IWorkflowProperties
	version: string
	isPublished: boolean
	createdAt: Date
	updatedAt: Date
}

export interface WorkflowCreationAttributes
	extends Optional<WorkflowAttributes, 'id' | 'lastRun' | 'duration' | 'workflowData' | 'createdAt' | 'updatedAt'> {}

export class Workflow extends Model<WorkflowAttributes, WorkflowCreationAttributes> implements WorkflowAttributes {
	public id!: string
	public name!: string
	public description!: string
	public projectId!: string
	public status!: StatusType
	public lastRun?: Date
	public duration?: string
	public workflowData!: IWorkflowData
	public properties!: IWorkflowProperties
	public version!: string
	public isPublished!: boolean

	// timestamps!
	public readonly createdAt!: Date
	public readonly updatedAt!: Date
}

Workflow.init(
	{
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true
		},
		name: {
			type: DataTypes.STRING,
			allowNull: false
		},
		description: {
			type: DataTypes.TEXT,
			allowNull: false
		},
		projectId: {
			type: DataTypes.UUID,
			allowNull: false,
			references: {
				model: Project,
				key: 'id'
			},
			onUpdate: 'CASCADE',
			onDelete: 'CASCADE'
		},
		status: {
			type: EnumStatus,
			allowNull: false,
			defaultValue: 'pending'
		},
		lastRun: {
			type: DataTypes.DATE,
			allowNull: true
		},
		duration: {
			type: DataTypes.STRING,
			allowNull: true
		},
		workflowData: {
			type: DataTypes.JSON,
			allowNull: true
		},
		properties: {
			type: DataTypes.JSON,
			allowNull: false,
			defaultValue: {}
		},
		version: {
			type: DataTypes.STRING,
			allowNull: false,
			defaultValue: '0.0.1'
		},
		isPublished: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false
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
		modelName: 'Workflow',
		tableName: 'workflows',
		indexes: [
			{
				fields: ['project_id']
			},
			{
				fields: ['status']
			},
			{
				fields: ['project_id', 'status']
			},
			{
				fields: ['version']
			},
			{
				fields: ['is_published']
			}
		],
		hooks: {
			afterCreate: async (workflow: Workflow) => {
				// Registrar la creación en el historial
				try {
					const { recordCreation } = await import('../services/WorkflowHistoryService.js')
					await recordCreation(
						workflow.id,
						undefined, // userId se puede obtener del contexto si está disponible
						workflow.toJSON(),
						workflow.version,
						{
							userAgent: 'system',
							action: 'auto-created'
						}
					)
				} catch (error) {
					console.error('Error registrando creación en historial:', error)
				}
			},
			beforeUpdate: async (workflow: Workflow) => {
				// Registrar la actualización en el historial
				try {
					const { recordUpdate } = await import('../services/WorkflowHistoryService.js')

					// Verificar si la versión fue cambiada manualmente
					const previousVersion = workflow.previous('version') as string
					const currentVersion = workflow.version

					// Solo incrementar automáticamente el patch si:
					// 1. La versión no fue cambiada manualmente
					// 2. La versión actual es igual a la anterior
					let newVersion = currentVersion
					let isManualVersionChange = false

					if (previousVersion && currentVersion === previousVersion) {
						// La versión no cambió, aplicar incremento automático de patch
						const version = currentVersion.split('.')
						version[2] = (Number.parseInt(version[2]) + 1).toString()
						newVersion = version.join('.')
						workflow.version = newVersion
					} else if (previousVersion && currentVersion !== previousVersion) {
						// La versión fue cambiada manualmente, no aplicar incremento automático
						isManualVersionChange = true
						newVersion = currentVersion
					}

					await recordUpdate(
						workflow.id,
						undefined,
						workflow.toJSON(),
						newVersion,
						isManualVersionChange ? 'Workflow actualizado con versión específica' : 'Workflow actualizado automáticamente',
						{
							userAgent: 'system',
							action: isManualVersionChange ? 'manual-version-update' : 'auto-updated',
							versionChanged: isManualVersionChange,
							previousVersion: previousVersion
						}
					)
				} catch (error) {
					console.error('Error registrando actualización en historial:', error)
				}
			},
			beforeDestroy: async (workflow: Workflow) => {
				// Registrar la eliminación en el historial
				try {
					const { recordDeletion } = await import('../services/WorkflowHistoryService.js')
					await recordDeletion(
						workflow.id,
						undefined, // userId se puede obtener del contexto si está disponible
						workflow.toJSON(),
						workflow.version,
						{
							userAgent: 'system',
							action: 'auto-deleted'
						}
					)
				} catch (error) {
					console.error('Error registrando eliminación en historial:', error)
				}
			}
		}
	}
)

// Associations
Workflow.belongsTo(Project, { foreignKey: 'projectId', as: 'project' })
Project.hasMany(Workflow, { foreignKey: 'projectId', as: 'workflows' })

export default Workflow
