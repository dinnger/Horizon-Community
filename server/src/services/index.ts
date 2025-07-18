import {
	User,
	Workspace,
	Project,
	Workflow,
	WorkflowExecution,
	ExecutionLog,
	UserSettings,
	type WorkspaceAttributes,
	type ProjectAttributes,
	type WorkflowAttributes
} from '../models/index.js'
import { Op } from 'sequelize'

export const WorkspaceService = {
	async getUserWorkspaces(userId: string) {
		return await Workspace.findAll({
			where: {
				userId,
				status: { [Op.ne]: 'archived' }
			},
			include: [
				{
					model: Project,
					as: 'projects',
					where: { status: { [Op.ne]: 'archived' } },
					required: false,
					include: [
						{
							model: Workflow,
							as: 'workflows',
							where: { status: { [Op.ne]: 'archived' } },
							required: false
						}
					]
				}
			],
			order: [
				['isDefault', 'DESC'],
				['createdAt', 'ASC'],
				[{ model: Project, as: 'projects' }, 'createdAt', 'DESC'],
				[{ model: Project, as: 'projects' }, { model: Workflow, as: 'workflows' }, 'createdAt', 'DESC']
			]
		})
	},

	async createWorkspace(data: Omit<WorkspaceAttributes, 'id' | 'createdAt' | 'updatedAt'>) {
		// If this is the first workspace for the user, make it default
		const existingWorkspaces = await Workspace.count({
			where: { userId: data.userId, status: 'active' }
		})

		return await Workspace.create({
			...data,
			isDefault: existingWorkspaces === 0 ? true : data.isDefault
		})
	},

	async getWorkspaceStats(workspaceId: string) {
		const projects = await Project.findAll({
			where: { workspaceId, status: { [Op.ne]: 'archived' } },
			include: [
				{
					model: Workflow,
					as: 'workflows',
					where: { status: { [Op.ne]: 'archived' } },
					required: false
				}
			]
		})

		const stats = {
			totalProjects: projects.length,
			activeProjects: projects.filter((p) => p.status === 'active').length,
			totalWorkflows: projects.reduce((acc, p) => acc + ((p as Project & { workflows: Workflow[] }).workflows?.length || 0), 0),
			runningWorkflows: 0,
			successfulWorkflows: 0,
			failedWorkflows: 0
		}

		for (const project of projects) {
			const projectWithWorkflows = project as Project & {
				workflows: Workflow[]
			}
			if (projectWithWorkflows.workflows) {
				for (const workflow of projectWithWorkflows.workflows) {
					switch (workflow.status) {
						case 'running':
							stats.runningWorkflows++
							break
						case 'success':
							stats.successfulWorkflows++
							break
						case 'failed':
							stats.failedWorkflows++
							break
					}
				}
			}
		}

		return stats
	}
}

export const ProjectService = {
	async getProjectsWithWorkflows(workspaceId: string) {
		return await Project.findAll({
			where: {
				workspaceId,
				status: { [Op.ne]: 'archived' }
			},
			include: [
				{
					model: Workflow,
					as: 'workflows',
					where: { status: { [Op.ne]: 'archived' } },
					required: false
				}
			],
			order: [
				['createdAt', 'DESC'],
				[{ model: Workflow, as: 'workflows' }, 'createdAt', 'DESC']
			]
		})
	},

	async createProject(data: Omit<ProjectAttributes, 'id' | 'createdAt' | 'updatedAt'>) {
		return await Project.create(data)
	},

	async getProjectStats(projectId: string) {
		const workflows = await Workflow.findAll({
			where: { projectId, status: { [Op.ne]: 'archived' } },
			include: [
				{
					model: WorkflowExecution,
					as: 'executions',
					order: [['createdAt', 'DESC']],
					limit: 10
				}
			]
		})

		const totalExecutions = await WorkflowExecution.count({
			include: [
				{
					model: Workflow,
					as: 'workflow',
					where: { projectId }
				}
			]
		})

		const stats = {
			totalWorkflows: workflows.length,
			runningWorkflows: workflows.filter((w) => w.status === 'running').length,
			successfulWorkflows: workflows.filter((w) => w.status === 'success').length,
			failedWorkflows: workflows.filter((w) => w.status === 'failed').length,
			totalExecutions,
			recentExecutions: workflows.flatMap((w) => (w as Workflow & { executions: WorkflowExecution[] }).executions || []).slice(0, 10)
		}

		return stats
	}
}

