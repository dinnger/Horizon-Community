import type { CreationOptional, ForeignKey, InferAttributes, InferCreationAttributes, Model, NonAttribute } from 'sequelize'
import type { IGlobalStatusEntity } from './global.interface.js'
import type { ISecurityUserEntity } from './security.interface.js'
import type { IGlobalDeploymentsEntity } from './global.deployments.interface.js'
import type { IWorkflowsWorkflowsHistoryEntity } from './workflows.history.interface.js'
import type { IWorkflowsFlowsEntity } from './workflows.flows.interface.js'
import type { IWorkflowFull } from '../standardized.js'

export interface IGlobalDeploymentsQueueEntity
	extends Model<InferAttributes<IGlobalDeploymentsQueueEntity>, InferCreationAttributes<IGlobalDeploymentsQueueEntity>> {
	id: CreationOptional<number>
	id_deployment: ForeignKey<IGlobalDeploymentsEntity['id']>
	id_flow: ForeignKey<IWorkflowsFlowsEntity['id']>
	id_flow_history: ForeignKey<IWorkflowsWorkflowsHistoryEntity['id']>
	description: string
	flow: IWorkflowFull
	meta: CreationOptional<{ path: string }>
	id_status: CreationOptional<ForeignKey<IGlobalStatusEntity['id']>>
	created_by: CreationOptional<ForeignKey<ISecurityUserEntity['id']>>
	workflow: NonAttribute<IWorkflowsFlowsEntity>
	deployment: NonAttribute<IGlobalDeploymentsEntity>
	status: NonAttribute<IGlobalStatusEntity>
	user: NonAttribute<ISecurityUserEntity>
}
