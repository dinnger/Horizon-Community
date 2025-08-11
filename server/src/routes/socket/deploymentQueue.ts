import type { SocketData } from './index.js'
import {
	DeploymentQueue,
	Deployment,
	DeploymentInstance,
	DeploymentInstanceAssignment,
	Workflow,
	User,
	WorkflowHistory,
	Project
} from '../../models/index.js'
import { Op } from 'sequelize'
import type { IWorkflowDataSave, IWorkflowFull, IWorkflowSaveFull } from '@shared/interfaces/standardized.js'
import { deploymentQueueService } from '../../services/deploy.service.js'
import { compressPathToBase64 } from '@server/src/services/deployDownload.service.js'
import { setupWorkflowRoutes } from './workflows.js'

export const setupDeploymentQueueRoutes = {
	// Crear nueva solicitud de despliegue
	'deployment-queue:create': async ({ socket, data, callback, eventRouter }: SocketData) => {
		try {
			const { workspaceId, deploymentId, workflowId, workflowVersionId, description, meta = {}, scheduledAt } = data
			const { userId } = socket

			const workflow = await Workflow.findOne({
				include: [
					{
						model: Project,
						as: 'project',
						attributes: ['id'],
						where: {
							workspaceId
						}
					}
				],
				where: {
					id: workflowId
				}
			})
			if (!workflow) {
				callback({ success: false, message: 'Workflow no encontrado' })
				return
			}

			// Obtener las instancias asignadas al deployment ordenadas por executionOrder
			// const deploymentInstances = await DeploymentInstanceAssignment.findAll({
			// 	where: {
			// 		deploymentId,
			// 		status: 'active'
			// 	},
			// 	include: [
			// 		{
			// 			model: DeploymentInstance,
			// 			as: 'instance',
			// 			required: true
			// 		}
			// 	],
			// 	order: [['executionOrder', 'ASC']]
			// })

			const flowData: IWorkflowSaveFull = {
				info: {
					name: workflow.name,
					uid: workflow.id
				},
				version: workflow.version,
				properties: workflow.properties,
				...workflow.workflowData,
				environment: [],
				secrets: []
			}

			// Si no hay instancias, crear un elemento genérico
			const queueItem = await DeploymentQueue.create({
				workflowId,
				workflowVersionId,
				description: description || `Despliegue de ${workflow.name}`,
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
