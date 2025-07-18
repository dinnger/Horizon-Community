import { DataTypes, Model, type Optional } from 'sequelize'
import { sequelize } from '../config/database.js'
import { type StatusType, type IStatusEntity, EnumStatus } from '@shared/interfaces/status.interface.js'
import Workflow from './Workflow.js'

export interface WorkflowExecutionAttributes extends IStatusEntity {
	id: string
	workflowId: string
	status: StatusType
	startTime: Date
	endTime?: Date
	duration?: string
	trigger: string
	version?: string // Version of the workflow that was executed
	executionData?: object // JSON para almacenar inputs, outputs, logs, etc.
	errorMessage?: string
	createdAt: Date
	updatedAt: Date
}

export interface WorkflowExecutionCreationAttributes
	extends Optional<
		WorkflowExecutionAttributes,
		'id' | 'endTime' | 'duration' | 'version' | 'executionData' | 'errorMessage' | 'createdAt' | 'updatedAt'
	> {}

export class WorkflowExecution
	extends Model<WorkflowExecutionAttributes, WorkflowExecutionCreationAttributes>
	implements WorkflowExecutionAttributes
{
	public id!: string
	public workflowId!: string
	public status!: StatusType
	public startTime!: Date
	public endTime?: Date
	public duration?: string
	public trigger!: string
	public version?: string
	public executionData?: object
	public errorMessage?: string

	// timestamps!
	public readonly createdAt!: Date
	public readonly updatedAt!: Date
}

WorkflowExecution.init(
	{
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true
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
		status: {
			type: EnumStatus,
			allowNull: false,
			defaultValue: 'pending'
		},
		startTime: {
			type: DataTypes.DATE,
			allowNull: false,
			defaultValue: DataTypes.NOW
		},
		endTime: {
			type: DataTypes.DATE,
			allowNull: true
		},
		duration: {
			type: DataTypes.STRING,
			allowNull: true
		},
		trigger: {
			type: DataTypes.STRING,
			allowNull: false,
			defaultValue: 'manual'
		},
		version: {
			type: DataTypes.STRING,
			allowNull: true
		},
		executionData: {
			type: DataTypes.JSON,
			allowNull: true
		},
		errorMessage: {
			type: DataTypes.TEXT,
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
		modelName: 'WorkflowExecution',
		tableName: 'workflow_executions',
		indexes: [
			{
				fields: ['workflow_id']
			},
			{
				fields: ['status']
			},
			{
				fields: ['start_time']
			},
			{
				fields: ['workflow_id', 'status']
			}
		]
	}
)

// Associations
WorkflowExecution.belongsTo(Workflow, {
	foreignKey: 'workflowId',
	as: 'workflow'
})
Workflow.hasMany(WorkflowExecution, {
	foreignKey: 'workflowId',
	as: 'executions'
})

export default WorkflowExecution
