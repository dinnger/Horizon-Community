import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import socketService from '../services/socket.js'
import type { Workspace } from '@/types/socket.js'

export const useWorkspaceStore = defineStore('workspace', () => {
	const workspaces = ref<Workspace[]>([])
	const currentWorkspaceId = ref<string>('')
	const currentWorkspace = computed(() => {
		return workspaces.value.find((w) => w.id === currentWorkspaceId.value) || workspaces.value[0]
	})

	const defaultWorkspace = computed(() => {
		return workspaces.value.find((w) => w.isDefault) || workspaces.value[0]
	})

	// Inicializar workspaces con uno por defecto
	const initWorkspaces = async () => {
		const savedWorkspaces: Workspace[] | null = await socketService.workspace().getWorkspaces()
		console.log('🌱 Iniciando workspaces...', savedWorkspaces)

		const savedCurrentId = localStorage.getItem('horizon-current-workspace')

		if (savedWorkspaces) {
			try {
				workspaces.value = savedWorkspaces.map((w) => ({
					...w,
					createdAt: new Date(w.createdAt),
					updatedAt: new Date(w.updatedAt)
				}))
			} catch (error) {
				console.error('Error parsing saved workspaces:', error)
				createDefaultWorkspace()
			}
		} else {
			createDefaultWorkspace()
		}

		// Establecer workspace actual
		if (savedCurrentId && workspaces.value.find((w) => w.id === savedCurrentId)) {
			currentWorkspaceId.value = savedCurrentId
		} else {
			currentWorkspaceId.value = defaultWorkspace.value?.id || ''
		}
	}

	const createDefaultWorkspace = () => {
		const defaultWs: Workspace = {
			id: 'default',
			name: 'Default Workspace',
			description: 'Workspace principal para tus proyectos',
			color: '#3b82f6',
			icon: 'mdi-briefcase',
			createdAt: new Date(),
			updatedAt: new Date(),
			isDefault: true,
			status: 'active'
		}

		workspaces.value = [defaultWs]
		currentWorkspaceId.value = defaultWs.id
	}

	const createWorkspace = async (data: Omit<Workspace, 'id' | 'createdAt' | 'updatedAt'>) => {
		const newWorkspace: Omit<Workspace, 'id'> = {
			...data,
			createdAt: new Date(),
			updatedAt: new Date()
		}
		await socketService.workspace().createWorkspace(newWorkspace)
		initWorkspaces()
		return newWorkspace
	}

	const updateWorkspace = async (id: string, updates: Partial<Workspace>) => {
		await socketService.workspace().updateWorkspace(id, updates)
		initWorkspaces()
	}

	const deleteWorkspace = async (id: string) => {
		await socketService.workspace().deleteWorkspace(id)
		initWorkspaces()
	}

	const switchWorkspace = (id: string) => {
		const workspace = workspaces.value.find((w: Workspace) => w.id === id)
		if (workspace) {
			currentWorkspaceId.value = id
			localStorage.setItem('horizon-current-workspace', id)
		}
	}

	const generateId = () => {
		return Date.now().toString(36) + Math.random().toString(36).substr(2)
	}

	return {
		workspaces,
		currentWorkspaceId,
		currentWorkspace,
		defaultWorkspace,
		initWorkspaces,
		createWorkspace,
		updateWorkspace,
		deleteWorkspace,
		switchWorkspace
	}
})
