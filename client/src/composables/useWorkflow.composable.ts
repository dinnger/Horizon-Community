import socketService from '@/services/socket'

export function useWorkflowComposable() {
	const getVersions = async ({ workflowId }: { workflowId: string }) => {
		try {
			const result = await socketService.getWorkflowVersions({ workflowId })
			return { success: true, versions: result.versions }
		} catch (error) {
			console.error('Error obteniendo versiones:', error)
			return { success: false, message: 'Error al obtener versiones', versions: [] }
		}
	}
	return {
		getVersions
	}
}
