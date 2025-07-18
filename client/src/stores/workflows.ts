import type { INodeCanvas, INodeConnections } from '@canvas/interfaz/node.interface'
import type { IWorkflowExecutionContextInterface } from '@shared/interfaces'
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { useWorkspaceStore } from './workspace'
import socketService from '@/services/socket'

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

export const useWorkflowsStore = defineStore('workflows', () => {
	const workflows = ref<Workflow[]>([])
	const loading = ref(false)
	const projectId = ref<string>('')
	const error = ref<string | null>(null)
	const context = ref<Omit<IWorkflowExecutionContextInterface, 'currentNode' | 'getEnvironment' | 'getSecrets'>>()

	const workspaceStore = useWorkspaceStore()

	// Computed properties
	const getActiveWorkflowsCount = computed(() => {
		return () => {
			const projectWorkflows = workflows.value
			return projectWorkflows.filter((w) => w.status === 'running' || w.status === 'success').length
		}
	})

	const getWorkflowStats = computed(() => {
		return () => {
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

	// Actions
	const initializeData = async (project_id: string) => {
		projectId.value = project_id
		workflows.value = []
		loadDefaultWorkflows()
	}

	const loadDefaultWorkflows = async () => {
		const parsed: Workflow[] = await socketService.getWorkflows(workspaceStore.currentWorkspaceId, projectId.value)
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

	const getWorkflowById = async (id: string, isContext = false) => {
		const data = await socketService.getWorkflowsById(workspaceStore.currentWorkspaceId, id)
		if (isContext) {
			context.value = {
				project: {
					type: data.project.transportType
				},
				info: {
					name: data.name,
					uid: data.id
				},
				properties: data.properties
			}
		}
		return data
	}

	const getWorkflowVersion = async (id: string) => {
		return await socketService.getWorkflowVersions(workspaceStore.currentWorkspaceId, id)
	}

	const getWorkflowContext = () => {
		return context.value
	}

	const createWorkflow = async (workflowData: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt' | 'lastRun'>) => {
		const now = new Date()
		const newWorkflow: Omit<Workflow, 'id'> = {
			...workflowData,
			lastRun: now,
			createdAt: now,
			updatedAt: now
		}
		try {
			await socketService.createWorkflow(newWorkflow)
			loadDefaultWorkflows()
			return newWorkflow
		} catch (error) {
			console.error('Error creating workflow:', error)
			return null
		}
	}

	const updateWorkflow = async (
		workflowId: string,
		data: { nodes: { [key: string]: INodeCanvas }; connections: INodeConnections[]; notes?: any[]; groups?: any[] }
	) => {
		await socketService.updateWorkflow(workflowId, data)
		return null
	}

	const deleteWorkflow = async (workflowId: string) => {
		try {
			await socketService.deleteWorkflow(workflowId)
			loadDefaultWorkflows()
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
		getWorkflowById,
		getWorkflowVersion,
		getActiveWorkflowsCount,
		getWorkflowStats,
		getAllWorkflowStats,
		getWorkflowContext,

		// Actions
		initializeData,
		createWorkflow,
		updateWorkflow,
		deleteWorkflow,
		deleteWorkflowsByProjectId,
		runWorkflow,
		setLoading,
		setError
	}
})
