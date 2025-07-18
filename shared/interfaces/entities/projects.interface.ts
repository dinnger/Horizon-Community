import type { CreationOptional, ForeignKey, InferAttributes, InferCreationAttributes, Model, NonAttribute } from 'sequelize'
import type { IGlobalStatusEntity } from './global.interface.js'
import type { ISecurityUserEntity } from './security.interface.js'
import type { IWorkspaceEntity } from './workspace.interface.js'

export interface IProjectsProjectsEntity
	extends Model<InferAttributes<IProjectsProjectsEntity>, InferCreationAttributes<IProjectsProjectsEntity>> {
	id: CreationOptional<number>
	uid: CreationOptional<string>
	name: string
	description: string
	shared_with: CreationOptional<number[]>
	version: CreationOptional<string>
	id_workspace: CreationOptional<ForeignKey<IWorkspaceEntity['id']>>
	id_status: CreationOptional<ForeignKey<IGlobalStatusEntity['id']>>
	created_by: CreationOptional<ForeignKey<ISecurityUserEntity['id']>>
	transport_type: CreationOptional<string>
	transport_pattern: CreationOptional<string>
	transport_config: CreationOptional<object>
	deployment_id: CreationOptional<string>
	deployment_configuration: CreationOptional<object>
	workspace?: NonAttribute<IWorkspaceEntity>
}
