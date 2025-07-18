import type {
	CreationOptional,
	ForeignKey,
	InferAttributes,
	InferCreationAttributes,
	Model,
	NonAttribute
} from 'sequelize'
import type { IGlobalStatusEntity } from './global.interface.js'
import type { IProjectsProjectsEntity } from './projects.interface.js'
import type { ISecurityUserEntity } from './security.interface.js'
import type { IWorkspaceEntity } from './workspace.interface.js'
import type { IWorkflowsEnvsEntity } from './workflows.envs.interface.js'
import { IWorkflowFull } from '../standardized.js'

export interface IWorkflowsFlowsEntity
	extends Model<
		InferAttributes<IWorkflowsFlowsEntity>,
		InferCreationAttributes<IWorkflowsFlowsEntity>
	> {
	id: CreationOptional<number>
	id_project: ForeignKey<IProjectsProjectsEntity['id']>
	uid: CreationOptional<string>
	name: string
	description: string | null
	shared_with: CreationOptional<number[]>
	flow: IWorkflowFull
	version: CreationOptional<string>
	id_deploy: CreationOptional<number>
	id_envs: CreationOptional<number>
	id_workspace: CreationOptional<ForeignKey<IWorkspaceEntity['id']>>
	id_status: CreationOptional<ForeignKey<IGlobalStatusEntity['id']>>
	created_by: CreationOptional<ForeignKey<ISecurityUserEntity['id']>>
	project?: NonAttribute<IProjectsProjectsEntity>
	status?: NonAttribute<IGlobalStatusEntity>
	user?: NonAttribute<ISecurityUserEntity>
	workspace?: NonAttribute<IWorkspaceEntity>
	worker_status?: string
	deployment?: NonAttribute<IWorkflowsFlowsEntity>
	variables?: NonAttribute<IWorkflowsEnvsEntity>
}
