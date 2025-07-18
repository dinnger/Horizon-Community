import { DataTypes, Model, type Optional } from "sequelize";
import { sequelize } from "../config/database.js";
import Role from "./Role.js";
import Permission from "./Permission.js";

export interface RolePermissionAttributes {
	id: string;
	roleId: string;
	permissionId: string;
	granted: boolean; // true = permitido, false = denegado explícitamente
	createdAt: Date;
	updatedAt: Date;
}

export interface RolePermissionCreationAttributes
	extends Optional<
		RolePermissionAttributes,
		"id" | "createdAt" | "updatedAt"
	> {}

export class RolePermission
	extends Model<RolePermissionAttributes, RolePermissionCreationAttributes>
	implements RolePermissionAttributes
{
	public id!: string;
	public roleId!: string;
	public permissionId!: string;
	public granted!: boolean;

	// timestamps!
	public readonly createdAt!: Date;
	public readonly updatedAt!: Date;
}

RolePermission.init(
	{
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true,
		},
		roleId: {
			type: DataTypes.UUID,
			allowNull: false,
			references: {
				model: Role,
				key: "id",
			},
			onUpdate: "CASCADE",
			onDelete: "CASCADE",
		},
		permissionId: {
			type: DataTypes.UUID,
			allowNull: false,
			references: {
				model: Permission,
				key: "id",
			},
			onUpdate: "CASCADE",
			onDelete: "CASCADE",
		},
		granted: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: true,
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
		modelName: "RolePermission",
		tableName: "role_permissions",
		indexes: [
			{
				unique: true,
				fields: ["role_id", "permission_id"],
			},
			{
				fields: ["role_id"],
			},
			{
				fields: ["permission_id"],
			},
			{
				fields: ["granted"],
			},
		],
	},
);

// Associations
RolePermission.belongsTo(Role, { foreignKey: "roleId", as: "role" });
RolePermission.belongsTo(Permission, {
	foreignKey: "permissionId",
	as: "permission",
});

Role.belongsToMany(Permission, {
	through: RolePermission,
	foreignKey: "roleId",
	otherKey: "permissionId",
	as: "permissions",
});

Permission.belongsToMany(Role, {
	through: RolePermission,
	foreignKey: "permissionId",
	otherKey: "roleId",
	as: "roles",
});

export default RolePermission;
