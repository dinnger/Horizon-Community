import type { IClassNode } from '@shared/interfaces/class.interface'
import { io, type Socket } from 'socket.io-client'
import type {
	LoginResponse,
	PermissionCheckResponse,
	User,
	Workspace,
	Workflow,
	WorkspaceCreateData,
	WorkspaceUpdateData
} from '../types/socket'
import type { INodeCanvas } from '@canvas/interfaz/node.interface'
import type { IDeployment, IDeploymentInstance, IDeploymentType, IDeploymentQueue } from '@shared/interfaces/deployment.interface'
import type { IRole } from '@shared/interfaces/standardized'
import { ref } from 'vue'
import type { ISubscriberType } from '@shared/interfaces/subscriber/subscriber.interface'

class SocketService {
	private socket: Socket | null = null
	isConnected = ref<boolean>(false)

	connect(userId?: string, previousSocket?: string): Socket {
		if (this.socket?.connected) {
			return this.socket
		}

		const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001'

		this.socket = io(serverUrl, {
			auth: userId ? { userId, previousSocket } : {},
			autoConnect: true
		})

		this.socket.on('connect', () => {
			console.log('Connected to server:', this.socket?.id)
			this.isConnected.value = true
		})

		this.socket.on('disconnect', () => {
			console.log('Disconnected from server')
			this.isConnected.value = false
		})

		this.socket.on('connect_error', (error) => {
			console.error('Connection error:', error)
			this.isConnected.value = false
		})

		return this.socket
	}

	disconnect(): void {
		if (this.socket) {
			this.socket.disconnect()
			this.socket = null
			this.isConnected.value = false
		}
	}

	getSocket(): Socket | null {
		return this.socket
	}

	isSocketConnected(): boolean {
		return this.isConnected.value && this.socket?.connected === true
	}

	// Events
	listener({ event, params, callback }: { event: ISubscriberType; params?: string[]; callback?: any }) {
		if (!this.socket) return console.error('Socket not connected')

		const room = params && Array.isArray(params) ? `${event}:${params.join(':')}` : event
		this.socket.emit('subscribe:join', { room })
		this.socket.on(room, (response: any) => {
			callback(response)
		})
	}

	closeListener({ event, params, callback }: { event: string | RegExp; params?: string[]; callback?: any }) {
		if (!this.socket) return console.error('Socket not connected')
		const room = params && Array.isArray(params) ? `${event}:${params.join(':')}` : event
		this.socket.emit(
			'subscribe:close',
			{ room },
			(response: {
				success: boolean
				list?: string[]
			}) => {
				if (this.socket && response.success && Array.isArray(response.list)) {
					for (const item of response.list) {
						console.log(`Removing listener for ${item}`)
						this.socket.off(item)
					}
				}
			}
		)
	}

	// Auth methods
	login(email: string, password: string): Promise<LoginResponse> {
		return new Promise((resolve, reject) => {
			if (!this.socket) {
				reject(new Error('Socket not connected'))
				return
			}

			this.socket.emit('auth:login', { email, password }, (response: LoginResponse) => {
				if (response.success) {
					resolve(response)
				} else {
					reject(new Error(response.message || 'Login failed'))
				}
			})
		})
	}

	checkPermission(userId: string, module: string, action: string): Promise<boolean> {
		return new Promise((resolve, reject) => {
			if (!this.socket) {
				reject(new Error('Socket not connected'))
				return
			}

			this.socket.emit('auth:check-permission', { userId, module, action }, (response: PermissionCheckResponse) => {
				if (response.success) {
					resolve(response.hasPermission)
				} else {
					reject(new Error('Permission check failed'))
				}
			})
		})
	}

	getCurrentUser(): Promise<User & { socketId: string }> {
		return new Promise((resolve, reject) => {
			if (!this.socket) {
				reject(new Error('Socket not connected'))
				return
			}

			this.socket.emit('auth:me', (response: { success: boolean; user?: User; message?: string }) => {
				if (response.success && response.user) {
					resolve({ ...response.user, socketId: this.socket?.id || '' })
				} else {
					reject(new Error(response.message || 'Failed to get user info'))
				}
			})
		})
	}

	// Workspace methods
	getWorkspaces(): Promise<Workspace[]> {
		return new Promise((resolve, reject) => {
			if (!this.socket) {
				reject(new Error('Socket not connected'))
				return
			}

			this.socket.emit('workspaces:list', {}, (response: { success: boolean; workspaces?: Workspace[] }) => {
				if (response.success && response.workspaces) {
					resolve(response.workspaces)
				} else {
					reject(new Error('Failed to get workspaces'))
				}
			})
		})
	}

