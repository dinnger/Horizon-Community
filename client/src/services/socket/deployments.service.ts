import type { Socket } from 'socket.io-client'
import type { IDeployment, IDeploymentInstance, IDeploymentQueue } from '@shared/interfaces/deployment.interface'

export function socketDeployments(socket: Socket | null) {
	return {
		getDeployments(): Promise<IDeployment[]> {
			return new Promise((resolve, reject) => {
				if (!socket) {
					reject(new Error('Socket not connected'))
					return
				}
				socket.emit('deployments:list', {}, (response: any) => {
					if (response.success && response.deployments) {
						resolve(response.deployments)
					} else {
						reject(new Error(response.message || 'Failed to get deployments'))
					}
				})
			})
		},

		createDeployment(
			deployment: Omit<IDeployment, 'id' | 'createdAt' | 'updatedAt'>,
			instances?: IDeploymentInstance[]
		): Promise<IDeployment | { deployment: IDeployment; assignments: any[] }> {
			return new Promise((resolve, reject) => {
				if (!socket) {
					reject(new Error('Socket not connected'))
					return
				}
				const payload = instances && instances.length > 0 ? { deployment, instances } : deployment
				socket.emit('deployments:create', payload, (response: any) => {
					if (response.success && response.deployment) {
						resolve(instances && instances.length > 0 ? response : response.deployment)
					} else {
						reject(new Error(response.message || 'Failed to create deployment'))
					}
				})
			})
		},

		createDeploymentQueueItem(queueItem: {
			workspaceId: string
			workflowId: string
			workflowVersionId?: string
			description?: string
			meta?: Record<string, any>
			requestedBy?: string
			scheduledAt?: Date
		}): Promise<IDeploymentQueue> {
			return new Promise((resolve, reject) => {
				if (!socket) {
					reject(new Error('Socket not connected'))
					return
				}
				socket.emit('deployment-queue:create', queueItem, (response: any) => {
					if (response.success && response.base64) {
						response.base64 = `data:application/zip;base64,${response.base64}`
						resolve(response)
					} else {
						reject(new Error(response.message || 'Failed to create deployment queue item'))
					}
				})
			})
		}
	}
}
