import bcrypt from 'bcrypt'
import { User, Role, Permission, RolePermission, Workspace, UserSettings, DeploymentInstance } from '../models/index.js'

export const seedDatabase = async () => {
	try {
		// Create roles first
		const superAdminRole = await Role.findOrCreate({
			where: { name: 'SuperAdmin' },
			defaults: {
				name: 'SuperAdmin',
				description: 'Acceso total al sistema',
				level: 0,
				status: 'active'
			}
		})

		const adminRole = await Role.findOrCreate({
			where: { name: 'Admin' },
			defaults: {
				name: 'Admin',
				description: 'Administrador con acceso completo a funcionalidades',
				level: 1,
				status: 'active'
			}
		})

		const managerRole = await Role.findOrCreate({
			where: { name: 'Manager' },
			defaults: {
				name: 'Manager',
				description: 'Gestor de proyectos y workflows',
				level: 2,
				status: 'active'
			}
		})

		const userRole = await Role.findOrCreate({
			where: { name: 'User' },
			defaults: {
				name: 'User',
				description: 'Usuario básico con acceso limitado',
				level: 3,
				status: 'active'
			}
		})

		const viewerRole = await Role.findOrCreate({
			where: { name: 'Viewer' },
			defaults: {
				name: 'Viewer',
				description: 'Solo lectura',
				level: 4,
				status: 'active'
			}
		})

		// Create permissions with new structure
		const permissionConfigs = [
			// Usuario básico - solo sus propios recursos
			{
				module: 'workspaces',
				action: 'create',
				scope: 'own' as const,
				priority: 10,
				description: 'Crear sus propios workspaces',
				status: 'active' as const
			},
			{
				module: 'workspaces',
				action: 'list',
				scope: 'own' as const,
				priority: 10,
				description: 'Ver sus propios workspaces',
				status: 'active' as const
			},
			{
				module: 'workspaces',
				action: 'update',
				scope: 'own' as const,
				priority: 10,
				description: 'Modificar sus propios workspaces',
				status: 'active' as const
			},
			{
				module: 'workspaces',
				action: 'delete',
				scope: 'own' as const,
				priority: 10,
				description: 'Eliminar sus propios workspaces',
				status: 'active' as const
			},

			{
				module: 'projects',
				action: 'create',
				scope: 'workspace' as const,
				priority: 20,
				description: 'Crear proyectos en sus workspaces',
				status: 'active' as const
			},
			{
				module: 'projects',
				action: 'list',
				scope: 'workspace' as const,
				priority: 20,
				description: 'Ver proyectos en sus workspaces',
				status: 'active' as const
			},
			{
				module: 'projects',
				action: 'get',
				scope: 'workspace' as const,
				priority: 20,
				description: 'Obtener un proyecto en sus workspaces',
				status: 'active' as const
			},
			{
				module: 'projects',
				action: 'update',
				scope: 'workspace' as const,
				priority: 20,
				description: 'Modificar proyectos en sus workspaces',
				status: 'active' as const
			},
			{
				module: 'projects',
				action: 'delete',
				scope: 'workspace' as const,
				priority: 20,
				description: 'Eliminar proyectos en sus workspaces',
				status: 'active' as const
			},

			{
				module: 'workflows',
				action: 'create',
				scope: 'project' as const,
				priority: 30,
				description: 'Crear workflows en sus proyectos',
				status: 'active' as const
			},
			{
				module: 'workflows',
				action: 'list',
				scope: 'project' as const,
				priority: 30,
				description: 'Ver workflows en sus proyectos',
				status: 'active' as const
			},
			{
				module: 'workflows',
				action: 'update',
				scope: 'project' as const,
				priority: 30,
				description: 'Modificar workflows en sus proyectos',
				status: 'active' as const
			},
			{
				module: 'workflows',
				action: 'delete',
				scope: 'project' as const,
				priority: 30,
				description: 'Eliminar workflows en sus proyectos',
				status: 'active' as const
			},
			{
				module: 'workflows',
				action: 'execute',
				scope: 'project' as const,
				priority: 30,
				description: 'Ejecutar workflows en sus proyectos',
				status: 'active' as const
			},
			{
				module: 'workflows',
				action: 'get',
				scope: 'project' as const,
				priority: 30,
				description: 'Obtener un workflow en sus proyectos',
				status: 'active' as const
			},
			{
				module: 'workflows',
				action: 'getVersions',
				scope: 'project' as const,
				priority: 30,
				description: 'Obtener un workflow en sus proyectos',
				status: 'active' as const
			},
			{
				module: 'settings',
				action: 'get',
				scope: 'own' as const,
				priority: 10,
				description: 'Ver sus propias configuraciones',
				status: 'active' as const
			},
			{
				module: 'settings',
				action: 'update',
				scope: 'own' as const,
				priority: 10,
				description: 'Modificar sus propias configuraciones',
				status: 'active' as const
			},

			// Permisos para nodos
			{
				module: 'nodes',
				action: 'list',
				scope: 'global' as const,
				priority: 15,
				description: 'Ver todos los nodos disponibles',
				status: 'active' as const
			},
			{
				module: 'nodes',
				action: 'get',
				scope: 'global' as const,
				priority: 15,
				description: 'Obtener información de nodos específicos',
				status: 'active' as const
			},
			{
				module: 'nodes',
				action: 'search',
				scope: 'global' as const,
				priority: 15,
				description: 'Buscar nodos disponibles',
				status: 'active' as const
			},
			{
				module: 'nodes',
				action: 'groups',
				scope: 'global' as const,
				priority: 15,
				description: 'Ver grupos de nodos',
				status: 'active' as const
			},
			{
				module: 'nodes',
				action: 'info',
				scope: 'global' as const,
				priority: 15,
				description: 'Obtener información detallada de nodos',
				status: 'active' as const
			},
			{
				module: 'nodes',
				action: 'stats',
				scope: 'global' as const,
				priority: 15,
				description: 'Ver estadísticas de nodos',
				status: 'active' as const
			},
			{
				module: 'nodes',
				action: 'change-property',
				scope: 'global' as const,
				priority: 15,
				description: 'Cambiar propiedades de nodos',
				status: 'active' as const
			},
			// Permisos para storage
			{
				module: 'storage',
				action: 'list',
				scope: 'global' as const,
				priority: 15,
				description: 'Ver todos los nodos disponibles',
				status: 'active' as const
			},
			{
				module: 'storage',
				action: 'get',
				scope: 'global' as const,
				priority: 15,
				description: 'Obtener información de nodos específicos',
				status: 'active' as const
			},
			{
				module: 'storage',
				action: 'create',
				scope: 'global' as const,
				priority: 15,
				description: 'Crear nodos',
				status: 'active' as const
			},
			{
				module: 'storage',
				action: 'update',
				scope: 'global' as const,
				priority: 15,
				description: 'Modificar nodos',
				status: 'active' as const
			},
			{
				module: 'storage',
				action: 'delete',
				scope: 'global' as const,
				priority: 15,
				description: 'Eliminar nodos',
				status: 'active' as const
			},
			// Permisos de credenciales
			{
				module: 'storage-credentials',
				action: 'list',
				scope: 'global' as const,
				priority: 100,
				description: 'Ver todos los nodos disponibles',
				status: 'active' as const
			},
			{
				module: 'storage-credentials',
				action: 'get',
				scope: 'global' as const,
				priority: 100,
				description: 'Obtener información de credenciales',
				status: 'active' as const
			},

			// Permisos para workers
			{
				module: 'workers',
				action: 'list',
				scope: 'global' as const,
				priority: 50,
				description: 'Ver todos los workers activos',
				status: 'active' as const
			},
			{
				module: 'workers',
				action: 'dashboard',
				scope: 'global' as const,
				priority: 50,
				description: 'Acceder al dashboard de workers',
				status: 'active' as const
			},
			{
				module: 'workers',
				action: 'stop',
				scope: 'global' as const,
				priority: 80,
				description: 'Detener workers',
				status: 'active' as const
			},
			{
				module: 'workers',
				action: 'restart',
				scope: 'global' as const,
				priority: 80,
				description: 'Reiniciar workers',
				status: 'active' as const
			},
			{
				module: 'workers',
				action: 'message',
				scope: 'global' as const,
				priority: 70,
				description: 'Enviar mensajes a workers',
				status: 'active' as const
			},

			// Permisos administrativos (scope global)
			{
				module: 'users',
				action: 'list',
				scope: 'global' as const,
				priority: 100,
				description: 'Ver todos los usuarios',
				status: 'active' as const
			},
			{
				module: 'users',
				action: 'create',
				scope: 'global' as const,
				priority: 100,
				description: 'Crear usuarios',
				status: 'active' as const
			},
			{
				module: 'users',
				action: 'update',
				scope: 'global' as const,
				priority: 100,
				description: 'Modificar usuarios',
				status: 'active' as const
			},
			{
				module: 'users',
				action: 'delete',
				scope: 'global' as const,
				priority: 100,
				description: 'Eliminar usuarios',
				status: 'active' as const
			},

			{ module: 'roles', action: 'list', scope: 'global' as const, priority: 100, description: 'Ver roles', status: 'active' as const },
			{ module: 'roles', action: 'create', scope: 'global' as const, priority: 100, description: 'Crear roles', status: 'active' as const },
			{
				module: 'roles',
				action: 'update',
				scope: 'global' as const,
				priority: 100,
				description: 'Modificar roles',
				status: 'active' as const
			},
			{
				module: 'roles',
				action: 'delete',
				scope: 'global' as const,
				priority: 100,
				description: 'Eliminar roles',
				status: 'active' as const
			},

			{
				module: 'permissions',
				action: 'list',
				scope: 'global' as const,
				priority: 100,
				description: 'Ver permisos',
				status: 'active' as const
			},
			{
				module: 'permissions',
				action: 'assign',
				scope: 'global' as const,
				priority: 100,
				description: 'Asignar permisos',
				status: 'active' as const
			},

			// Permisos para deployments
			{
				module: 'deployments',
				action: 'list',
				scope: 'workspace' as const,
				priority: 40,
				description: 'Ver despliegues en sus workspaces',
				status: 'active' as const
			},
			{
				module: 'deployments',
				action: 'create',
				scope: 'workspace' as const,
				priority: 40,
				description: 'Crear despliegues en sus workspaces',
				status: 'active' as const
			},
			{
				module: 'deployments',
				action: 'update',
				scope: 'workspace' as const,
				priority: 40,
				description: 'Modificar despliegues en sus workspaces',
				status: 'active' as const
			},
			{
				module: 'deployments',
				action: 'delete',
				scope: 'workspace' as const,
				priority: 40,
				description: 'Eliminar despliegues en sus workspaces',
				status: 'active' as const
			},
			{
				module: 'deployment-instances',
				action: 'list',
				scope: 'workspace' as const,
				priority: 41,
				description: 'Ver instancias de despliegue en sus workspaces',
				status: 'active' as const
			},
			{
				module: 'deployment-instances',
				action: 'get',
				scope: 'workspace' as const,
				priority: 41,
				description: 'Obtener instancias de despliegue en sus workspaces',
				status: 'active' as const
			},
			{
				module: 'deployment-instances',
				action: 'create',
				scope: 'workspace' as const,
				priority: 41,
				description: 'Crear instancias de despliegue en sus workspaces',
				status: 'active' as const
			},
			{
				module: 'deployment-instances',
				action: 'update',
				scope: 'workspace' as const,
				priority: 41,
				description: 'Modificar instancias de despliegue en sus workspaces',
				status: 'active' as const
			},
			{
				module: 'deployment-instances',
				action: 'delete',
				scope: 'workspace' as const,
				priority: 41,
				description: 'Eliminar instancias de despliegue en sus workspaces',
				status: 'active' as const
			},
			{
				module: 'deployment-types',
				action: 'list',
				scope: 'workspace' as const,
				priority: 41,
				description: 'Ver tipos de despliegue en sus workspaces',
				status: 'active' as const
			},
			{
				module: 'deployment-queue',
				action: 'list',
				scope: 'workspace' as const,
				priority: 42,
				description: 'Ver cola de despliegues en sus workspaces',
				status: 'active' as const
			},
			{
				module: 'deployment-queue',
				action: 'create',
				scope: 'workspace' as const,
				priority: 42,
				description: 'Crear cola de despliegues en sus workspaces',
				status: 'active' as const
			},
			{
				module: 'deployment-queue',
				action: 'update',
				scope: 'workspace' as const,
				priority: 42,
				description: 'Modificar cola de despliegues en sus workspaces',
				status: 'active' as const
			},
			{
				module: 'deployment-queue',
				action: 'cancel',
				scope: 'workspace' as const,
				priority: 42,
				description: 'Cancelar cola de despliegues en sus workspaces',
				status: 'active' as const
			},
			{
				module: 'deployment-queue',
				action: 'delete',
				scope: 'workspace' as const,
				priority: 42,
				description: 'Eliminar cola de despliegues en sus workspaces',
				status: 'active' as const
			},
			{
				module: 'deployment-queue',
				action: 'get',
				scope: 'workspace' as const,
				priority: 42,
				description: 'Obtener cola de despliegues en sus workspaces',
				status: 'active' as const
			},
			{
				module: 'deployment-queue',
				action: 'stats',
				scope: 'workspace' as const,
				priority: 42,
				description: 'Ver estadísticas de cola de despliegues en sus workspaces',
				status: 'active' as const
			}
		]

		const permissions = []
		for (const config of permissionConfigs) {
			const permission = await Permission.findOrCreate({
				where: {
					module: config.module,
					action: config.action,
					scope: config.scope
				},
				defaults: config
			})
			permissions.push(permission[0])
		}

		// Assign permissions to roles
		// SuperAdmin: All permissions
		for (const permission of permissions) {
			await RolePermission.findOrCreate({
				where: {
					roleId: superAdminRole[0].id,
					permissionId: permission.id
				},
				defaults: {
					roleId: superAdminRole[0].id,
					permissionId: permission.id,
					granted: true
				}
			})
		}

		// Admin: All except user and role management
		const adminPermissions = permissions.filter(
			(p) => !((p.module === 'users' || p.module === 'roles') && ['create', 'delete', 'admin'].includes(p.action))
		)

		for (const permission of adminPermissions) {
			await RolePermission.findOrCreate({
				where: {
					roleId: adminRole[0].id,
					permissionId: permission.id
				},
				defaults: {
					roleId: adminRole[0].id,
					permissionId: permission.id,
					granted: true
				}
			})
		}

		// Manager: Project and workflow management
		const managerPermissions = permissions.filter(
			(p) =>
				[
					'workspaces',
					'projects',
					'storage',
					'storage-credentials',
					'workflows',
					'executions',
					'dashboard',
					'nodes',
					'workers',
					'deployments',
					'deployment-instances',
					'deployment-types'
				].includes(p.module) &&
				['create', 'list', 'update', 'execute', 'get', 'getVersions', 'search', 'groups', 'info', 'stats', 'dashboard', 'message'].includes(
					p.action
				)
		)

		for (const permission of managerPermissions) {
			await RolePermission.findOrCreate({
				where: {
					roleId: managerRole[0].id,
					permissionId: permission.id
				},
				defaults: {
					roleId: managerRole[0].id,
					permissionId: permission.id,
					granted: true
				}
			})
		}

		// User: Basic access
		const userPermissions = permissions.filter(
			(p) =>
				['workspaces', 'projects', 'workflows', 'executions', 'dashboard', 'settings', 'nodes', 'workers'].includes(p.module) &&
				['list', 'execute', 'get', 'getVersions', 'search', 'groups', 'info', 'stats', 'dashboard'].includes(p.action)
		)

		for (const permission of userPermissions) {
			await RolePermission.findOrCreate({
				where: {
					roleId: userRole[0].id,
					permissionId: permission.id
				},
				defaults: {
					roleId: userRole[0].id,
					permissionId: permission.id,
					granted: true
				}
			})
		}

		// Viewer: Only read access
		const viewerPermissions = permissions.filter(
			(p) =>
				p.action === 'list' ||
				p.action === 'dashboard' ||
				(p.module === 'nodes' && ['get', 'getVersions', 'search', 'groups', 'info', 'stats'].includes(p.action))
		)

		for (const permission of viewerPermissions) {
			await RolePermission.findOrCreate({
				where: {
					roleId: viewerRole[0].id,
					permissionId: permission.id
				},
				defaults: {
					roleId: viewerRole[0].id,
					permissionId: permission.id,
					granted: true
				}
			})
		}

		// Create admin user
		// random password
		const randomPassword = Array.from({ length: 8 }, () => {
			const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
			return chars.charAt(Math.floor(Math.random() * chars.length))
		}).join('')

		const adminPasswordHash = await bcrypt.hash(randomPassword.toString(), 10)
		const [adminUser, created] = await User.findOrCreate({
			where: { email: 'admin@horizon.com' },
			defaults: {
				email: 'admin@horizon.com',
				name: 'Administrator',
				password: adminPasswordHash,
				avatar: 'https://ui-avatars.com/api/?name=Administrator&background=3b82f6&color=fff',
				roleId: superAdminRole[0].id,
				status: 'active'
			}
		})
		// Si se crea mostrar la contraseña en consola
		if (created) {
			console.log('===============================================')
			console.log('ℹ️  Contraseña administrador:', randomPassword)
			console.log('===============================================')
		}

		// Create user settings for all users
		const defaultSettings = {
			fontSize: 16,
			canvasRefreshRate: 33,
			language: 'es',
			notifications: {
				general: true,
				workflowExecution: true,
				errors: true,
				systemUpdates: false,
				projectReminders: true
			},
			performance: {
				reducedAnimations: false,
				autoSave: true,
				canvasRefreshRate: 25
			},
			privacy: {
				telemetry: false,
				localCache: true
			}
		}

		// Admin settings (with system updates enabled)
		await UserSettings.findOrCreate({
			where: { userId: adminUser.id },
			defaults: {
				userId: adminUser.id,
				...defaultSettings,
				notifications: {
					...defaultSettings.notifications,
					systemUpdates: true
				}
			}
		})

		// Create default workspaces
		const adminWorkspace = await Workspace.findOrCreate({
			where: {
				userId: adminUser.id,
				isDefault: true
			},
			defaults: {
				name: 'Admin Workspace',
				description: 'Workspace principal del administrador',
				color: '#3b82f6',
				icon: 'mdi-briefcase',
				userId: adminUser.id,
				isDefault: true,
				status: 'active'
			}
		})

		// Create base deployment instances with logical predecessor relationships
		const deploymentInstances = [
			{
				name: 'Desarrollo',
				description: 'Instancia de despliegue para el entorno de desarrollo y testing',
				versionChange: 'patch' as const,
				status: 'active' as const,
				predecessors: [] // Sin predecesores - punto de inicio
			},
			{
				name: 'QA Testing',
				description: 'Instancia dedicada para pruebas de calidad y testing automatizado',
				versionChange: 'patch' as const,
				status: 'active' as const,
				predecessors: [] // Se establecerá después de crear Desarrollo
			},
			{
				name: 'Staging',
				description: 'Instancia de despliegue para pruebas y validación antes de producción',
				versionChange: 'minor' as const,
				status: 'active' as const,
				predecessors: [] // Se establecerá después de crear QA Testing
			},
			{
				name: 'Pre-Producción',
				description: 'Instancia espejo de producción para pruebas finales',
				versionChange: 'minor' as const,
				status: 'active' as const,
				predecessors: [] // Se establecerá después de crear Staging
			},
			{
				name: 'Producción Principal',
				description: 'Instancia de despliegue para el entorno de producción principal con alta disponibilidad',
				versionChange: 'major' as const,
				status: 'active' as const,
				predecessors: [] // Se establecerá después de crear Pre-Producción
			},
			{
				name: 'Demo',
				description: 'Instancia para demostraciones y presentaciones a clientes',
				versionChange: 'none' as const,
				status: 'inactive' as const,
				predecessors: [] // Se establecerá después de crear Staging
			}
		]

		// Crear instancias y almacenar referencias para establecer predecesores
		const createdInstances: { [key: string]: any } = {}

		for (const instanceData of deploymentInstances) {
			const [instance] = await DeploymentInstance.findOrCreate({
				where: { name: instanceData.name },
				defaults: instanceData
			})
			createdInstances[instanceData.name] = instance
		}

		// Establecer relaciones de predecesores después de que todas las instancias estén creadas
		const predecessorRelationships = [
			{
				instance: 'QA Testing',
				predecessors: ['Desarrollo']
			},
			{
				instance: 'Staging',
				predecessors: ['QA Testing']
			},
			{
				instance: 'Pre-Producción',
				predecessors: ['Staging']
			},
			{
				instance: 'Producción Principal',
				predecessors: ['Pre-Producción']
			},
			{
				instance: 'Demo',
				predecessors: ['Staging'] // Demo puede usar Staging como base
			}
		]

		// Actualizar instancias con sus predecesores
		for (const relationship of predecessorRelationships) {
			const predecessorIds = relationship.predecessors.map((name) => createdInstances[name].id)
			await createdInstances[relationship.instance].update({
				predecessors: predecessorIds
			})
		}

		console.log('Database seeded successfully!')
	} catch (error) {
		console.error('Error seeding database:', error)
		throw error
	}
}
