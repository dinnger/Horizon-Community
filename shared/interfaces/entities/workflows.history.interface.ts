import type { CreationOptional, ForeignKey, InferAttributes, InferCreationAttributes, Model, NonAttribute } from 'sequelize'
import type { IGlobalStatusEntity } from './global.interface.js'
import type { IProjectsProjectsEntity } from './projects.interface.js'
import type { ISecurityUserEntity } from './security.interface.js'
import type { IWorkspaceEntity } from './workspace.interface.js'
import type { IWorkflowsFlowsEntity } from './workflows.flows.interface.js'
import type { IWorkflowFull } from '../standardized.js'

export interface IWorkflowsWorkflowsHistoryEntity
	extends Model<InferAttributes<IWorkflowsWorkflowsHistoryEntity>, InferCreationAttributes<IWorkflowsWorkflowsHistoryEntity>> {
	id: CreationOptional<number>
	id_flow: ForeignKey<IWorkflowsFlowsEntity['id']>
	name: string
	description: string | null
	flow: IWorkflowFull
	version: CreationOptional<string>
	id_workspace: CreationOptional<ForeignKey<IWorkspaceEntity['id']>>
	id_status: CreationOptional<ForeignKey<IGlobalStatusEntity['id']>>
	created_by: CreationOptional<ForeignKey<ISecurityUserEntity['id']>>
	project?: NonAttribute<IProjectsProjectsEntity>
	status?: NonAttribute<IGlobalStatusEntity>
	user?: NonAttribute<ISecurityUserEntity>
	workspace?: NonAttribute<IWorkspaceEntity>
	worker_status?: string
}
