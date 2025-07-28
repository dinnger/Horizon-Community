import type { Socket } from 'socket.io-client'
import type { IWorkerInfo } from '@shared/interfaces/worker.interface'

export function socketWorkers(socket: Socket | null) {
	return {
		getWorkersByWorkflow(workflowId: string): Promise<IWorkerInfo[]> {
			return new Promise((resolve, reject) => {
				if (!socket) {
					reject(new Error('Socket not connected'))
					return
				}
				socket.emit('workers:by-workflow', { workflowId }, (response: any) => {
					if (response.success && response.workers) {
						resolve(response.workers)
					} else {
						reject(new Error(response.message || 'Failed to get workers by workflow'))
					}
				})
			})
		},

		stopWorker({ workerId }: { workerId: string }): Promise<{ success: boolean; message?: string }> {
			return new Promise((resolve, reject) => {
				if (!socket) {
					reject(new Error('Socket not connected'))
					return
				}
				socket.emit('workers:stop', { workerId }, (response: any) => {
					if (response.success) {
						resolve(response)
					} else {
						reject(new Error(response.message || 'Failed to stop worker'))
					}
				})
			})
		}
	}
}
