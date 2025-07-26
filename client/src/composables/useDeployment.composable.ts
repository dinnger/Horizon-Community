import socketService from '@/services/socket'
import { useDeploymentStore, useProjectsStore, useWorkspaceStore } from '@/stores'

interface WorkflowPublicationValidationResult {
	type: 'automatic' | 'manual'
	workflowInfo: {
		id: string
		name: string
		description?: string
	}
	autoDeployment?: {
		deploymentId: string
		deploymentName: string
		projectName: string
	}
}

export function useDeploymentComposable() {
	const deploymentStore = useDeploymentStore()
	const projectStore = useProjectsStore()
	const workspaceStore = useWorkspaceStore()

	// Validar y preparar publicación de workflow
	const validateAndPrepareWorkflowPublication = async (workflowId: string): Promise<WorkflowPublicationValidationResult> => {
		try {
			deploymentStore.loading = true
			deploymentStore.error = null

			// Obtener información del workflow
			const workflow = await socketService.getWorkflowsById({ workspaceId: workspaceStore.currentWorkspaceId, workflowId })
			if (!workflow) {
				throw new Error('No se pudo obtener el workflow')
			}

			const workflowInfo = {
				id: workflow.id,
				name: workflow.name,
				description: workflow.description
			}

			// Verificar si el workflow tiene un proyecto asignado
			if (workflow.projectId) {
				// Importar el store de proyectos

				try {
					// Obtener el proyecto para verificar si tiene un despliegue asignado
					const project = await projectStore.getProjectById(workflow.projectId)

					if (project?.deploymentId) {
						// Obtener información del despliegue
						let deploymentName = 'Despliegue del Proyecto'
						try {
							await deploymentStore.loadDeployments()
							const deployment = deploymentStore.deployments.find((d) => d.id === project.deploymentId)
							if (deployment) {
								deploymentName = deployment.name
							}
						} catch (deploymentError) {
							console.warn('No se pudo obtener información del despliegue:', deploymentError)
						}

						// Retornar información para despliegue automático
						return {
							type: 'automatic',
							workflowInfo,
							autoDeployment: {
								deploymentId: project.deploymentId,
								deploymentName,
								projectName: project.name
							}
						}
					}
				} catch (projectError) {
					console.warn('No se pudo obtener el proyecto:', projectError)
				}
			}

			// Si llegamos aquí, se requiere selección manual
			return {
				type: 'manual',
				workflowInfo
			}
		} catch (err: any) {
			deploymentStore.error = err.message || 'Error al validar workflow para publicación'
			throw err
		} finally {
			deploymentStore.loading = false
		}
	}

	// Publicar workflow en un despliegue
	const publishWorkflowToDeployment = async (deploymentData: {
		workflowId: string
		deploymentId: string
		priority: number
		description: string
		scheduledAt?: Date
	}) => {
		try {
			deploymentStore.loading = true
			deploymentStore.error = null

			const queueItem = {
				deploymentId: deploymentData.deploymentId,
				workflowId: deploymentData.workflowId,
				description: deploymentData.description,
				scheduledAt: deploymentData.scheduledAt
			}

			const result = await createDeploymentQueue(queueItem)
			return result
		} catch (err: any) {
			deploymentStore.error = err.message || 'Error al publicar workflow en despliegue'
			throw err
		} finally {
			deploymentStore.loading = false
		}
	}

	const createDeploymentQueue = async (queueItem: {
		deploymentId: string
		workflowId: string
		workflowVersionId?: string
		description?: string
		meta?: Record<string, any>
		requestedBy?: string
		scheduledAt?: Date
	}) => {
		try {
			return await socketService.createDeploymentQueueItem({ ...queueItem, workspaceId: workspaceStore.currentWorkspaceId })
		} catch (err: any) {
			deploymentStore.error = err.message || 'Error al reintentar elemento de la cola'
			throw err
		}
	}

	return {
		validateAndPrepareWorkflowPublication,
		publishWorkflowToDeployment
	}
}
