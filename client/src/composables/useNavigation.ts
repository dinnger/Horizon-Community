import { computed } from 'vue'
import { useRoleStore } from '../stores/role'

interface MenuItem {
	path: string
	label: string
	icon: any
	requiredModule: string
}

export function useNavigation() {
	const roleStore = useRoleStore()

	const allMenuItems: MenuItem[] = [
		{ path: '/', label: 'Home', icon: 'mdi-home', requiredModule: 'dashboard' },
		{ path: '/projects', label: 'Projects', icon: 'mdi-file-tree', requiredModule: 'projects' },
		{ path: '/storage', label: 'Almacenamiento', icon: 'mdi-folder-lock', requiredModule: 'storage' },
		{ path: '/workers', label: 'Workers', icon: 'mdi-server-network', requiredModule: 'workers' },
		{ path: '/settings', label: 'Settings', icon: 'mdi-cog', requiredModule: 'settings' }
	]

	const availableMenuItems = computed(() => {
		const availableModules = roleStore.availableModules

		return allMenuItems.filter((item) => {
			// Home siempre está disponible
			if (item.path === '/') return true

			// Verificar si el módulo está disponible para el usuario
			return availableModules.includes(item.requiredModule)
		})
	})

	const hasModuleAccess = (module: string, action = 'list') => {
		return roleStore.hasPermission(module, action)
	}

	return {
		availableMenuItems,
		hasModuleAccess
	}
}
