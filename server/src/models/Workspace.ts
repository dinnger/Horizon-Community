import { DataTypes, Model, type Optional } from "sequelize";
import { sequelize } from "../config/database.js";
import User from "./User.js";

export interface WorkspaceAttributes {
	id: string;
	name: string;
	description?: string;
	color: string;
	icon: string;
	userId: string;
	isDefault: boolean;
	status: "active" | "inactive" | "archived";
	createdAt: Date;
	updatedAt: Date;
}

export interface WorkspaceCreationAttributes
	extends Optional<
		WorkspaceAttributes,
		"id" | "description" | "createdAt" | "updatedAt"
	> {}

export class Workspace
	extends Model<WorkspaceAttributes, WorkspaceCreationAttributes>
	implements WorkspaceAttributes
{
	public id!: string;
	public name!: string;
	public description?: string;
	public color!: string;
	public icon!: string;
	public userId!: string;
	public isDefault!: boolean;
	public status!: "active" | "inactive" | "archived";

	// timestamps!
	public readonly createdAt!: Date;
	public readonly updatedAt!: Date;
}

Workspace.init(
	{
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true,
		},
		name: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		description: {
			type: DataTypes.TEXT,
			allowNull: true,
		},
		color: {
			type: DataTypes.STRING,
			allowNull: false,
			defaultValue: "#3b82f6",
		},
		icon: {
			type: DataTypes.STRING,
			allowNull: false,
			defaultValue: "mdi-briefcase",
		},
		userId: {
			type: DataTypes.UUID,
			allowNull: false,
			references: {
				model: User,
				key: "id",
			},
			onUpdate: "CASCADE",
			onDelete: "CASCADE",
		},
		isDefault: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false,
		},
		status: {
			type: DataTypes.ENUM("active", "inactive", "archived"),
			allowNull: false,
			defaultValue: "active",
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
		modelName: "Workspace",
		tableName: "workspaces",
		indexes: [
			{
				fields: ["user_id"],
			},
			{
				fields: ["status"],
			},
			{
				fields: ["user_id", "is_default"],
			},
		],
	},
);

// Associations
Workspace.belongsTo(User, { foreignKey: "userId", as: "user" });
User.hasMany(Workspace, { foreignKey: "userId", as: "workspaces" });

export default Workspace;
