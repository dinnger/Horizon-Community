import { computed } from 'vue'
import { useWorkflowsComposable } from './useWorkflows.composable'
import socketService from '@/services/socket'

/**
 * Composable que combina la funcionalidad de proyectos y workflows
 * para operaciones que requieren datos de ambos stores
 */
export function useProjectWorkflows({ projectId }: { projectId: string }) {
	console.log({ projectId })
	const workflowsComposable = useWorkflowsComposable({ projectId })

	const getProjectById = async () => {
		return await socketService.project().getProjectById({ projectId })
	}

	/**
	 * Elimina un proyecto y todos sus workflows asociados
	 */

	return {
		// Stores
		workflows: workflowsComposable,

		// Actions combinadas
		getProjectById
	}
}
