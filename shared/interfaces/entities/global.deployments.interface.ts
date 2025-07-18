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

export interface IGlobalDeploymentsEntityAttributes {
	id?: CreationOptional<number>
	name: string
	description: string
	plugin: string
	plugin_name: string
	properties: object
	id_status?: CreationOptional<ForeignKey<IGlobalStatusEntity['id']>>
	created_by?: CreationOptional<ForeignKey<ISecurityUserEntity['id']>>
	status?: NonAttribute<IGlobalStatusEntity>
	user?: NonAttribute<ISecurityUserEntity>
}

export interface IGlobalDeploymentsEntity
	extends Model<
			InferAttributes<IGlobalDeploymentsEntity>,
			InferCreationAttributes<IGlobalDeploymentsEntity>
		>,
		IGlobalDeploymentsEntityAttributes {}
