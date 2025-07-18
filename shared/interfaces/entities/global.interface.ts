import type { InferAttributes, InferCreationAttributes, Model } from 'sequelize'

export interface IGlobalStatusEntity
	extends Model<
		InferAttributes<IGlobalStatusEntity>,
		InferCreationAttributes<IGlobalStatusEntity>
	> {
	id: number
	name: string
	description: string
	color: string
}
