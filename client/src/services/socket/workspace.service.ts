import type { Workspace, WorkspaceCreateData, WorkspaceUpdateData } from '@/types/socket'
import type { Socket } from 'socket.io-client'

export function socketWorkspace(socket: Socket | null) {
	return {
		// Workspace methods
		getWorkspaces(): Promise<Workspace[]> {
			return new Promise((resolve, reject) => {
				if (!socket) {
					reject(new Error('Socket not connected'))
					return
				}

				socket.emit('workspaces:list', {}, (response: { success: boolean; workspaces?: Workspace[] }) => {
					if (response.success && response.workspaces) {
						resolve(response.workspaces)
					} else {
						reject(new Error('Failed to get workspaces'))
					}
				})
			})
		},

		createWorkspace(workspaceData: WorkspaceCreateData): Promise<Workspace> {
			return new Promise((resolve, reject) => {
				if (!socket) {
					reject(new Error('Socket not connected'))
					return
				}

				socket.emit(
					'workspaces:create',
					workspaceData,
					(response: {
						success: boolean
						workspace?: Workspace
						message?: string
					}) => {
						if (response.success && response.workspace) {
							resolve(response.workspace)
						} else {
							reject(new Error(response.message || 'Failed to create workspace'))
						}
					}
				)
			})
		},

		updateWorkspace(id: string, updates: Partial<WorkspaceUpdateData>): Promise<Workspace> {
			return new Promise((resolve, reject) => {
				if (!socket) {
					reject(new Error('Socket not connected'))
					return
				}

				socket.emit(
					'workspaces:update',
					{ id, ...updates },
					(response: {
						success: boolean
						workspace?: Workspace
						message?: string
					}) => {
						if (response.success && response.workspace) {
							resolve(response.workspace)
						} else {
							reject(new Error(response.message || 'Failed to update workspace'))
						}
					}
				)
			})
		},

		deleteWorkspace(id: string): Promise<void> {
			return new Promise((resolve, reject) => {
				if (!socket) {
					reject(new Error('Socket not connected'))
					return
				}

				socket.emit('workspaces:delete', { id }, (response: any) => {
					if (response.success) {
						resolve()
					} else {
						reject(new Error(response.message || 'Failed to delete workspace'))
					}
				})
			})
		}
	}
}
