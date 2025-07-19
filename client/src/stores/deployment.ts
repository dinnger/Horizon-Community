import { defineStore } from 'pinia'
import type { IDeployment } from '@shared/interfaces/deployment.interface'
import socketService from '@/services/socket'
import { ref } from 'vue'
import { useWorkflowsStore } from './workflows'
import { useWorkspaceStore } from './workspace'

// Tipos para la validación de publicación de workflow
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

export const useDeploymentStore = defineStore('deployment', () => {
	const deployments = ref<IDeployment[]>([])
	const loading = ref(false)
	const error = ref<string | null>(null)

	const workflowStore = useWorkflowsStore()
	const workspaceStore = useWorkspaceStore()

	// Cargar deployments desde el servidor
	const loadDeployments = async () => {
		try {
			loading.value = true
			error.value = null
			const deploymentData = await socketService.getDeployments()
			deployments.value = deploymentData
		} catch (err: any) {
			error.value = err.message || 'Error al cargar deployments'
			console.error('Error loading deployments:', err)
		} finally {
			loading.value = false
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
			error.value = err.message || 'Error al reintentar elemento de la cola'
			throw err
		}
	}

	// Validar y preparar publicación de workflow
	const validateAndPrepareWorkflowPublication = async (workflowId: string): Promise<WorkflowPublicationValidationResult> => {
		try {
			loading.value = true
			error.value = null

			// Obtener información del workflow
			const workflow = await workflowStore.getWorkflowById(workflowId)
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
				const { useProjectsStore } = await import('./projects')
				const projectStore = useProjectsStore()

				try {
					// Obtener el proyecto para verificar si tiene un despliegue asignado
					const project = await projectStore.getProjectById(workflow.projectId)

					if (project?.deploymentId) {
						// Obtener información del despliegue
						let deploymentName = 'Despliegue del Proyecto'
						try {
							await loadDeployments()
							const deployment = deployments.value.find((d) => d.id === project.deploymentId)
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
			error.value = err.message || 'Error al validar workflow para publicación'
			throw err
		} finally {
			loading.value = false
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
			loading.value = true
			error.value = null

			const queueItem = {
				deploymentId: deploymentData.deploymentId,
				workflowId: deploymentData.workflowId,
				description: deploymentData.description,
				scheduledAt: deploymentData.scheduledAt
			}

			const result = await createDeploymentQueue(queueItem)

			if (typeof result === 'object' && result.base64) {
				const link = document.createElement('a')
				link.href = result.base64
				link.download = `${workflowStore.context?.info.name}.zip` || '' // Nombre del archivo que se descargará
				document.body.appendChild(link)
				link.click()
				document.body.removeChild(link)
			}
			return result
		} catch (err: any) {
			error.value = err.message || 'Error al publicar workflow en despliegue'
			throw err
		} finally {
			loading.value = false
		}
	}

	return {
		validateAndPrepareWorkflowPublication,
		publishWorkflowToDeployment
	}
})
