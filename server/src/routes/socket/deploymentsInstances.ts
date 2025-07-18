import type { IDeploymentInstance } from '@shared/interfaces/deployment.interface.js'
import type { SocketData } from './index.js'
import { Deployment, DeploymentInstance, DeploymentInstanceAssignment, DeploymentInstanceAssignmentRole, Role } from '../../models/index.js'
import { getStatusByCategory } from '@shared/interfaces/status.interface.js'
import { Op } from 'sequelize'

export const setupDeploymentInstancesRoutes = {
	'deployment-instances:list': async ({ socket, data, callback }: SocketData) => {
		try {
			const instances = await DeploymentInstance.findAll({
				include: [
					{
						attributes: ['id', 'name', 'description'],
						model: Deployment,
						as: 'deployments',
						required: false,
						where: {
							status: 'active'
						}
					}
				],
				where: {
					status: {
						[Op.ne]: 'inactive'
					}
				},
				order: [['createdAt', 'DESC']]
			})

			callback({ success: true, instances })
		} catch (error) {
			console.error('Error listando instancias:', error)
			callback({ success: false, message: 'Error al cargar instancias' })
		}
	},

	'deployment-instances:get': async ({ socket, data, callback }: SocketData) => {
		try {
			const { deploymentId } = data

			const instances = await DeploymentInstance.findAll({
				include: [
					{
						model: DeploymentInstanceAssignment,
						as: 'assignments',
						required: true,
						attributes: [
							'id',
							'status',
							'priority',
							'assignedAt',
							'assignedBy',
							'configuration',
							'deployType',
							'executionOrder',
							'autoApprove'
						],
						include: [
							{
								model: Role,
								as: 'roles',
								required: false,
								attributes: ['id', 'name', 'description', 'level', 'status']
							}
						]
					},
					{
						attributes: ['id', 'name', 'description'],
						model: Deployment,
						as: 'deployments',
						required: true,
						where: {
							status: 'active',
							id: deploymentId
						}
					}
				],
				where: {
					status: {
						[Op.ne]: 'inactive'
					}
				},
				order: [
					[{ model: DeploymentInstanceAssignment, as: 'assignments' }, 'executionOrder', 'ASC'],
					['createdAt', 'DESC']
				]
			})

			callback({ success: true, instances })
		} catch (error) {
			console.error('Error listando instancias:', error)
			callback({ success: false, message: 'Error al cargar instancias' })
		}
	},

	'deployment-instances:create': async ({ socket, data, callback }: SocketData) => {
		try {
			const instance = await DeploymentInstance.create(data as IDeploymentInstance)
			callback({ success: true, instance })
		} catch (error) {
			console.error('Error creando instancia:', error)
			callback({ success: false, message: 'Error al crear instancia' })
		}
	},

	'deployment-instances:update': async ({ socket, data, callback }: SocketData) => {
		try {
			const { id, ...update } = data as IDeploymentInstance
			const [updatedRows] = await DeploymentInstance.update(update, {
				where: { id }
			})
			if (updatedRows > 0) {
				const updatedInstance = await DeploymentInstance.findByPk(id)
				callback({ success: true, instance: updatedInstance })
			} else {
				callback({
					success: false,
					message: 'Error al actualizar instancia'
				})
			}
		} catch (error) {
			console.error('Error listando workspaces:', error)
			callback({ success: false, message: 'Error al cargar workspaces' })
		}
	},

	'deployment-instances:delete': async ({ socket, data, callback }: SocketData) => {
		try {
			const { id } = data
			await DeploymentInstance.update({ status: 'inactive' }, { where: { id } })
			callback({ success: true })
		} catch (error) {
			console.error('Error eliminando instancia:', error)
			callback({ success: false, message: 'Error al eliminar instancia' })
		}
	}
}
