import { defineStore } from 'pinia'
import { useAuthStore, type User } from './auth'
import socketService from '@/services/socket'
import type { IRole } from '@shared/interfaces/standardized'

interface RoleState {
	roles: IRole[]
	permissions: User['permissions']
	userPermissions: User['permissions']
	loading: boolean
	error: string | null
}

export const useRoleStore = defineStore('role', {
	state: (): RoleState => ({
		roles: [],
		permissions: [],
		userPermissions: [],
		loading: false,
		error: null
	}),

	getters: {
		// Solo roles que el usuario actual puede administrar (nivel inferior)
		manageableRoles: (state) => {
			return state.roles
		},

		// Permisos agrupados por módulo
		permissionsByModule: (state) => {
			const grouped: { [key: string]: User['permissions'] } = {}
			for (const permission of state.permissions) {
				if (!grouped[permission.module]) {
					grouped[permission.module] = []
				}
				grouped[permission.module].push(permission)
			}
			return grouped
		},

		// Verificar si el usuario tiene permiso específico
		hasPermission: (state) => (module: string, action: string) => {
			return state.userPermissions.some((p) => p.module === module && p.action === action)
		},

		// Obtener módulos disponibles basados en permisos
		availableModules: (state) => {
			const modules = new Set<string>()
			for (const permission of state.userPermissions) {
				modules.add(permission.module)
			}
			return Array.from(modules)
		}
	},

	actions: {
		async fetchRoles() {
			this.loading = true
			this.error = null

			try {
				// const response = await fetch('/api/roles')
				// this.roles = await response.json()
				// Mock data por ahora
				this.roles = await socketService.roles().getRoles()
			} catch (error) {
				this.error = 'Error al cargar roles'
				console.error('Error fetching roles:', error)
			} finally {
				this.loading = false
			}
		},

		async fetchPermissions() {
			this.loading = true
			this.error = null

			try {
				// const response = await fetch('/api/permissions')
				// this.permissions = await response.json()

				// Mock data por ahora
				this.permissions = []
			} catch (error) {
				this.error = 'Error al cargar permisos'
				console.error('Error fetching permissions:', error)
			} finally {
				this.loading = false
			}
		},

		async fetchUserPermissions() {
			const authStore = useAuthStore()
			if (!authStore.user) return

			this.loading = true
			this.error = null

			try {
				// const response = await fetch(`/api/users/${authStore.user.id}/permissions`)
				// this.userPermissions = await response.json()

				// Mock data basado en el rol del usuario
				const userRole = authStore.user.role?.name
				this.userPermissions = authStore.user?.permissions
			} catch (error) {
				this.error = 'Error al cargar permisos del usuario'
				console.error('Error fetching user permissions:', error)
			} finally {
				this.loading = false
			}
		},

		async updateRole(id: string, updates: Partial<IRole>) {
			try {
				// const response = await fetch(`/api/roles/${id}`, {
				//   method: 'PUT',
				//   headers: { 'Content-Type': 'application/json' },
				//   body: JSON.stringify(updates)
				// })

				const index = this.roles.findIndex((role) => role.id === id)
				if (index !== -1) {
					this.roles[index] = { ...this.roles[index], ...updates }
				}
			} catch (error) {
				this.error = 'Error al actualizar rol'
				console.error('Error updating role:', error)
				throw error
			}
		},

		async createRole(roleData: Omit<IRole, 'id'>) {
			try {
				// const response = await fetch('/api/roles', {
				//   method: 'POST',
				//   headers: { 'Content-Type': 'application/json' },
				//   body: JSON.stringify(roleData)
				// })

				const newRole: IRole = {
					...roleData,
					id: Date.now().toString()
				}
				this.roles.push(newRole)
				return newRole
			} catch (error) {
				this.error = 'Error al crear rol'
				console.error('Error creating role:', error)
				throw error
			}
		},

		async deleteRole(id: string) {
			try {
				// await fetch(`/api/roles/${id}`, { method: 'DELETE' })

				this.roles = this.roles.filter((role) => role.id !== id)
			} catch (error) {
				this.error = 'Error al eliminar rol'
				console.error('Error deleting role:', error)
				throw error
			}
		}
	}
})
