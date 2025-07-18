import { DataTypes, Model, type Optional } from "sequelize";
import { sequelize } from "../config/database.js";
import User from "./User.js";
import type { IUserSettingsServer, IUserSettingsCreate } from '@shared/interfaces/standardized.js'

// Interfaces legacy para compatibilidad
export interface UserSettingsAttributes extends IUserSettingsServer {}
export interface UserSettingsCreationAttributes extends IUserSettingsCreate {}

export class UserSettings
	extends Model<UserSettingsAttributes, UserSettingsCreationAttributes>
	implements UserSettingsAttributes
{
	public id!: string;
	public userId!: string;
	public theme!: string;
	public fontSize!: number;
	public canvasRefreshRate!: number;
	public language!: string;
	public notifications!: object;
	public performance!: object;
	public privacy!: object;

	// timestamps!
	public readonly createdAt!: Date;
	public readonly updatedAt!: Date;
}

UserSettings.init(
	{
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true,
		},
		userId: {
			type: DataTypes.UUID,
			allowNull: false,
			unique: true,
			references: {
				model: User,
				key: "id",
			},
			onUpdate: "CASCADE",
			onDelete: "CASCADE",
		},
		theme: {
			type: DataTypes.STRING,
			allowNull: false,
			defaultValue: "crystal",
		},
		fontSize: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 16,
		},
		canvasRefreshRate: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 33,
		},
		language: {
			type: DataTypes.STRING,
			allowNull: false,
			defaultValue: "es",
		},
		notifications: {
			type: DataTypes.JSON,
			allowNull: false,
			defaultValue: {
				general: true,
				workflowExecution: true,
				errors: true,
				systemUpdates: false,
				projectReminders: true,
			},
		},
		performance: {
			type: DataTypes.JSON,
			allowNull: false,
			defaultValue: {
				reducedAnimations: false,
				autoSave: true,
			},
		},
		privacy: {
			type: DataTypes.JSON,
			allowNull: false,
			defaultValue: {
				telemetry: false,
				localCache: true,
			},
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
		modelName: "UserSettings",
		tableName: "user_settings",
		indexes: [
			{
				unique: true,
				fields: ["user_id"],
			},
		],
	},
);

// Associations
UserSettings.belongsTo(User, { foreignKey: "userId", as: "user" });
User.hasOne(UserSettings, { foreignKey: "userId", as: "settings" });

export default UserSettings;
