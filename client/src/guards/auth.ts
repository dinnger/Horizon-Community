import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'
import { useAuthStore } from '../stores/auth'

export const authGuard = async (to: RouteLocationNormalized, from: RouteLocationNormalized, next: NavigationGuardNext) => {
	const authStore = useAuthStore()
	await authStore.validate()

	// Rutas públicas que no requieren autenticación
	const publicRoutes = ['/login', '/auth/login', '/error/404', '/error/500']

	if (publicRoutes.includes(to.path)) {
		// Si el usuario ya está autenticado y trata de ir a login, redirigir al home
		if (authStore.isAuthenticated && (to.path === '/login' || to.path === '/auth/login')) {
			next('/')
		} else {
			next()
		}
		return
	}

	// Para todas las demás rutas, verificar autenticación
	if (!authStore.isAuthenticated) {
		next('/auth/login')
	} else {
		next()
	}
}
