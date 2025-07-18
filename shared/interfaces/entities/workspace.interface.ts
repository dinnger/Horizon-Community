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

export interface IWorkspaceEntity
	extends Model<
		InferAttributes<IWorkspaceEntity>,
		InferCreationAttributes<IWorkspaceEntity>
	> {
	id: CreationOptional<number>
	name: string
	description?: string
	settings: CreationOptional<object>
	is_default: CreationOptional<boolean>
	id_status: CreationOptional<ForeignKey<IGlobalStatusEntity['id']>>
	created_by: CreationOptional<ForeignKey<ISecurityUserEntity['id']>>
	created_at: CreationOptional<Date>
	updated_at: CreationOptional<Date>
	status?: NonAttribute<IGlobalStatusEntity>
	user?: NonAttribute<ISecurityUserEntity>
}

export interface IWorkspaceUserEntity
	extends Model<
		InferAttributes<IWorkspaceUserEntity>,
		InferCreationAttributes<IWorkspaceUserEntity>
	> {
	id: CreationOptional<number>
	id_workspace: ForeignKey<IWorkspaceEntity['id']>
	id_user: ForeignKey<ISecurityUserEntity['id']>
	role: CreationOptional<'owner' | 'admin' | 'member' | 'viewer'>
	is_active: CreationOptional<boolean>
	joined_at: CreationOptional<Date>
	workspace?: NonAttribute<IWorkspaceEntity>
	user?: NonAttribute<ISecurityUserEntity>
}
