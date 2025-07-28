import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

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
			// fetch user
			const response = await fetch('/api/auth/local', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ email, password })
			}).then((response) => response.json())

			console.log('response', response)

			if (response.success && response.user) {
				user.value = response.user
				localStorage.setItem('horizon-user', JSON.stringify(user.value))

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

	// Login con Socket.IO
	const validate = async (): Promise<boolean> => {
		isLoading.value = true

		try {
			// fetch user
			const response = await fetch('/api/auth/validate', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				}
			}).then((response) => response.json())

			user.value = response
			return true
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
	}

	const initAuth = async () => {
		const savedUser = localStorage.getItem('horizon-user')
		if (savedUser) {
			try {
				const parsedUser = JSON.parse(savedUser)
				user.value = parsedUser

				// Verificar que el usuario sigue siendo válido
				// try {
				// 	localStorage.setItem('horizon-user', JSON.stringify(currentUser))
				// } catch (error) {
				// 	console.warn('Usuario guardado no es válido, limpiando:', error)
				// 	logout()
				// }
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
		validate,
		logout,
		initAuth,
		updateProfile,
		hasPermission,
		hasRole
	}
})
