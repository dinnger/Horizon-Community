import type { Socket } from 'socket.io-client'
import type { Workflow } from '../../types/socket'
import { useWorkspaceStore } from '@/stores'

export function socketWorkflow(socket: Socket | null) {
	const workspaceStore = useWorkspaceStore()
	const workspaceId = workspaceStore.currentWorkspaceId
	return {
		getWorkflows({ projectId }: { projectId: string }): Promise<any[]> {
			return new Promise((resolve, reject) => {
				if (!socket) return reject(new Error('Socket not connected'))
				socket.emit('workflows:list', { workspaceId, projectId }, (response: any) => {
					if (response.success) {
						resolve(response.workflows)
					} else {
						reject(new Error(response.message || 'Failed to get workflows'))
					}
				})
			})
		},

		getWorkflowsById({ workflowId, version }: { workflowId: string; version?: string }): Promise<any> {
			return new Promise((resolve, reject) => {
				if (!socket) return reject(new Error('Socket not connected'))
				socket.emit('workflows:get', { workspaceId, workflowId, version }, (response: any) => {
					if (response.success) {
						resolve(response.workflow)
					} else {
						reject(new Error(response.message || 'Failed to get workflow'))
					}
				})
			})
		},

		createWorkflow(workflowData: any): Promise<any> {
			return new Promise((resolve, reject) => {
				if (!socket) return reject(new Error('Socket not connected'))
				socket.emit('workflows:create', { workspaceId, ...workflowData }, (response: any) => {
					if (response.success) {
						resolve(response.workflow)
					} else {
						reject(new Error(response.message || 'Failed to create workflow'))
					}
				})
			})
		},

		updateWorkflow({ workflowId, updates }: { workflowId: string; updates: any }): Promise<Workflow> {
			return new Promise((resolve, reject) => {
				if (!socket) return reject(new Error('Socket not connected'))
				socket.emit(
					'workflows:update',
					{ workspaceId, id: workflowId, ...updates },
					(response: {
						success: boolean
						workflow?: Workflow
						message?: string
					}) => {
						if (response.success && response.workflow) {
							resolve(response.workflow)
						} else {
							reject(new Error(response.message || 'Failed to update workflow'))
						}
					}
				)
			})
		},

		deleteWorkflow({ workflowId }: { workflowId: string }): Promise<void> {
			return new Promise((resolve, reject) => {
				if (!socket) return reject(new Error('Socket not connected'))
				socket.emit('workflows:delete', { workspaceId, workflowId }, (response: any) => {
					if (response.success) {
						resolve()
					} else {
						reject(new Error(response.message || 'Failed to delete workflow'))
					}
				})
			})
		},

		executeWorkflow(workflowId: string, trigger = 'manual', version?: string): Promise<any> {
			return new Promise((resolve, reject) => {
				if (!socket) return reject(new Error('Socket not connected'))
				const payload = { workspaceId, workflowId, trigger, ...(version && { version }) }
				socket.emit('workflows:execute', payload, (response: any) => {
					if (response.success) {
						resolve(response)
					} else {
						reject(new Error(response.message || 'Failed to execute workflow'))
					}
				})
			})
		},

		getWorkflowVersions({ workflowId }: { workflowId: string }): Promise<any> {
			return new Promise((resolve, reject) => {
				if (!socket) return reject(new Error('Socket not connected'))
				socket.emit('workflows:getVersions', { workflowId }, (response: any) => {
					if (response.success) {
						resolve(response)
					} else {
						reject(new Error(response.message || 'Failed to get workflow versions'))
					}
				})
			})
		}
	}
}
