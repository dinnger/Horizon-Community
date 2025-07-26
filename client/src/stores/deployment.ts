import { defineStore } from 'pinia'
import type { IDeployment } from '@shared/interfaces/deployment.interface'
import socketService from '@/services/socket'
import { ref } from 'vue'
import { useWorkflowsStore } from './workflows'
import { useWorkspaceStore } from './workspace'

// Tipos para la validación de publicación de workflow

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

	return {
		deployments,
		loading,
		error,

		loadDeployments
	}
})
