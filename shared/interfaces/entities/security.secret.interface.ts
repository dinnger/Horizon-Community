import type {
	CreationOptional,
	ForeignKey,
	InferAttributes,
	InferCreationAttributes,
	Model,
	NonAttribute
} from 'sequelize'
import type { IGlobalStatusEntity } from './global.interface.js'
import type { ISecurityUserEntity } from './security.interface.js'
import type { IWorkspaceEntity } from './workspace.interface.js'

export interface ISecuritySecretEntity
	extends Model<
		InferAttributes<ISecuritySecretEntity>,
		InferCreationAttributes<ISecuritySecretEntity>
	> {
	id: CreationOptional<number>
	name: string
	description: string
	type: 'DATABASE' | 'VARIABLES'
	subType: CreationOptional<
		'MYSQL' | 'POSTGRES' | 'SQLITE' | 'MARIADB' | 'MSSQL' | 'ORACLE'
	>
	value: string
	id_workspace: CreationOptional<ForeignKey<IWorkspaceEntity['id']>>
	id_status: CreationOptional<ForeignKey<IGlobalStatusEntity['id']>>
	created_by: CreationOptional<ForeignKey<ISecurityUserEntity['id']>>
	status: NonAttribute<IGlobalStatusEntity>
	user: NonAttribute<ISecurityUserEntity>
	workspace?: NonAttribute<IWorkspaceEntity>
}
