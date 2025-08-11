import socketService from '@/services/socket'
import { useDeploymentStore, useWorkspaceStore } from '@/stores'
import { useProjectWorkflows } from './useProjectWorkflows'

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
	const workspaceStore = useWorkspaceStore()

	// Publicar workflow en un despliegue
	const publishWorkflowToDeployment = async (deploymentData: {
		workflowId: string
		priority: number
		description: string
		scheduledAt?: Date
	}) => {
		try {
			deploymentStore.loading = true
			deploymentStore.error = null

			const queueItem = {
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
		workflowId: string
		workflowVersionId?: string
		description?: string
		meta?: Record<string, any>
		requestedBy?: string
		scheduledAt?: Date
	}) => {
		try {
			return await socketService.deployments().createDeploymentQueueItem({ ...queueItem, workspaceId: workspaceStore.currentWorkspaceId })
		} catch (err: any) {
			deploymentStore.error = err.message || 'Error al reintentar elemento de la cola'
			throw err
		}
	}

	return {
		publishWorkflowToDeployment
	}
}
