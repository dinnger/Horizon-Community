import type { SocketData } from './index.js'
import {
	DeploymentQueue,
	Deployment,
	DeploymentInstance,
	DeploymentInstanceAssignment,
	Workflow,
	User,
	WorkflowHistory
} from '../../models/index.js'
import { Op } from 'sequelize'
import type { IWorkflowFull } from '@shared/interfaces/standardized.js'
import { deploymentQueueService } from '../../services/deploy.service.js'

export const setupDeploymentQueueRoutes = {
	// Listar solicitudes de despliegue
	'deployment-queue:list': async ({ socket, data, callback }: SocketData) => {
		try {
			const { page = 1, limit = 20, status, deploymentId } = data

			const whereClause: any = {}
			if (status) {
				whereClause.status = status
			}
			if (deploymentId) {
				whereClause.deploymentId = deploymentId
			}

			const offset = (page - 1) * limit

			const { rows: queueItems, count: total } = await DeploymentQueue.findAndCountAll({
				where: whereClause,
				include: [
					{
						model: Deployment,
						as: 'deployment',
						attributes: ['id', 'name', 'description', 'color'],
						required: true
					},
					{
						model: DeploymentInstance,
						as: 'instance',
						attributes: ['id', 'name', 'description'],
						required: false
					},
					{
						model: Workflow,
						as: 'workflow',
						attributes: ['id', 'name', 'description', 'version'],
						required: true
					},
					{
						model: User,
						as: 'requestedByUser',
						attributes: ['id', 'name', 'email'],
						required: false
					}
				],
				order: [
					['createdAt', 'ASC'] // Más antiguos primero (FIFO)
				],
				limit,
				offset
			})

			callback({
				success: true,
				data: {
					items: queueItems,
					pagination: {
						total,
						page,
						limit,
						totalPages: Math.ceil(total / limit)
					}
				}
			})
		} catch (error) {
			console.error('Error listando cola de despliegues:', error)
			callback({ success: false, message: 'Error al cargar la cola de despliegues' })
		}
	},

	// Crear nueva solicitud de despliegue
	'deployment-queue:create': async ({ socket, data, callback }: SocketData) => {
		try {
			const { deploymentId, workflowId, workflowVersionId, description, flow, meta = {}, scheduledAt } = data
			const { userId } = socket

			// Validar que el deployment y workflow existan
			const deployment = await Deployment.findByPk(deploymentId)
			if (!deployment) {
				callback({ success: false, message: 'Deployment no encontrado' })
				return
			}

			const workflow = await Workflow.findByPk(workflowId)
			if (!workflow) {
				callback({ success: false, message: 'Workflow no encontrado' })
				return
			}

			// Si se especifica una versión específica, validar que exista
			let flowData = flow
			if (workflowVersionId) {
				const historyEntry = await WorkflowHistory.findByPk(workflowVersionId)
				if (!historyEntry) {
					callback({ success: false, message: 'Versión de workflow no encontrada' })
					return
				}
				flowData = historyEntry.newData as IWorkflowFull
			}

			// Obtener las instancias asignadas al deployment ordenadas por executionOrder
			const deploymentInstances = await DeploymentInstanceAssignment.findAll({
				where: {
					deploymentId,
					status: 'active'
				},
				include: [
					{
						model: DeploymentInstance,
						as: 'instance',
						required: true
					}
				],
				order: [['executionOrder', 'ASC']]
			})

			let queueItem: any

			if (deploymentInstances.length > 0) {
				// Solo crear el despliegue para la primera instancia
				const firstAssignment = deploymentInstances[0] as any
				const firstInstance = firstAssignment.instance

				queueItem = await DeploymentQueue.create({
					deploymentId,
					instanceId: firstInstance.id,
					workflowId,
					workflowVersionId,
					description: description || `Despliegue de ${workflow.name} en ${deployment.name} - ${firstInstance.name}`,
					flow: flowData,
					meta: {
						...meta,
						version: workflowVersionId ? 'specific' : 'latest',
						trigger: 'publish',
						requestedBy: userId,
						instanceName: firstInstance.name,
						executionOrder: 0,
						totalInstances: deploymentInstances.length
					},
					requestedBy: userId,
					scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
					status: 'pending'
				})
			} else {
				// Si no hay instancias, crear un elemento genérico
				queueItem = await DeploymentQueue.create({
					deploymentId,
					workflowId,
					workflowVersionId,
					description: description || `Despliegue de ${workflow.name} en ${deployment.name}`,
					flow: flowData,
					meta: {
						...meta,
						version: workflowVersionId ? 'specific' : 'latest',
						trigger: 'publish',
						requestedBy: userId
					},
					requestedBy: userId,
					scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
					status: 'pending'
				})
			}

			// Cargar el item completo con las relaciones para devolver
			const completeItem = await DeploymentQueue.findByPk(queueItem.id, {
				include: [
					{
						model: Deployment,
						as: 'deployment',
						attributes: ['id', 'name', 'description', 'color']
					},
					{
						model: DeploymentInstance,
						as: 'instance',
						attributes: ['id', 'name', 'description']
					},
					{
						model: Workflow,
						as: 'workflow',
						attributes: ['id', 'name', 'description', 'version']
					},
					{
						model: User,
						as: 'requestedByUser',
						attributes: ['id', 'name', 'email']
					}
				]
			})

			callback({ success: true, queueItem: completeItem })

			// Procesar cola creada con el servicio
			await deploymentQueueService.processQueueCreated(completeItem)
		} catch (error) {
			console.error('Error creando solicitud de despliegue:', error)
			callback({ success: false, message: 'Error al crear la solicitud de despliegue' })
		}
	},

	// Actualizar solicitud de despliegue
	'deployment-queue:update': async ({ socket, data, callback }: SocketData) => {
		try {
			const { id, ...updates } = data

			const queueItem = await DeploymentQueue.findByPk(id)
			if (!queueItem) {
				callback({ success: false, message: 'Solicitud de despliegue no encontrada' })
				return
			}

			// Validar transiciones de estado
			if (updates.status) {
				const validTransitions: Record<string, string[]> = {
					pending: ['running', 'cancelled'],
					waiting: ['pending', 'cancelled'], // waiting puede pasar a pending o cancelarse
					running: ['success', 'failed'],
					success: [], // No se puede cambiar desde success
					failed: ['pending'], // Se puede reintentar
					cancelled: ['pending'] // Se puede reactivar
				}

				const currentStatus = queueItem.status as string
				if (!validTransitions[currentStatus]?.includes(updates.status)) {
					callback({
						success: false,
						message: `No se puede cambiar de estado '${queueItem.status}' a '${updates.status}'`
					})
					return
				}

				// Actualizar timestamps según el estado
				if (updates.status === 'running' && !queueItem.startedAt) {
					updates.startedAt = new Date()
				} else if (['success', 'failed'].includes(updates.status) && !queueItem.completedAt) {
					updates.completedAt = new Date()
				}
			}

			const previousStatus = queueItem.status
			await queueItem.update(updates)

			// Si el despliegue se completó exitosamente, crear el siguiente en la secuencia
			if (updates.status === 'success' && queueItem.instanceId) {
				// Obtener todas las instancias del deployment ordenadas por executionOrder
				const deploymentInstances = await DeploymentInstanceAssignment.findAll({
					where: {
						deploymentId: queueItem.deploymentId,
						status: 'active'
					},
					include: [
						{
							model: DeploymentInstance,
							as: 'instance',
							required: true
						}
					],
					order: [['executionOrder', 'ASC']]
				})

				// Encontrar la instancia actual y la siguiente
				const currentInstanceIndex = deploymentInstances.findIndex((assignment: any) => assignment.instance.id === queueItem.instanceId)

				if (currentInstanceIndex !== -1 && currentInstanceIndex + 1 < deploymentInstances.length) {
					// Hay una siguiente instancia, crear el despliegue
					const nextAssignment = deploymentInstances[currentInstanceIndex + 1] as any
					const nextInstance = nextAssignment.instance

					// Verificar que no exista ya un despliegue para esta instancia
					const existingQueue = await DeploymentQueue.findOne({
						where: {
							deploymentId: queueItem.deploymentId,
							instanceId: nextInstance.id,
							workflowId: queueItem.workflowId,
							status: { [Op.in]: ['pending', 'running', 'waiting'] }
						}
					})

					if (!existingQueue) {
						await DeploymentQueue.create({
							deploymentId: queueItem.deploymentId,
							instanceId: nextInstance.id,
							workflowId: queueItem.workflowId,
							workflowVersionId: queueItem.workflowVersionId,
							description: `Despliegue de ${queueItem.flow.info?.name || 'workflow'} en instancia ${nextInstance.name}`,
							flow: queueItem.flow,
							meta: {
								...queueItem.meta,
								instanceName: nextInstance.name,
								executionOrder: currentInstanceIndex + 1,
								previousQueueItemId: queueItem.id
							} as any,
							requestedBy: queueItem.requestedBy,
							scheduledAt: queueItem.scheduledAt,
							status: 'pending'
						})
					}
				}
			}

			// Cargar el item actualizado con las relaciones
			const updatedItem = await DeploymentQueue.findByPk(id, {
				include: [
					{
						model: Deployment,
						as: 'deployment',
						attributes: ['id', 'name', 'description', 'color']
					},
					{
						model: Workflow,
						as: 'workflow',
						attributes: ['id', 'name', 'description', 'version']
					},
					{
						model: User,
						as: 'requestedByUser',
						attributes: ['id', 'name', 'email']
					}
				]
			})

			callback({ success: true, queueItem: updatedItem })

			// Procesar cola actualizada con el servicio
			await deploymentQueueService.processQueueUpdated(updatedItem, previousStatus)
		} catch (error) {
			console.error('Error actualizando solicitud de despliegue:', error)
			callback({ success: false, message: 'Error al actualizar la solicitud de despliegue' })
		}
	},

	// Cancelar solicitud de despliegue
	'deployment-queue:cancel': async ({ socket, data, callback }: SocketData) => {
		try {
			const { id } = data

			const queueItem = await DeploymentQueue.findByPk(id)
			if (!queueItem) {
				callback({ success: false, message: 'Solicitud de despliegue no encontrada' })
				return
			}

			if (!['pending', 'running'].includes(queueItem.status)) {
				callback({
					success: false,
					message: `No se puede cancelar una solicitud en estado '${queueItem.status}'`
				})
				return
			}

			await queueItem.update({
				status: 'cancelled',
				completedAt: new Date(),
				errorMessage: 'Cancelado por el usuario'
			})

			callback({ success: true })
		} catch (error) {
			console.error('Error cancelando solicitud de despliegue:', error)
			callback({ success: false, message: 'Error al cancelar la solicitud de despliegue' })
		}
	},

	// Eliminar solicitud de despliegue
	'deployment-queue:delete': async ({ socket, data, callback }: SocketData) => {
		try {
			const { id } = data

			const queueItem = await DeploymentQueue.findByPk(id)
			if (!queueItem) {
				callback({ success: false, message: 'Solicitud de despliegue no encontrada' })
				return
			}

			if (queueItem.status === 'running') {
				callback({
					success: false,
					message: 'No se puede eliminar una solicitud que está ejecutándose'
				})
				return
			}

			await queueItem.destroy()

			callback({ success: true })
		} catch (error) {
			console.error('Error eliminando solicitud de despliegue:', error)
			callback({ success: false, message: 'Error al eliminar la solicitud de despliegue' })
		}
	},

	// Obtener próxima solicitud para procesar (usado por el sistema de despliegue)
	'deployment-queue:get-next': async ({ socket, data, callback }: SocketData) => {
		try {
			const nextItem = await DeploymentQueue.findOne({
				where: {
					status: 'pending',
					[Op.or]: [{ scheduledAt: { [Op.eq]: null } }, { scheduledAt: { [Op.lte]: new Date() } }]
				} as any,
				include: [
					{
						model: Deployment,
						as: 'deployment',
						required: true
					},
					{
						model: DeploymentInstance,
						as: 'instance',
						required: false
					},
					{
						model: Workflow,
						as: 'workflow',
						required: true
					}
				],
				order: [
					['createdAt', 'ASC'] // FIFO - más antiguos primero
				]
			})

			if (nextItem) {
				// Marcar como en proceso
				await nextItem.update({
					status: 'running',
					startedAt: new Date()
				})
			}

			callback({
				success: true,
				queueItem: nextItem
			})
		} catch (error) {
			console.error('Error obteniendo próxima solicitud de despliegue:', error)
			callback({ success: false, message: 'Error al obtener la próxima solicitud de despliegue' })
		}
	},

	// Obtener estadísticas de la cola
	'deployment-queue:stats': async ({ socket, data, callback }: SocketData) => {
		try {
			const stats = await DeploymentQueue.findAll({
				attributes: ['status', [DeploymentQueue.sequelize?.fn('COUNT', '*') || 'COUNT(*)', 'count']],
				group: ['status']
			})

			const statsMap = stats.reduce((acc: Record<string, number>, stat: any) => {
				acc[stat.status] = Number.parseInt(stat.getDataValue('count'))
				return acc
			}, {})

			// Asegurar que todos los estados tengan un valor
			const allStats = {
				pending: statsMap.pending || 0,
				waiting: statsMap.waiting || 0, // Agregar waiting
				running: statsMap.running || 0,
				success: statsMap.success || 0,
				failed: statsMap.failed || 0,
				cancelled: statsMap.cancelled || 0
			}

			callback({ success: true, stats: allStats })
		} catch (error) {
			console.error('Error obteniendo estadísticas de la cola:', error)
			callback({ success: false, message: 'Error al obtener las estadísticas' })
		}
	}
}
