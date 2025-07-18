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
import type { IWorkflowsFlowsEntity } from './workflows.flows.interface.js'

export interface IWorkflowsEnvsEntity
	extends Model<
		InferAttributes<IWorkflowsEnvsEntity>,
		InferCreationAttributes<IWorkflowsEnvsEntity>
	> {
	id: CreationOptional<number>
	id_flow: ForeignKey<IWorkflowsFlowsEntity['id']>
	data: { [key: string]: string }
	id_workspace: CreationOptional<ForeignKey<IWorkspaceEntity['id']>>
	id_status: CreationOptional<ForeignKey<IGlobalStatusEntity['id']>>
	created_by: CreationOptional<ForeignKey<ISecurityUserEntity['id']>>
	status?: NonAttribute<IGlobalStatusEntity>
	user?: NonAttribute<ISecurityUserEntity>
	workspace?: NonAttribute<IWorkspaceEntity>
}
