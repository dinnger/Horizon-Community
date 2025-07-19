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
import { compressPathToBase64 } from '@server/src/services/deployDownload.service.js'

export const setupDeploymentQueueRoutes = {
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

			// Si no hay instancias, crear un elemento genérico
			const queueItem = await DeploymentQueue.create({
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

			// Cargar el item completo con las relaciones para devolver
			const completeItem = await DeploymentQueue.findByPk(queueItem.id, {
				include: [
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
			// Procesar cola creada con el servicio
			const path = await deploymentQueueService.processQueueCreated(completeItem)
			if (path) {
				const base64 = await compressPathToBase64(path)
				return callback({ success: true, base64 })
			}
			callback({ success: true })
		} catch (error) {
			console.error('Error creando solicitud de despliegue:', error)
			callback({ success: false, message: 'Error al crear la solicitud de despliegue' })
		}
	}
}
