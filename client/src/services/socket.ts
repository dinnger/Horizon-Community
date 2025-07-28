import type { IWorkerInfo } from '@shared/interfaces/worker.interface'
import { io, type Socket } from 'socket.io-client'
import { ref } from 'vue'
import { socketAuth } from './socket/auth.service'
import { socketProject } from './socket/project.service'
import { socketWorkspace } from './socket/workspace.service'
import { socketWorkflow } from './socket/workflow.service'
import { socketSettings } from './socket/settings.service'
import { socketRoles } from './socket/roles.service'
import { socketNodes } from './socket/nodes.service'
import { socketDeployments } from './socket/deployments.service'
import { socketWorkers } from './socket/workers.service'

let socket: Socket | null = null

function SocketService() {
	const isConnected = ref<boolean>(false)
	return {
		isConnected,
		connect(userId?: string, previousSocket?: string): Socket {
			if (socket?.connected) {
				return socket
			}

			const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001'

			socket = io(serverUrl, {
				auth: userId ? { userId, previousSocket } : {},
				autoConnect: true
			})

			console.log('socket1', socket)

			socket.on('connect', () => {
				console.log('Connected to server:', socket?.id)
				isConnected.value = true
			})

			socket.on('disconnect', () => {
				console.log('Disconnected from server')
				isConnected.value = false
			})

			socket.on('connect_error', (error) => {
				console.error('Connection error:', error)
				isConnected.value = false
			})

			return socket
		},

		disconnect(): void {
			if (socket) {
				socket.disconnect()
				socket = null
				isConnected.value = false
			}
		},

		getSocket(): Socket | null {
			return socket
		},

		isSocketConnected(): boolean {
			return isConnected.value && socket?.connected === true
		},

		// Event listeners
		subscribe(room: string, callback: (data: any) => void) {
			socket?.emit('subscribe:join', { room }, (response: any) => {
				callback(response)
			})
		},

		onWorkspaceCreated(callback: (workspace: any) => void): void {
			socket?.on('workspaces:created', callback)
		},

		onWorkspaceUpdated(callback: (workspace: any) => void): void {
			socket?.on('workspaces:updated', callback)
		},

		onWorkspaceDeleted(callback: (data: { id: string }) => void): void {
			socket?.on('workspaces:deleted', callback)
		},

		onProjectCreated(callback: (project: any) => void): void {
			socket?.on('projects:created', callback)
		},

		onWorkflowExecutionCompleted(callback: (data: any) => void): void {
			socket?.on('workflows:execution-completed', callback)
		},

		onWorkflowAnimations(workflowId: string, callback: (data: any) => void): void {
			this.subscribe(`workflow:animations:${workflowId}`, () => {
				socket?.on(`workflow:animations:${workflowId}`, (response: any) => {
					callback(response)
				})
			})
		},
		onWorkflowConsole(workflowId: string, callback: (data: any) => void): void {
			this.subscribe(`workflow:console:${workflowId}`, () => {
				socket?.on(`workflow:console:${workflowId}`, (response: any) => {
					callback(response)
				})
			})
		},

		onWorkerStatus(workflowId: string, callback: (data: any) => void): void {
			this.subscribe(`worker:status:${workflowId}`, (response) => {
				callback(response)
				socket?.on(`worker:status:${workflowId}`, (response: IWorkerInfo) => {
					callback(response)
				})
			})
		},

		// Remove listeners
		removeListeners(room: string | RegExp) {
			socket?.emit(
				'subscribe:close',
				{ room },
				(response: {
					success: boolean
					list?: string[]
				}) => {
					if (response.success && Array.isArray(response.list)) {
						for (const item of response.list) {
							socket?.off(item)
						}
					}
				}
			)
		},

		// Remove all listeners
		removeAllListeners(): void {
			socket?.removeAllListeners()
		}
	}
}

export const socketService = {
	...SocketService(),
	// Auth methods
	auth: () => socketAuth(socket),
	// Workspace methods
	workspace: () => socketWorkspace(socket),
	// Project methods
	project: () => socketProject(socket),
	// Workflow methods
	workflow: () => socketWorkflow(socket),
	// Settings methods
	settings: () => socketSettings(socket),
	// Roles methods
	roles: () => socketRoles(socket),
	// Nodes methods
	nodes: () => socketNodes(socket),
	// Deployments methods
	deployments: () => socketDeployments(socket),
	// Workers methods
	workers: () => socketWorkers(socket)
}

export default socketService
