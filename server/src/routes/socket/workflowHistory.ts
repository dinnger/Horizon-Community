import type { SocketData } from './index.js'
import * as WorkflowHistoryService from '../../services/WorkflowHistoryService.js'

export const setupWorkflowHistoryRoutes = {
	// Get workflow history - requires read permission
	'workflow-history:get': async ({ socket, data, callback }: SocketData) => {
		try {
			const { workflowId, limit = 50, offset = 0 } = data

			if (!workflowId) {
				callback({ success: false, message: 'ID de workflow requerido' })
				return
			}

			const result = await WorkflowHistoryService.getWorkflowHistory(workflowId, limit, offset)

			callback({ success: true, data: result })
		} catch (error) {
			console.error('Error al obtener historial de workflow:', error)
			callback({ success: false, message: 'Error interno del servidor' })
		}
	},

	// Get workflow history by change type - requires read permission
	'workflow-history:get-by-type': async ({ socket, data, callback }: SocketData) => {
		try {
			const { workflowId, changeType, limit = 50, offset = 0 } = data

			if (!workflowId) {
				callback({ success: false, message: 'ID de workflow requerido' })
				return
			}

			const validChangeTypes = ['created', 'updated', 'published', 'archived', 'restored', 'deleted']
			if (!validChangeTypes.includes(changeType)) {
				callback({ success: false, message: 'Tipo de cambio inválido' })
				return
			}

			const result = await WorkflowHistoryService.getHistoryByChangeType(
				workflowId,
				changeType as 'created' | 'updated' | 'published' | 'archived' | 'restored' | 'deleted',
				limit,
				offset
			)

			callback({ success: true, data: result })
		} catch (error) {
			console.error('Error al obtener historial por tipo:', error)
			callback({ success: false, message: 'Error interno del servidor' })
		}
	},

	// Get specific workflow version - requires read permission
	'workflow-history:get-version': async ({ socket, data, callback }: SocketData) => {
		try {
			const { workflowId, version } = data

			if (!workflowId || !version) {
				callback({ success: false, message: 'ID de workflow y versión requeridos' })
				return
			}

			const result = await WorkflowHistoryService.getWorkflowVersion(workflowId, version)

			if (!result) {
				callback({ success: false, message: 'Versión no encontrada' })
				return
			}

			callback({ success: true, data: result })
		} catch (error) {
			console.error('Error al obtener versión del workflow:', error)
			callback({ success: false, message: 'Error interno del servidor' })
		}
	},

	// Get user workflow history - requires read permission
	'workflow-history:get-user-history': async ({ socket, data, callback }: SocketData) => {
		try {
			const { userId, limit = 50, offset = 0 } = data

			if (!userId) {
				callback({ success: false, message: 'ID de usuario requerido' })
				return
			}

			const result = await WorkflowHistoryService.getUserWorkflowHistory(userId, limit, offset)

			callback({ success: true, data: result })
		} catch (error) {
			console.error('Error al obtener historial de usuario:', error)
			callback({ success: false, message: 'Error interno del servidor' })
		}
	},

	// Record workflow creation - internal use
	'workflow-history:record-creation': async ({ socket, data, callback }: SocketData) => {
		try {
			const { workflowId, userId, workflowData, version = '0.0.1', metadata } = data

			if (!workflowId) {
				callback({ success: false, message: 'ID de workflow requerido' })
				return
			}

			const result = await WorkflowHistoryService.recordCreation(workflowId, userId, workflowData, version, metadata)

			callback({ success: true, data: result })
		} catch (error) {
			console.error('Error al registrar creación:', error)
			callback({ success: false, message: 'Error interno del servidor' })
		}
	},

	// Record workflow update - internal use
	'workflow-history:record-update': async ({ socket, data, callback }: SocketData) => {
		try {
			const { workflowId, userId, previousData, newData, version = '0.0.1', changeDescription = 'Workflow actualizado', metadata } = data

			if (!workflowId) {
				callback({ success: false, message: 'ID de workflow requerido' })
				return
			}

			const result = await WorkflowHistoryService.recordUpdate(workflowId, userId, previousData, newData, version, changeDescription)

			callback({ success: true, data: result })
		} catch (error) {
			console.error('Error al registrar actualización:', error)
			callback({ success: false, message: 'Error interno del servidor' })
		}
	},

	// Record workflow publication - internal use
	'workflow-history:record-publication': async ({ socket, data, callback }: SocketData) => {
		try {
			const { workflowId, userId, version = '0.0.1', metadata } = data

			if (!workflowId) {
				callback({ success: false, message: 'ID de workflow requerido' })
				return
			}

			const result = await WorkflowHistoryService.recordPublication(workflowId, userId, version, metadata)

			callback({ success: true, data: result })
		} catch (error) {
			console.error('Error al registrar publicación:', error)
			callback({ success: false, message: 'Error interno del servidor' })
		}
	},

	// Record workflow archive - internal use
	'workflow-history:record-archive': async ({ socket, data, callback }: SocketData) => {
		try {
			const { workflowId, userId, version = '0.0.1', metadata } = data

			if (!workflowId) {
				callback({ success: false, message: 'ID de workflow requerido' })
				return
			}

			const result = await WorkflowHistoryService.recordArchive(workflowId, userId, version, metadata)

			callback({ success: true, data: result })
		} catch (error) {
			console.error('Error al registrar archivado:', error)
			callback({ success: false, message: 'Error interno del servidor' })
		}
	},

	// Record workflow restoration - internal use
	'workflow-history:record-restore': async ({ socket, data, callback }: SocketData) => {
		try {
			const { workflowId, userId, version = '0.0.1', metadata } = data

			if (!workflowId) {
				callback({ success: false, message: 'ID de workflow requerido' })
				return
			}

			const result = await WorkflowHistoryService.recordRestore(workflowId, userId, version, metadata)

			callback({ success: true, data: result })
		} catch (error) {
			console.error('Error al registrar restauración:', error)
			callback({ success: false, message: 'Error interno del servidor' })
		}
	},

	// Record workflow deletion - internal use
	'workflow-history:record-deletion': async ({ socket, data, callback }: SocketData) => {
		try {
			const { workflowId, userId, workflowData, version = '0.0.1', metadata } = data

			if (!workflowId) {
				callback({ success: false, message: 'ID de workflow requerido' })
				return
			}

			const result = await WorkflowHistoryService.recordDeletion(workflowId, userId, workflowData, version, metadata)

			callback({ success: true, data: result })
		} catch (error) {
			console.error('Error al registrar eliminación:', error)
			callback({ success: false, message: 'Error interno del servidor' })
		}
	},

	// Clean old history - admin permission required
	'workflow-history:cleanup': async ({ socket, data, callback }: SocketData) => {
		try {
			const { daysToKeep = 365 } = data

			if (daysToKeep < 1 || daysToKeep > 3650) {
				callback({ success: false, message: 'Días a mantener debe ser entre 1 y 3650' })
				return
			}

			const deletedCount = await WorkflowHistoryService.cleanOldHistory(daysToKeep)

			callback({
				success: true,
				message: `Se eliminaron ${deletedCount} registros de historial`,
				deletedCount
			})
		} catch (error) {
			console.error('Error al limpiar historial:', error)
			callback({ success: false, message: 'Error interno del servidor' })
		}
	}
}
