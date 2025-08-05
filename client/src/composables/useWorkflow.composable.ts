import socketService from '@/services/socket'
import type { IWorkflowDataSave } from '@shared/interfaces/standardized'

export function useWorkflowComposable({ workflowId }: { workflowId: string }) {
	const getVersions = async () => {
		try {
			const result = await socketService.workflow().getWorkflowVersions({ workflowId })
			return { success: true, versions: result.versions }
		} catch (error) {
			console.error('Error obteniendo versiones:', error)
			return { success: false, message: 'Error al obtener versiones', versions: [] }
		}
	}

	const saveWorkflow = async ({ updates }: { updates: IWorkflowDataSave }) => {
		try {
			return await socketService.workflow().updateWorkflow({ workflowId, updates })
		} catch (error: any) {
			throw new Error(error)
		}
	}

	return {
		getVersions,
		saveWorkflow
	}
}
