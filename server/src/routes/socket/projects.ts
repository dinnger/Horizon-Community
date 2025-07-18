import { Project, Workspace } from '../../models/index.js'
import type { SocketData } from './index.js'

export const setupProjectRoutes = {
	// List projects - requires read permission
	'projects:list': async ({ data, callback }: SocketData) => {
		try {
			const { workspaceId } = data

			const projects = await Project.findAll({
				where: { workspaceId, status: 'active' },
				order: [['createdAt', 'DESC']]
			})

			callback({ success: true, projects })
		} catch (error) {
			console.error('Error listando proyectos:', error)
			callback({ success: false, message: 'Error al cargar proyectos' })
		}
	},

	// Get project by ID - requires read permission
	'projects:get': async ({ socket, data, callback }: SocketData) => {
		try {
			const { workspaceId, projectId } = data

			const project = await Project.findOne({
				where: {
					id: projectId,
					workspaceId,
					status: 'active'
				}
			})

			if (!project) {
				callback({ success: false, message: 'Project not found' })
				return
			}

			callback({ success: true, project })
		} catch (error) {
			console.error('Error obteniendo project:', error)
			callback({ success: false, message: 'Error al obtener project' })
		}
	},

	// Create project - requires create permission
	'projects:create': async ({ socket, data, callback }: SocketData) => {
		try {
			const project = await Project.create(data)
			callback({ success: true, project })
		} catch (error) {
			console.error('Error creando proyecto:', error)
			callback({ success: false, message: 'Error al crear proyecto' })
		}
	},

	// Update project - requires update permission
	'projects:update': async ({ socket, data, callback }: SocketData) => {
		try {
			const { id, ...updates } = data

			const [updatedRows] = await Project.update(updates, { where: { id } })
			if (updatedRows > 0) {
				const updatedProject = await Project.findByPk(id)
				callback({ success: true, project: updatedProject })
			} else {
				callback({ success: false, message: 'Error al actualizar proyecto' })
			}
		} catch (error) {
			console.error('Error actualizando proyecto:', error)
			callback({ success: false, message: 'Error al actualizar proyecto' })
		}
	},

	// Delete project - requires delete permission
	'projects:delete': async ({ socket, data, callback }: SocketData) => {
		try {
			const { id } = data

			await Project.update({ status: 'archived' }, { where: { id } })
			callback({ success: true })
		} catch (error) {
			console.error('Error eliminando proyecto:', error)
			callback({ success: false, message: 'Error al eliminar proyecto' })
		}
	}
}
