import type {
	CreationOptional,
	ForeignKey,
	InferAttributes,
	InferCreationAttributes,
	Model,
	NonAttribute
} from 'sequelize'
import type { IGlobalStatusEntity } from './global.interface.js'
import type { IWorkspaceEntity } from './workspace.interface.js'

export interface ISecurityUserEntity
	extends Model<
		InferAttributes<ISecurityUserEntity>,
		InferCreationAttributes<ISecurityUserEntity>
	> {
	id: number
	name: string
	alias: string
	password: string
	is_temporal: boolean
	id_google?: object | null
	id_status: CreationOptional<ForeignKey<IGlobalStatusEntity['id']>>
	last_login?: Date | null
}

export interface ISecurityPermissionEntity
	extends Model<
		InferAttributes<ISecurityPermissionEntity>,
		InferCreationAttributes<ISecurityPermissionEntity>
	> {
	id: CreationOptional<number>
	slug: string
	name: string
	description: string
	id_workspace: CreationOptional<ForeignKey<IWorkspaceEntity['id']>>
	id_status: CreationOptional<ForeignKey<IGlobalStatusEntity['id']>>
	created_by: CreationOptional<ForeignKey<ISecurityUserEntity['id']>>
	status?: NonAttribute<IGlobalStatusEntity>
	user: NonAttribute<ISecurityUserEntity>
	workspace?: NonAttribute<IWorkspaceEntity>
}

export interface ISecurityRoleEntity
	extends Model<
		InferAttributes<ISecurityRoleEntity>,
		InferCreationAttributes<ISecurityRoleEntity>
	> {
	id: CreationOptional<number>
	name: string
	description: string
	tags: string[]
	id_workspace: CreationOptional<ForeignKey<IWorkspaceEntity['id']>>
	id_status: CreationOptional<ForeignKey<IGlobalStatusEntity['id']>>
	created_by: CreationOptional<ForeignKey<ISecurityUserEntity['id']>>
	workspace?: NonAttribute<IWorkspaceEntity>
}

export interface ISecurityDeployEntity
	extends Model<
		InferAttributes<ISecurityDeployEntity>,
		InferCreationAttributes<ISecurityDeployEntity>
	> {
	id: CreationOptional<number>
	name: string
	type: string
	description: string
	version: CreationOptional<string>
	properties: object
	id_status: CreationOptional<ForeignKey<IGlobalStatusEntity['id']>>
	created_by: CreationOptional<ForeignKey<ISecurityUserEntity['id']>>
}

export interface ISecurityCompanyEntity
	extends Model<
		InferAttributes<ISecurityCompanyEntity>,
		InferCreationAttributes<ISecurityCompanyEntity>
	> {
	id: CreationOptional<number>
	name: string
	description: string
	version: CreationOptional<string>
	properties: object
	id_status: CreationOptional<ForeignKey<IGlobalStatusEntity['id']>>
	created_by: CreationOptional<ForeignKey<ISecurityUserEntity['id']>>
}

export interface ISecurityCredentialEntity
	extends Model<
		InferAttributes<ISecurityCredentialEntity>,
		InferCreationAttributes<ISecurityCredentialEntity>
	> {
	id: CreationOptional<number>
	name: string
	type: string
	properties: string
	result: string
	id_workspace: CreationOptional<ForeignKey<IWorkspaceEntity['id']>>
	id_status: CreationOptional<ForeignKey<IGlobalStatusEntity['id']>>
	created_by: CreationOptional<ForeignKey<ISecurityUserEntity['id']>>
	workspace?: NonAttribute<IWorkspaceEntity>
}
