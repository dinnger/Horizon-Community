import { DataTypes, Model, type Optional } from "sequelize";
import { sequelize } from "../config/database.js";

export interface PermissionAttributes {
	id: string;
	module: string; // 'workspaces', 'projects', 'workflows', 'settings', 'users', etc.
	action: string; // 'create', 'read', 'update', 'delete', 'execute', 'admin'
	resource?: string; // Recurso específico opcional ('own', 'all', specific ID)
	scope: 'own' | 'workspace' | 'project' | 'global'; // Alcance del permiso
	description: string;
	status: "active" | "inactive" | "archived";
	priority: number; // Para resolver conflictos de permisos (mayor = más específico)
	createdAt: Date;
	updatedAt: Date;
}

export interface PermissionCreationAttributes
	extends Optional<
		PermissionAttributes,
		"id" | "resource" | "priority" | "createdAt" | "updatedAt"
	> {}

export class Permission
	extends Model<PermissionAttributes, PermissionCreationAttributes>
	implements PermissionAttributes
{
	public id!: string;
	public module!: string;
	public action!: string;
	public resource?: string;
	public scope!: 'own' | 'workspace' | 'project' | 'global';
	public description!: string;
	public status!: "active" | "inactive" | "archived";
	public priority!: number;

	// timestamps!
	public readonly createdAt!: Date;
	public readonly updatedAt!: Date;
}

Permission.init(
	{
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true,
		},
		module: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		action: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		resource: {
			type: DataTypes.STRING,
			allowNull: true,
		},
		scope: {
			type: DataTypes.ENUM('own', 'workspace', 'project', 'global'),
			allowNull: false,
			defaultValue: 'own',
		},
		description: {
			type: DataTypes.TEXT,
			allowNull: false,
		},
		status: {
			type: DataTypes.ENUM("active", "inactive", "archived"),
			allowNull: false,
			defaultValue: "active",
		},
		priority: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
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
		modelName: "Permission",
		tableName: "permissions",
		indexes: [
			{
				unique: true,
				fields: ["module", "action", "resource", "scope"],
			},
			{
				fields: ["module"],
			},
			{
				fields: ["status"],
			},
			{
				fields: ["scope"],
			},
			{
				fields: ["priority"],
			},
		],
	},
);

export default Permission;
