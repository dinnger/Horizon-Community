import { createRouter, createWebHistory } from 'vue-router'
import AuthLayout from '../layouts/AuthLayout.vue'
import DefaultLayout from '../layouts/DefaultLayout.vue'
import ErrorLayout from '../layouts/ErrorLayout.vue'
import HomeView from '../views/HomeView.vue'
import ProjectsView from '../views/ProjectsView.vue'
import ProjectDetailView from '../views/ProjectDetailView.vue'
import WorkflowDetailView from '../views/WorkflowDetailView.vue'
import CanvasView from '../views/CanvasView.vue'
import LoginView from '../views/LoginView.vue'
import SettingsView from '../views/SettingsView.vue'
import WorkersView from '../views/WorkersView.vue'
import NotFoundView from '../views/NotFoundView.vue'
import ServerErrorView from '../views/ServerErrorView.vue'
import { authGuard } from '../guards/auth'
import StorageView from '@/views/StorageView.vue'

const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	routes: [
		// Rutas de autenticación con AuthLayout
		{
			path: '/auth',
			component: AuthLayout,
			children: [
				{
					path: 'login',
					name: 'login',
					component: LoginView
				}
			]
		},
		// Alias para mantener compatibilidad con /login
		{
			path: '/login',
			redirect: '/auth/login'
		},
		// Rutas principales con DefaultLayout
		{
			path: '/',
			component: DefaultLayout,
			children: [
				{
					path: '',
					name: 'home',
					component: HomeView
				},
				{
					path: 'projects',
					name: 'projects',
					component: ProjectsView
				},
				{
					path: 'projects/:id',
					name: 'project-detail',
					component: ProjectDetailView
				},
				{
					path: 'projects/:projectId/workflows/:workflowId',
					name: 'workflow-detail',
					component: WorkflowDetailView
				},
				{
					path: 'projects/:id/canvas',
					name: 'canvas',
					component: CanvasView
				},
				{
					path: 'storage',
					name: 'storage',
					component: StorageView
				},
				{
					path: 'workers',
					name: 'workers',
					component: WorkersView
				},
				{
					path: 'settings',
					name: 'settings',
					component: SettingsView
				}
			]
		},
		// Rutas de error con ErrorLayout
		{
			path: '/error',
			component: ErrorLayout,
			children: [
				{
					path: '500',
					name: 'server-error',
					component: ServerErrorView
				},
				{
					path: '404',
					name: 'not-found',
					component: NotFoundView
				}
			]
		},
		// Alias para mantener compatibilidad con /500
		{
			path: '/500',
			redirect: '/error/500'
		},
		// Catch-all para 404
		{
			path: '/:pathMatch(.*)*',
			redirect: '/error/404'
		}
	]
})

// Aplicar el guard de autenticación a todas las rutas
router.beforeEach(authGuard)

export default router
