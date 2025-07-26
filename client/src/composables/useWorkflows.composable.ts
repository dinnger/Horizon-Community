import socketService from '@/services/socket'
import { computed, ref } from 'vue'
export interface Workflow {
	id: string
	name: string
	description: string
	status: 'success' | 'running' | 'failed' | 'pending'
	lastRun: Date
	duration: string
	projectId: string
	createdAt: Date
	updatedAt: Date
}

export function useWorkflowsComposable({ projectId }: { projectId: string }) {
	const workflows = ref<Workflow[]>([])
	const loading = ref(false)
	const error = ref<string | null>(null)

	const validWorkflow = async ({ workflowId }: { workflowId: string }) => {
		try {
			const result = await socketService.workflow().getWorkflowsById({ workflowId })
			return { success: true, workflow: result }
		} catch (error) {
			console.error('Error obteniendo workflow:', error)
			return { success: false, message: 'Error al obtener workflow' }
		}
	}

	// Computed properties
	const getActiveWorkflowsCount = computed(() => {
		const projectWorkflows = workflows.value
		return projectWorkflows.filter((w) => w.status === 'running' || w.status === 'success').length
	})

	const getWorkflowStats = computed(() => {
		const projectWorkflows = workflows.value

		if (projectWorkflows.length === 0) {
			return {
				executions: 0,
				successRate: 0,
				avgDuration: '0m 0s',
				lastExecution: undefined
			}
		}

		const successCount = projectWorkflows.filter((w) => w.status === 'success').length
		const successRate = (successCount / projectWorkflows.length) * 100 // Calcular duración promedio real
		const totalSeconds = projectWorkflows.reduce((total, workflow) => {
			const [minutes, seconds] = workflow.duration.split(/[ms]/).map((s) => Number.parseInt(s.trim()) || 0)
			return total + minutes * 60 + seconds
		}, 0)
		const avgSeconds = Math.round(totalSeconds / projectWorkflows.length)
		const avgMinutes = Math.floor(avgSeconds / 60)
		const remainingSeconds = avgSeconds % 60
		const avgDuration = `${avgMinutes}m ${remainingSeconds}s`

		// Última ejecución
		const lastExecution = projectWorkflows.reduce((latest, workflow) => {
			return workflow.lastRun > latest ? workflow.lastRun : latest
		}, new Date(0))

		return {
			executions: projectWorkflows.length,
			successRate: Math.round(successRate * 10) / 10,
			avgDuration,
			lastExecution: lastExecution.getTime() > 0 ? lastExecution : undefined
		}
	})

	const getAllWorkflowStats = computed(() => {
		if (workflows.value.length === 0) {
			return {
				total: 0,
				running: 0,
				success: 0,
				failed: 0,
				pending: 0
			}
		}

		return {
			total: workflows.value.length,
			running: workflows.value.filter((w) => w.status === 'running').length,
			success: workflows.value.filter((w) => w.status === 'success').length,
			failed: workflows.value.filter((w) => w.status === 'failed').length,
			pending: workflows.value.filter((w) => w.status === 'pending').length
		}
	})

	const loadWorkflows = async () => {
		const parsed: Workflow[] = await socketService.workflow().getWorkflows({ projectId })
		if (parsed) {
			try {
				workflows.value = parsed.map((w) => ({
					...w,
					createdAt: new Date(w.createdAt),
					updatedAt: new Date(w.updatedAt),
					lastRun: new Date(w.lastRun)
				}))
			} catch (error) {
				console.error('Error parsing saved workflows:', error)
			}
		}
	}

	const createWorkflow = async (workflowData: Omit<Workflow, 'id' | 'projectId' | 'createdAt' | 'updatedAt' | 'lastRun'>) => {
		const now = new Date()
		const newWorkflow: Omit<Workflow, 'id'> = {
			...workflowData,
			lastRun: now,
			createdAt: now,
			updatedAt: now,
			projectId
		}
		try {
			await socketService.workflow().createWorkflow(newWorkflow)
			loadWorkflows()
			return newWorkflow
		} catch (error) {
			console.error('Error creating workflow:', error)
			return null
		}
	}

	const deleteWorkflow = async (workflowId: string) => {
		try {
			await socketService.workflow().deleteWorkflow({ workflowId })
			loadWorkflows()
			return true
		} catch (error) {
			return false
		}
	}

	const deleteWorkflowsByProjectId = (projectId: string) => {
		const initialLength = workflows.value.length
		workflows.value = workflows.value.filter((w) => w.projectId !== projectId)
		return true
	}

	const runWorkflow = (workflowId: string) => {
		const workflow = workflows.value.find((w) => w.id === workflowId)
		if (workflow) {
			workflow.status = 'running'
			workflow.lastRun = new Date()
			workflow.updatedAt = new Date()

			// Simular ejecución
			setTimeout(
				() => {
					workflow.status = Math.random() > 0.1 ? 'success' : 'failed'
					workflow.duration = `${Math.floor(Math.random() * 5) + 1}m ${Math.floor(Math.random() * 60)}s`
					workflow.updatedAt = new Date()
				},
				2000 + Math.random() * 3000
			)

			return true
		}
		return false
	}

	const setLoading = (value: boolean) => {
		loading.value = value
	}

	const setError = (message: string | null) => {
		error.value = message
	}

	return {
		// State
		workflows,
		loading,
		error,

		// Getters
		getActiveWorkflowsCount,
		getWorkflowStats,
		getAllWorkflowStats,

		// Actions
		createWorkflow,
		runWorkflow,
		setLoading,
		setError,

		loadWorkflows,
		deleteWorkflow,
		deleteWorkflowsByProjectId,
		validWorkflow
	}
}
