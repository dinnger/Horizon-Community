import { useWorkspaceStore } from '@/stores'
import type { Socket } from 'socket.io-client'

export function socketProject(socket: Socket | null) {
	const workspaceStore = useWorkspaceStore()
	const workspaceId = workspaceStore.currentWorkspaceId

	return {
		// Project methods
		getProjects(): Promise<any[]> {
			return new Promise((resolve, reject) => {
				if (!socket) {
					reject(new Error('Socket not connected'))
					return
				}

				socket.emit('projects:list', { workspaceId }, (response: any) => {
					if (response.success) {
						resolve(response.projects)
					} else {
						reject(new Error(response.message || 'Failed to get projects'))
					}
				})
			})
		},

		getProjectById({ projectId }: { projectId: string }): Promise<any> {
			return new Promise((resolve, reject) => {
				if (!socket) {
					reject(new Error('Socket not connected'))
					return
				}

				socket.emit('projects:get', { workspaceId, projectId }, (response: any) => {
					if (response.success && response.project) {
						resolve(response.project)
					} else {
						reject(new Error(response.message || 'Failed to get project'))
					}
				})
			})
		},

		createProject(projectData: any): Promise<any> {
			return new Promise((resolve, reject) => {
				if (!socket) {
					reject(new Error('Socket not connected'))
					return
				}

				socket.emit('projects:create', { workspaceId, ...projectData }, (response: any) => {
					if (response.success) {
						resolve(response.project)
					} else {
						reject(new Error(response.message || 'Failed to create project'))
					}
				})
			})
		},

		updateProject(projectId: string, updates: any): Promise<any> {
			return new Promise((resolve, reject) => {
				if (!socket) {
					reject(new Error('Socket not connected'))
					return
				}
				socket.emit('projects:update', { id: projectId, ...updates }, (response: any) => {
					if (response.success && response.project) {
						resolve(response.project)
					} else {
						reject(new Error(response.message || 'Failed to update project'))
					}
				})
			})
		},

		deleteProject(projectId: string): Promise<void> {
			return new Promise((resolve, reject) => {
				if (!socket) {
					reject(new Error('Socket not connected'))
					return
				}

				socket.emit('projects:delete', { id: projectId }, (response: any) => {
					if (response.success) {
						resolve()
					} else {
						reject(new Error(response.message || 'Failed to delete project'))
					}
				})
			})
		}
	}
}
