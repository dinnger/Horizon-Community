import { computed } from 'vue'
import { useProjectsStore } from '../stores/projects'
import { useWorkflowsStore } from '../stores/workflows'

/**
 * Composable que combina la funcionalidad de proyectos y workflows
 * para operaciones que requieren datos de ambos stores
 */
export function useProjectWorkflows() {
	const projectsStore = useProjectsStore()
	const workflowsStore = useWorkflowsStore()

	/**
	 * Obtiene las estadísticas completas de un proyecto incluyendo workflows
	 */
	const getProjectWithStats = computed(() => {
		return (projectId: string) => {
			const project = projectsStore.getProjectById(projectId)
			if (!project) return null

			const workflowStats = workflowsStore.getWorkflowStats()
			const activeWorkflows = workflowsStore.getActiveWorkflowsCount()

			return {
				...project,
				stats: workflowStats,
				activeWorkflowsCount: activeWorkflows
			}
		}
	})

	/**
	 * Obtiene todos los proyectos con sus workflows asociados
	 */
	const getProjectsWithWorkflows = computed(() => {
		return projectsStore.projects.map((project) => ({
			...project,
			workflows: workflowsStore.workflows.values,
			stats: workflowsStore.getWorkflowStats(),
			activeWorkflowsCount: workflowsStore.getActiveWorkflowsCount()
		}))
	})

	/**
	 * Elimina un proyecto y todos sus workflows asociados
	 */
	const deleteProjectAndWorkflows = async (projectId: string) => {
		try {
			// Primero eliminar todos los workflows del proyecto
			const success = workflowsStore.deleteWorkflowsByProjectId(projectId)
			console.log('🌱 Eliminando workflows...', success)
			if (success) {
				// Luego eliminar el proyecto
				return projectsStore.deleteProject(projectId)
			}

			return false
		} catch (error) {
			console.error('Error deleting project and workflows:', error)
			return false
		}
	}

	/**
	 * Obtiene estadísticas globales combinadas
	 */
	const getGlobalStats = computed(() => {
		const projectStats = projectsStore.getAllProjectsStats
		const workflowStats = workflowsStore.getAllWorkflowStats

		return {
			projects: projectStats,
			workflows: workflowStats
		}
	})

	return {
		// Stores
		projectsStore,
		workflowsStore,

		// Computed properties combinadas
		getProjectWithStats,
		getProjectsWithWorkflows,
		getGlobalStats,

		// Actions combinadas
		deleteProjectAndWorkflows
	}
}
