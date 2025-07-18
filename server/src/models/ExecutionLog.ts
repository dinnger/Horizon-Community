import { DataTypes, Model, type Optional } from "sequelize";
import { sequelize } from "../config/database.js";
import WorkflowExecution from "./WorkflowExecution.js";

export interface ExecutionLogAttributes {
	id: string;
	executionId: string;
	level: "info" | "warning" | "error" | "debug";
	message: string;
	nodeId?: string;
	nodeName?: string;
	timestamp: Date;
	data?: object; // JSON para datos adicionales del log
	createdAt: Date;
	updatedAt: Date;
}

export interface ExecutionLogCreationAttributes
	extends Optional<
		ExecutionLogAttributes,
		"id" | "nodeId" | "nodeName" | "data" | "createdAt" | "updatedAt"
	> {}

export class ExecutionLog
	extends Model<ExecutionLogAttributes, ExecutionLogCreationAttributes>
	implements ExecutionLogAttributes
{
	public id!: string;
	public executionId!: string;
	public level!: "info" | "warning" | "error" | "debug";
	public message!: string;
	public nodeId?: string;
	public nodeName?: string;
	public timestamp!: Date;
	public data?: object;

	// timestamps!
	public readonly createdAt!: Date;
	public readonly updatedAt!: Date;
}

ExecutionLog.init(
	{
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true,
		},
		executionId: {
			type: DataTypes.UUID,
			allowNull: false,
			references: {
				model: WorkflowExecution,
				key: "id",
			},
			onUpdate: "CASCADE",
			onDelete: "CASCADE",
		},
		level: {
			type: DataTypes.ENUM("info", "warning", "error", "debug"),
			allowNull: false,
			defaultValue: "info",
		},
		message: {
			type: DataTypes.TEXT,
			allowNull: false,
		},
		nodeId: {
			type: DataTypes.STRING,
			allowNull: true,
		},
		nodeName: {
			type: DataTypes.STRING,
			allowNull: true,
		},
		timestamp: {
			type: DataTypes.DATE,
			allowNull: false,
			defaultValue: DataTypes.NOW,
		},
		data: {
			type: DataTypes.JSON,
			allowNull: true,
		},
		createdAt: {
			type: DataTypes.DATE,
			allowNull: false,
			defaultValue: DataTypes.NOW,
		},
		updatedAt: {
			type: DataTypes.DATE,
			allowNull: false,
			defaultValue: DataTypes.NOW,
		},
	},
	{
		sequelize,
		modelName: "ExecutionLog",
		tableName: "execution_logs",
		indexes: [
			{
				fields: ["execution_id"],
			},
			{
				fields: ["level"],
			},
			{
				fields: ["timestamp"],
			},
			{
				fields: ["execution_id", "level"],
			},
		],
	},
);

// Associations
ExecutionLog.belongsTo(WorkflowExecution, {
	foreignKey: "executionId",
	as: "execution",
});
WorkflowExecution.hasMany(ExecutionLog, {
	foreignKey: "executionId",
	as: "logs",
});

export default ExecutionLog;
