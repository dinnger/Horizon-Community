import type { IDeployment } from '@shared/interfaces/deployment.interface.js'
import type { SocketData } from './index.js'
import { Deployment, DeploymentInstance, DeploymentInstanceAssignment, DeploymentInstanceAssignmentRole } from '../../models/index.js'
import { Op } from 'sequelize'

export const setupDeploymentRoutes = {
	'deployments:list': async ({ socket, data, callback }: SocketData) => {
		try {
			const deployments = await Deployment.findAll({
				where: {
					status: {
						[Op.ne]: 'inactive'
					}
				},
				include: [
					{
						attributes: ['id', 'name', 'description'],
						model: DeploymentInstance,
						as: 'instances',
						through: {
							attributes: [], // Omitir atributos de DeploymentInstanceAssignment
							where: {
								status: 'active'
							}
						},
						required: false
					}
				],
				order: [['createdAt', 'DESC']]
			})

			callback({ success: true, deployments })
		} catch (error) {
			console.error('Error listando deployments:', error)
			callback({ success: false, message: 'Error al cargar deployments' })
		}
	},

	'deployments:create': async ({ socket, data, callback }: SocketData) => {
		try {
			const { deployment: deploymentData, instances } = data

			// Si vienen instancias, usar transacción completa
			if (instances && instances.length > 0) {
				const transaction = await Deployment.sequelize?.transaction()

				if (!transaction) {
					callback({ success: false, message: 'Error al iniciar transacción' })
					return
				}

				try {
					// 1. Crear el deployment
					const deployment = await Deployment.create(deploymentData || data, { transaction })

					const assignments: any[] = []

					// 2. Crear las asignaciones
					for (const instance of instances) {
						if (instance.deployType) {
							// Crear asignación de instancia al deployment
							const assignment = await DeploymentInstanceAssignment.create(
								{
									deploymentId: deployment.id,
									instanceId: instance.id,
									deployType: instance.deployType,
									priority: 0,
									executionOrder: instance.executionOrder || 0,
									autoApprove: instance.autoApprove || false,
									configuration: instance.deployTypeConfiguration || {}
								},
								{ transaction }
							)

							assignments.push(assignment)

							// 3. Si hay roles, crear las asignaciones de roles
							if (instance.roles && instance.roles.length > 0) {
								await DeploymentInstanceAssignmentRole.bulkCreate(
									instance.roles.map((r: any) => ({
										assignmentId: assignment.id,
										roleId: r.id,
										grantedAt: new Date(),
										grantedBy: null,
										expiresAt: null,
										status: 'active'
									})),
									{ transaction }
								)
							}
						}
					}

					await transaction.commit()

					callback({
						success: true,
						deployment,
						assignments
					})
				} catch (error) {
					await transaction.rollback()
					console.error('Error creando deployment con instancias:', error)
					callback({ success: false, message: 'Error al crear deployment con instancias' })
				}
			} else {
				// Crear solo el deployment (comportamiento original)
				const deployment = await Deployment.create(deploymentData || data)
				callback({ success: true, deployment })
			}
		} catch (error) {
			console.error('Error creando deployment:', error)
			callback({ success: false, message: 'Error al crear deployment' })
		}
	},

	'deployments:update': async ({ socket, data, callback }: SocketData) => {
		try {
			const { id, deployment: deploymentData, instances, ...update } = data

			// Si vienen instancias, usar transacción completa
			if (instances && instances.length > 0) {
				const transaction = await Deployment.sequelize?.transaction()

				if (!transaction) {
					callback({ success: false, message: 'Error al iniciar transacción' })
					return
				}

				try {
					const deploymentUpdateData = deploymentData || update
					const deploymentId = id || deploymentUpdateData.id

					// 1. Actualizar el deployment
					await Deployment.update(deploymentUpdateData, {
						where: { id: deploymentId },
						transaction
					})

					// 2. Desactivar todas las asignaciones anteriores para este deployment
					await DeploymentInstanceAssignment.destroy({
						where: { deploymentId, status: 'active' },
						transaction
					})

					const assignments: any[] = []

					// 3. Crear las nuevas asignaciones
					for (const instance of instances) {
						if (instance.deployType) {
							// Crear nueva asignación de instancia al deployment
							const assignment = await DeploymentInstanceAssignment.create(
								{
									deploymentId,
									instanceId: instance.id,
									deployType: instance.deployType,
									priority: 0,
									executionOrder: instance.executionOrder || 0,
									autoApprove: instance.autoApprove || false,
									configuration: instance.deployTypeConfiguration || {}
								},
								{ transaction }
							)

							assignments.push(assignment)

							// 4. Si hay roles, crear las asignaciones de roles
							if (instance.roles && instance.roles.length > 0) {
								await DeploymentInstanceAssignmentRole.bulkCreate(
									instance.roles.map((r: any) => ({
										assignmentId: assignment.id,
										roleId: r.id,
										grantedAt: new Date(),
										grantedBy: null,
										expiresAt: null,
										status: 'active'
									})),
									{ transaction }
								)
							}
						}
					}

					// 5. Obtener el deployment actualizado
					const updatedDeployment = await Deployment.findByPk(deploymentId, {
						include: [
							{
								model: DeploymentInstance,
								as: 'instances',
								through: {
									where: { status: 'active' }
								},
								required: false
							}
						],
						transaction
					})

					await transaction.commit()

					callback({
						success: true,
						deployment: updatedDeployment,
						assignments
					})
				} catch (error) {
					await transaction.rollback()
					console.error('Error actualizando deployment con instancias:', error)
					callback({ success: false, message: 'Error al actualizar deployment con instancias' })
				}
			} else {
				// Actualizar solo el deployment (comportamiento original)
				const deploymentUpdateData = deploymentData || update
				const deploymentId = id || deploymentUpdateData.id

				const [updatedRows] = await Deployment.update(deploymentUpdateData, {
					where: { id: deploymentId }
				})

				if (updatedRows > 0) {
					const updatedDeployment = await Deployment.findByPk(deploymentId, {
						include: [
							{
								model: DeploymentInstance,
								as: 'instances',
								through: {
									where: {
										status: 'active'
									}
								},
								required: false
							}
						]
					})
					callback({ success: true, deployment: updatedDeployment })
				} else {
					callback({
						success: false,
						message: 'Error al actualizar deployment'
					})
				}
			}
		} catch (error) {
			console.error('Error actualizando deployment:', error)
			callback({ success: false, message: 'Error al actualizar deployment' })
		}
	},

	'deployments:delete': async ({ socket, data, callback }: SocketData) => {
		try {
			const { id } = data
			await Deployment.update({ status: 'inactive' }, { where: { id } })
			callback({ success: true })
		} catch (error) {
			console.error('Error eliminando deployment:', error)
			callback({ success: false, message: 'Error al eliminar deployment' })
		}
	},

	'deployments:assign-instance': async ({ socket, data, callback }: SocketData) => {
		try {
			const { deploymentId, instanceId, deployType, priority = 0, configuration = {} } = data

			const assignment = await DeploymentInstanceAssignment.create({
				deploymentId,
				instanceId,
				deployType,
				priority,
				configuration
			})

			callback({ success: true, assignment })
		} catch (error) {
			console.error('Error asignando instancia a deployment:', error)
			callback({ success: false, message: 'Error al asignar instancia' })
		}
	},

	'deployments:unassign-instance': async ({ socket, data, callback }: SocketData) => {
		try {
			const { deploymentId, instanceId } = data

			await DeploymentInstanceAssignment.update(
				{ status: 'inactive' },
				{
					where: {
						deploymentId,
						instanceId,
						status: 'active'
					}
				}
			)

			callback({ success: true })
		} catch (error) {
			console.error('Error desasignando instancia de deployment:', error)
			callback({ success: false, message: 'Error al desasignar instancia' })
		}
	}
}
