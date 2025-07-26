import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import socketService from '../services/socket'

export interface User {
	id: string
	email: string
	name: string
	avatar?: string
	role: {
		id: string
		name: string
		level: number
		description?: string
	}
	permissions: {
		id: string
		module: string
		action: string
		description?: string
	}[]
	settings?: {
		theme: 'light' | 'dark' | 'system'
		language: string
		timezone: string
		notifications: {
			email: boolean
			push: boolean
			workflowComplete: boolean
			workflowError: boolean
		}
		preferences: {
			autoSave: boolean
			showLineNumbers: boolean
			wordWrap: boolean
		}
	}
}

export const useAuthStore = defineStore('auth', () => {
	const user = ref<User | null>(null)
	const isLoading = ref(false)

	const isAuthenticated = computed(() => !!user.value)

	// Login con Socket.IO
	const login = async (email: string, password: string): Promise<boolean> => {
		isLoading.value = true

		try {
			// Conectar socket sin autenticación para login
			socketService.connect()

			// Intentar login
			const response = await socketService.auth().login(email, password)

			if (response.success && response.user) {
				user.value = response.user
				localStorage.setItem('horizon-user', JSON.stringify(user.value))

				// Reconectar con autenticación
				socketService.disconnect()
				socketService.connect(user.value.id)

				return true
			}

			return false
		} catch (error) {
			console.error('Login error:', error)
			return false
		} finally {
			isLoading.value = false
		}
	}

	const logout = () => {
		user.value = null
		localStorage.removeItem('horizon-user')
		socketService.disconnect()
	}

	const initAuth = async () => {
		const savedUser = localStorage.getItem('horizon-user')
		if (savedUser) {
			try {
				const parsedUser = JSON.parse(savedUser)
				user.value = parsedUser

				// Reconectar socket con autenticación
				socketService.connect(parsedUser.id, parsedUser.socketId)

				// Verificar que el usuario sigue siendo válido
				try {
					const currentUser = await socketService.auth().getCurrentUser()
					user.value = currentUser
					localStorage.setItem('horizon-user', JSON.stringify(currentUser))
				} catch (error) {
					console.warn('Usuario guardado no es válido, limpiando:', error)
					logout()
				}
			} catch (error) {
				console.error('Error parsing saved user:', error)
				localStorage.removeItem('horizon-user')
			}
		}
	}

	const updateProfile = (updates: Partial<User>) => {
		if (user.value) {
			user.value = { ...user.value, ...updates }
			localStorage.setItem('horizon-user', JSON.stringify(user.value))
		}
	}

	// Helper para verificar permisos
	const hasPermission = (module: string, action: string): boolean => {
		if (!user.value?.permissions) return false
		return user.value.permissions.some((permission) => permission.module === module && permission.action === action)
	}

	// Helper para verificar roles
	const hasRole = (roleName: string): boolean => {
		return user.value?.role?.name === roleName
	}

	const isAdmin = computed(() => {
		return hasRole('SuperAdmin') || hasRole('Admin')
	})

	const isSuperAdmin = computed(() => {
		return hasRole('SuperAdmin')
	})

	return {
		user,
		isLoading,
		isAuthenticated,
		isAdmin,
		isSuperAdmin,
		login,
		logout,
		initAuth,
		updateProfile,
		hasPermission,
		hasRole
	}
})
