import socketService from '@/services/socket'

export function useWorkflowComposable({ workflowId }: { workflowId: string }) {
	const saveWorkflow = async ({ updates }: { updates: any }) => {
		try {
			return await socketService.workflow().updateWorkflow({ workflowId, updates })
		} catch (error: any) {
			throw new Error(error)
		}
	}

	return {
		saveWorkflow
	}
}