export const WorkflowService = {
	async getWorkflowWithExecutions(workflowId: string) {
		return await Workflow.findByPk(workflowId, {
			include: [
				{
					model: WorkflowExecution,
					as: 'executions',
					include: [
						{
							model: ExecutionLog,
							as: 'logs',
							order: [['timestamp', 'ASC']]
						}
					],
					order: [['createdAt', 'DESC']],
					limit: 50
				}
			]
		})
	},

	async createWorkflow(data: Omit<WorkflowAttributes, 'id' | 'createdAt' | 'updatedAt'>) {
		return await Workflow.create(data)
	},

	async executeWorkflow(workflowId: string, trigger = 'manual') {
		const workflow = await Workflow.findByPk(workflowId)
		if (!workflow) {
			throw new Error('Workflow not found')
		}

		// Create execution record
		const execution = await WorkflowExecution.create({
			workflowId,
			status: 'running',
			startTime: new Date(),
			trigger
		})

		// Update workflow status
		await workflow.update({
			status: 'running',
			lastRun: new Date()
		})

		// Log start
		await ExecutionLog.create({
			executionId: execution.id,
			level: 'info',
			message: `Workflow execution started (trigger: ${trigger})`,
			timestamp: new Date()
		})

		return execution
	},

	async completeExecution(executionId: string, status: 'success' | 'failed', errorMessage?: string) {
		const execution = await WorkflowExecution.findByPk(executionId)
		if (!execution) {
			throw new Error('Execution not found')
		}

		const endTime = new Date()
		const duration = `${Math.floor((endTime.getTime() - execution.startTime.getTime()) / 1000)}s`

		await execution.update({
			status,
			endTime,
			duration,
			errorMessage
		})

		// Update workflow
		await Workflow.update(
			{
				status,
				duration
			},
			{ where: { id: execution.workflowId } }
		)

		// Log completion
		await ExecutionLog.create({
			executionId: execution.id,
			level: status === 'success' ? 'info' : 'error',
			message:
				status === 'success'
					? `Workflow execution completed successfully in ${duration}`
					: `Workflow execution failed: ${errorMessage || 'Unknown error'}`,
			timestamp: endTime
		})

		return execution
	},

	async getWorkflowStats(workflowId: string) {
		const executions = await WorkflowExecution.findAll({
			where: { workflowId },
			order: [['createdAt', 'DESC']]
		})

		const thisWeek = new Date()
		thisWeek.setDate(thisWeek.getDate() - 7)

		const executionsThisWeek = executions.filter((e) => e.createdAt >= thisWeek)
		const successfulExecutions = executions.filter((e) => e.status === 'success')
		const failedExecutions = executions.filter((e) => e.status === 'failed')

		// Calculate average duration
		const completedExecutions = executions.filter((e) => e.duration)
		const avgDurationMs =
			completedExecutions.length > 0
				? completedExecutions.reduce((acc, e) => {
						const seconds = e.duration ? Number.parseInt(e.duration.replace('s', ''), 10) : 0
						return acc + seconds
					}, 0) / completedExecutions.length
				: 0

		return {
			totalExecutions: executions.length,
			executionsThisWeek: executionsThisWeek.length,
			successRate: executions.length > 0 ? Math.round((successfulExecutions.length / executions.length) * 100) : 0,
			successCount: successfulExecutions.length,
			failureCount: failedExecutions.length,
			failureRate: executions.length > 0 ? Math.round((failedExecutions.length / executions.length) * 100) : 0,
			avgDuration: `${Math.round(avgDurationMs)}s`
		}
	}
}

export * as WorkflowHistoryService from './WorkflowHistoryService.js'
