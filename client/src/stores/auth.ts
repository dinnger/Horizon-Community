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
	const login = async (email: string, password: string, rememberMe: boolean): Promise<boolean> => {
		isLoading.value = true

		try {
			// fetch user
			const response = await fetch('/api/auth/local', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ email, password, rememberMe })
			}).then((response) => response.json())

			if (rememberMe && response.token) {
				localStorage.setItem('horizon-token', response.token)
			}

			if (response.success && response.user) {
				user.value = response.user
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
	const validate = async (): Promise<void> => {
		isLoading.value = true

		try {
			// fetch user
			await fetch('/api/auth/validate', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				}
			})
				.then(async (response) => {
					if (response.status === 200) {
						user.value = await response.json()
						return
					}

					user.value = null
				})
				.catch((error) => {
					user.value = null
					console.error('Login error:', error)
				})
		} catch (error) {
			user.value = null
			console.error('Login error:', error)
		} finally {
			isLoading.value = false
		}
	}

	const rememberMe = async () => {
		if (!localStorage.getItem('horizon-token')) return { success: true, existToken: false }
		const token = localStorage.getItem('horizon-token')
		if (token) {
			try {
				// fetch user
				const response = await fetch('/api/auth/local/remember', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${token}`
					}
				}).then((response) => {
					if (response.status !== 500) localStorage.removeItem('horizon-token')
					if (response.status === 500) return { success: false, existToken: false }
					return response.json()
				})

				if (response.success && response.user) {
					user.value = response.user
					return { success: true, existToken: true }
				}

				return { success: false, existToken: false }
			} catch (error) {
				localStorage.removeItem('horizon-token')
				console.error('Login error:', error)
				return { success: false, existToken: false }
			} finally {
				isLoading.value = false
			}
		}
	}

	const logout = async () => {
		await fetch('/api/auth/logout', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			}
		})
		localStorage.removeItem('horizon-token')
		user.value = null
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

	return {
		user,
		isLoading,
		isAuthenticated,
		login,
		validate,
		rememberMe,
		logout,
		hasPermission,
		hasRole
	}
})