	createWorkspace(workspaceData: WorkspaceCreateData): Promise<Workspace> {
		return new Promise((resolve, reject) => {
			if (!this.socket) {
				reject(new Error('Socket not connected'))
				return
			}

			this.socket.emit(
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
	}

	updateWorkspace(id: string, updates: Partial<WorkspaceUpdateData>): Promise<Workspace> {
		return new Promise((resolve, reject) => {
			if (!this.socket) {
				reject(new Error('Socket not connected'))
				return
			}

			this.socket.emit(
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
	}

	deleteWorkspace(id: string): Promise<void> {
		return new Promise((resolve, reject) => {
			if (!this.socket) {
				reject(new Error('Socket not connected'))
				return
			}

			this.socket.emit('workspaces:delete', { id }, (response: any) => {
				if (response.success) {
					resolve()
				} else {
					reject(new Error(response.message || 'Failed to delete workspace'))
				}
			})
		})
	}

	// Project methods
	getProjects(workspaceId: string): Promise<any[]> {
		return new Promise((resolve, reject) => {
			if (!this.socket) {
				reject(new Error('Socket not connected'))
				return
			}

			this.socket.emit('projects:list', { workspaceId }, (response: any) => {
				if (response.success) {
					resolve(response.projects)
				} else {
					reject(new Error(response.message || 'Failed to get projects'))
				}
			})
		})
	}

	getProjectById(workspaceId: string, projectId: string): Promise<any> {
		return new Promise((resolve, reject) => {
			if (!this.socket) {
				reject(new Error('Socket not connected'))
				return
			}

			this.socket.emit('projects:get', { workspaceId, projectId }, (response: any) => {
				console.log('response', response)
				if (response.success && response.project) {
					resolve(response.project)
				} else {
					reject(new Error(response.message || 'Failed to get project'))
				}
			})
		})
	}

	createProject(projectData: any): Promise<any> {
		return new Promise((resolve, reject) => {
			if (!this.socket) {
				reject(new Error('Socket not connected'))
				return
			}

			this.socket.emit('projects:create', projectData, (response: any) => {
				if (response.success) {
					resolve(response.project)
				} else {
					reject(new Error(response.message || 'Failed to create project'))
				}
			})
		})
	}

	updateProject(projectId: string, updates: any): Promise<any> {
		return new Promise((resolve, reject) => {
			if (!this.socket) {
				reject(new Error('Socket not connected'))
				return
			}
			this.socket.emit('projects:update', { id: projectId, ...updates }, (response: any) => {
				if (response.success && response.project) {
					resolve(response.project)
				} else {
					reject(new Error(response.message || 'Failed to update project'))
				}
			})
		})
	}

	deleteProject(projectId: string): Promise<void> {
		return new Promise((resolve, reject) => {
			if (!this.socket) {
				reject(new Error('Socket not connected'))
				return
			}

			this.socket.emit('projects:delete', { id: projectId }, (response: any) => {
				if (response.success) {
					resolve()
				} else {
					reject(new Error(response.message || 'Failed to delete project'))
				}
			})
		})
	}

	// Workflow methods
	getWorkflows(workspaceId: string, projectId: string): Promise<any[]> {
		return new Promise((resolve, reject) => {
			if (!this.socket) {
				reject(new Error('Socket not connected'))
				return
			}

			this.socket.emit('workflows:list', { workspaceId, projectId }, (response: any) => {
				if (response.success) {
					resolve(response.workflows)
				} else {
					reject(new Error(response.message || 'Failed to get workflows'))
				}
			})
		})
	}

	getWorkflowsById(workspaceId: string, id: string): Promise<any> {
		return new Promise((resolve, reject) => {
			if (!this.socket) {
				reject(new Error('Socket not connected'))
				return
			}

			this.socket.emit('workflows:get', { workspaceId, id }, (response: any) => {
				if (response.success) {
					resolve(response.workflow)
				} else {
					reject(new Error(response.message || 'Failed to get workflow'))
				}
			})
		})
	}

	createWorkflow(workflowData: any): Promise<any> {
		return new Promise((resolve, reject) => {
			if (!this.socket) {
				reject(new Error('Socket not connected'))
				return
			}

			this.socket.emit('workflows:create', workflowData, (response: any) => {
				if (response.success) {
					resolve(response.workflow)
				} else {
					reject(new Error(response.message || 'Failed to create workflow'))
				}
			})
		})
	}

	updateWorkflow(workflowId: string, updates: any): Promise<Workflow> {
		return new Promise((resolve, reject) => {
			if (!this.socket) {
				reject(new Error('Socket not connected'))
				return
			}
			this.socket.emit(
				'workflows:update',
				{ id: workflowId, ...updates },
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
	}

	deleteWorkflow(workflowId: string): Promise<void> {
		return new Promise((resolve, reject) => {
			if (!this.socket) {
				reject(new Error('Socket not connected'))
				return
			}

			this.socket.emit('workflows:delete', { id: workflowId }, (response: any) => {
				if (response.success) {
					resolve()
				} else {
					reject(new Error(response.message || 'Failed to delete workflow'))
				}
			})
		})
	}

	executeWorkflow(workflowId: string, trigger = 'manual', version?: string): Promise<any> {
		return new Promise((resolve, reject) => {
			if (!this.socket) {
				reject(new Error('Socket not connected'))
				return
			}

			const payload = { workflowId, trigger, ...(version && { version }) }
			this.socket.emit('workflows:execute', payload, (response: any) => {
				if (response.success) {
					resolve(response)
				} else {
					reject(new Error(response.message || 'Failed to execute workflow'))
				}
			})
		})
	}

	getWorkflowVersions(workspaceId: string, workflowId: string): Promise<any> {
		return new Promise((resolve, reject) => {
			if (!this.socket) {
				reject(new Error('Socket not connected'))
				return
			}

			this.socket.emit('workflows:getVersions', { workspaceId, workflowId }, (response: any) => {
				if (response.success) {
					resolve(response)
				} else {
					reject(new Error(response.message || 'Failed to get workflow versions'))
				}
			})
		})
	}

	// Settings methods
	getUserSettings(): Promise<any> {
		return new Promise((resolve, reject) => {
			if (!this.socket) {
				reject(new Error('Socket not connected'))
				return
			}

			this.socket.emit('settings:get', {}, (response: any) => {
				if (response.success) {
					resolve(response.settings)
				} else {
					reject(new Error(response.message || 'Failed to get settings'))
				}
			})
		})
	}

	updateUserSettings(settings: any): Promise<any> {
		return new Promise((resolve, reject) => {
			if (!this.socket) {
				reject(new Error('Socket not connected'))
				return
			}

			this.socket.emit('settings:update', settings, (response: any) => {
				if (response.success) {
					resolve(response.settings)
				} else {
					reject(new Error(response.message || 'Failed to update settings'))
				}
			})
		})
	}

	// Role methods
	getRoles(): Promise<IRole[]> {
		return new Promise((resolve, reject) => {
			if (!this.socket) {
				reject(new Error('Socket not connected'))
				return
			}

			this.socket.emit('roles:list', { maxLevelMe: true }, (response: any) => {
				if (response.success && response.roles) {
					resolve(response.roles)
				} else {
					reject(new Error(response.message || 'Failed to get roles'))
				}
			})
		})
	}

	// Node methods
	getNodes(): Promise<Record<string, IClassNode>> {
		return new Promise((resolve, reject) => {
			if (!this.socket) {
				reject(new Error('Socket not connected'))
				return
			}

			this.socket.emit('nodes:list', {}, (response: any) => {
				if (response.success && response.nodes) {
					resolve(response.nodes)
				} else {
					reject(new Error(response.message || 'Failed to get nodes'))
				}
			})
		})
	}

	getNodeByType(type: string): Promise<INodeCanvas> {
		return new Promise((resolve, reject) => {
			if (!this.socket) {
				reject(new Error('Socket not connected'))
				return
			}

			this.socket.emit('nodes:get', { type }, (response: any) => {
				if (response.success && response.node) {
					resolve(response.node)
				} else {
					reject(new Error(response.message || 'Failed to get node'))
				}
			})
		})
	}

	getNodesByGroup(group?: string): Promise<Record<string, IClassNode>> {
		return new Promise((resolve, reject) => {
			if (!this.socket) {
				reject(new Error('Socket not connected'))
				return
			}

			this.socket.emit('nodes:list-by-group', { group }, (response: any) => {
				if (response.success && response.nodes) {
					resolve(response.nodes)
				} else {
					reject(new Error(response.message || 'Failed to get nodes by group'))
				}
			})
		})
	}

	getNodeGroups(): Promise<string[]> {
		return new Promise((resolve, reject) => {
			if (!this.socket) {
				reject(new Error('Socket not connected'))
				return
			}

			this.socket.emit('nodes:groups', {}, (response: any) => {
				if (response.success && response.groups) {
					resolve(response.groups)
				} else {
					reject(new Error(response.message || 'Failed to get node groups'))
				}
			})
		})
	}

	searchNodes(query: string): Promise<Record<string, IClassNode>> {
		return new Promise((resolve, reject) => {
			if (!this.socket) {
				reject(new Error('Socket not connected'))
				return
			}

			this.socket.emit('nodes:search', { query }, (response: any) => {
				if (response.success && response.nodes) {
					resolve(response.nodes)
				} else {
					reject(new Error(response.message || 'Failed to search nodes'))
				}
			})
		})
	}

	getNodeInfo(type: string): Promise<IClassNode> {
		return new Promise((resolve, reject) => {
			if (!this.socket) {
				reject(new Error('Socket not connected'))
				return
			}

			this.socket.emit('nodes:info', { type }, (response: any) => {
				if (response.success && response.node) {
					resolve(response.node)
				} else {
					reject(new Error(response.message || 'Failed to get node info'))
				}
			})
		})
	}

	getNodeStats(): Promise<any> {
		return new Promise((resolve, reject) => {
			if (!this.socket) {
				reject(new Error('Socket not connected'))
				return
			}

			this.socket.emit('nodes:stats', {}, (response: any) => {
				if (response.success && response.stats) {
					resolve(response.stats)
				} else {
					reject(new Error(response.message || 'Failed to get node stats'))
				}
			})
		})
	}

	// Deployments

	// Deployments principales
	getDeployments(): Promise<IDeployment[]> {
		return new Promise((resolve, reject) => {
			if (!this.socket) {
				reject(new Error('Socket not connected'))
				return
			}

			this.socket.emit('deployments:list', {}, (response: any) => {
				if (response.success && response.deployments) {
					resolve(response.deployments)
				} else {
					reject(new Error(response.message || 'Failed to get deployments'))
				}
			})
		})
	}

	createDeployment(
		deployment: Omit<IDeployment, 'id' | 'createdAt' | 'updatedAt'>,
		instances?: IDeploymentInstance[]
	): Promise<IDeployment | { deployment: IDeployment; assignments: any[] }> {
		return new Promise((resolve, reject) => {
			if (!this.socket) {
				reject(new Error('Socket not connected'))
				return
			}

			// Si hay instancias, enviar ambos parámetros
			const payload = instances && instances.length > 0 ? { deployment, instances } : deployment

			console.log('deployment', deployment)
			this.socket.emit('deployments:create', payload, (response: any) => {
				if (response.success && response.deployment) {
					resolve(instances && instances.length > 0 ? response : response.deployment)
				} else {
					reject(new Error(response.message || 'Failed to create deployment'))
				}
			})
		})
	}

	createDeploymentQueueItem(queueItem: {
		workspaceId: string
		deploymentId: string
		workflowId: string
		workflowVersionId?: string
		description?: string
		meta?: Record<string, any>
		requestedBy?: string
		scheduledAt?: Date
	}): Promise<boolean | { base64: string }> {
		return new Promise((resolve, reject) => {
			if (!this.socket) {
				reject(new Error('Socket not connected'))
				return
			}

			this.socket.emit('deployment-queue:create', queueItem, (response: any) => {
				if (response.success) {
					if (response.base64) {
						return resolve({ base64: `data:application/zip;base64,${response.base64}` })
					}
					resolve(true)
				} else {
					reject(new Error(response.message || 'Failed to create deployment queue item'))
				}
			})
		})
	}

	// Event listeners
	onWorkspaceCreated(callback: (workspace: any) => void): void {
		this.socket?.on('workspaces:created', callback)
	}

	onWorkspaceUpdated(callback: (workspace: any) => void): void {
		this.socket?.on('workspaces:updated', callback)
	}

	onWorkspaceDeleted(callback: (data: { id: string }) => void): void {
		this.socket?.on('workspaces:deleted', callback)
	}

	onProjectCreated(callback: (project: any) => void): void {
		this.socket?.on('projects:created', callback)
	}

	onWorkflowExecutionCompleted(callback: (data: any) => void): void {
		this.socket?.on('workflows:execution-completed', callback)
	}

	// Remove all listeners
	removeAllListeners(): void {
		this.socket?.removeAllListeners()
	}
}

export const socketService = new SocketService()
export default socketService
