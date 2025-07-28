import { computed, ref } from 'vue'
import { useWorkflowsComposable } from './useWorkflows.composable'
import socketService from '@/services/socket'
import type { Project } from '@/types/socket'

/**
 * Composable que combina la funcionalidad de proyectos y workflows
 * para operaciones que requieren datos de ambos stores
 */
export function useProjectComposable() {
	const projects = ref<Project[]>([])
	const showEmptyState = ref(false)

	/**
	 * Obtiene todos los proyectos con sus workflows asociados
	 */
	const getProjectsWithWorkflows = computed(() => {
		return projects.value.map((project) => ({
			...project,
			workflows: useWorkflowsComposable({ projectId: project.id }).workflows
		}))
	})

	const getActiveProjectsCount = computed(() => {
		return projects.value.filter((p) => p.status === 'active').length
	})

	const getInactiveProjectsCount = computed(() => {
		return projects.value.filter((p) => p.status === 'archived').length
	})

	const getAllProjectsStats = computed(() => {
		return {
			total: projects.value.length,
			active: getActiveProjectsCount.value,
			inactive: getInactiveProjectsCount.value
		}
	})

	const loadProjects = async () => {
		const parsed: Project[] = await socketService.project().getProjects()
		if (!parsed || parsed.length === 0) {
			projects.value = []
			showEmptyState.value = true
			return
		}
		try {
			projects.value = parsed.map((p) => ({
				...p,
				createdAt: new Date(p.createdAt),
				updatedAt: new Date(p.updatedAt)
			}))
			showEmptyState.value = false
		} catch (error) {
			console.error('Error parsing saved projects:', error)
			showEmptyState.value = true
		}
	}

	const createProject = async (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
		const now = new Date()
		const newProject: Omit<Project, 'id'> = {
			...projectData,
			createdAt: now,
			updatedAt: now
		}
		await socketService.project().createProject(newProject)
		await loadProjects()
		return newProject
	}

	const updateProject = async (projectId: string, updates: Partial<Omit<Project, 'id' | 'createdAt'>>) => {
		const now = new Date()
		const updatedProject = {
			...updates,
			updatedAt: now
		}
		await socketService.project().updateProject(projectId, updatedProject)
		await loadProjects()
		return updatedProject
	}

	const deleteProject = async (projectId: string) => {
		try {
			await socketService.project().deleteProject(projectId)
			await loadProjects()
			return true
		} catch (error) {
			return false
		}
	}

	const deleteProjectAndWorkflows = async ({ projectId }: { projectId: string }) => {
		try {
			const workflowsComposable = useWorkflowsComposable({ projectId })

			// Primero eliminar todos los workflows del proyecto
			const success = workflowsComposable.deleteWorkflowsByProjectId(projectId)
			console.log('🌱 Eliminando workflows...', success)

			return false
		} catch (error) {
			console.error('Error deleting project and workflows:', error)
			return false
		}
	}

	return {
		showEmptyState,
		// Computed properties combinadas
		getActiveProjectsCount,
		getInactiveProjectsCount,
		getAllProjectsStats,
		getProjectsWithWorkflows,

		loadProjects,
		createProject,
		updateProject,
		deleteProject,
		deleteProjectAndWorkflows
	}
}
