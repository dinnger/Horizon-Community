import WorkflowHistory, { type WorkflowHistoryCreationAttributes } from '../models/WorkflowHistory.js'
import { Op } from 'sequelize'

/**
 * Registra un cambio en el historial del workflow
 */
export async function recordChange(data: WorkflowHistoryCreationAttributes): Promise<WorkflowHistory> {
	return await WorkflowHistory.create(data)
}

/**
 * Registra la creación de un nuevo workflow
 */
export async function recordCreation(
	projectId: string,
	workflowId: string,
	userId?: string,
	workflowData?: object,
	version = '0.0.1',
	metadata?: object
): Promise<WorkflowHistory> {
	return await recordChange({
		projectId,
		workflowId,
		userId,
		changeType: 'created',
		changeDescription: 'Workflow creado',
		newData: workflowData,
		version,
		metadata
	})
}

/**
 * Registra una actualización del workflow
 */
export async function recordUpdate(
	projectId: string,
	workflowId: string,
	userId?: string,
	newData?: object,
	version = '0.0.1',
	changeDescription = 'Workflow actualizado',
	metadata?: object
): Promise<WorkflowHistory> {
	return await recordChange({
		projectId,
		workflowId,
		userId,
		changeType: 'updated',
		changeDescription,
		newData,
		version,
		metadata
	})
}

/**
 * Registra la publicación de un workflow
 */
export async function recordPublication(
	projectId: string,
	workflowId: string,
	userId?: string,
	version = '0.0.1',
	metadata?: object
): Promise<WorkflowHistory> {
	return await recordChange({
		projectId,
		workflowId,
		userId,
		changeType: 'published',
		changeDescription: 'Workflow publicado',
		version,
		metadata
	})
}

/**
 * Registra el archivado de un workflow
 */
export async function recordArchive(
	projectId: string,
	workflowId: string,
	userId?: string,
	version = '0.0.1',
	metadata?: object
): Promise<WorkflowHistory> {
	return await recordChange({
		projectId,
		workflowId,
		userId,
		changeType: 'archived',
		changeDescription: 'Workflow archivado',
		version,
		metadata
	})
}

/**
 * Registra la restauración de un workflow
 */
export async function recordRestore(
	projectId: string,
	workflowId: string,
	userId?: string,
	version = '0.0.1',
	metadata?: object
): Promise<WorkflowHistory> {
	return await recordChange({
		projectId,
		workflowId,
		userId,
		changeType: 'restored',
		changeDescription: 'Workflow restaurado',
		version,
		metadata
	})
}

/**
 * Registra la eliminación de un workflow
 */
export async function recordDeletion(
	projectId: string,
	workflowId: string,
	userId?: string,
	workflowData?: object,
	version = '0.0.1',
	metadata?: object
): Promise<WorkflowHistory> {
	return await recordChange({
		projectId,
		workflowId,
		userId,
		changeType: 'deleted',
		changeDescription: 'Workflow eliminado',
		previousData: workflowData,
		version,
		metadata
	})
}

/**
 * Obtiene el historial de un workflow
 */
export async function getWorkflowHistory(
	workflowId: string,
	limit = 50,
	offset = 0
): Promise<{ history: WorkflowHistory[]; total: number }> {
	const { rows: history, count: total } = await WorkflowHistory.findAndCountAll({
		where: { workflowId },
		order: [['createdAt', 'DESC']],
		limit,
		offset,
		include: [
			{
				association: 'user',
				attributes: ['id', 'email', 'name']
			}
		]
	})

	return { history, total }
}

/**
 * Obtiene el historial por tipo de cambio
 */
export async function getHistoryByChangeType(
	workflowId: string,
	changeType: 'created' | 'updated' | 'published' | 'archived' | 'restored' | 'deleted',
	limit = 50,
	offset = 0
): Promise<{ history: WorkflowHistory[]; total: number }> {
	const { rows: history, count: total } = await WorkflowHistory.findAndCountAll({
		where: { workflowId, changeType },
		order: [['createdAt', 'DESC']],
		limit,
		offset,
		include: [
			{
				association: 'user',
				attributes: ['id', 'email', 'name']
			}
		]
	})

	return { history, total }
}

/**
 * Obtiene una versión específica del workflow desde el historial
 */
export async function getWorkflowVersion(workflowId: string, version: string): Promise<WorkflowHistory | null> {
	return await WorkflowHistory.findOne({
		where: { workflowId, version },
		order: [['createdAt', 'DESC']],
		include: [
			{
				association: 'user',
				attributes: ['id', 'email', 'name']
			}
		]
	})
}

/**
 * Obtiene el historial de cambios de un usuario
 */
export async function getUserWorkflowHistory(
	userId: string,
	limit = 50,
	offset = 0
): Promise<{ history: WorkflowHistory[]; total: number }> {
	const { rows: history, count: total } = await WorkflowHistory.findAndCountAll({
		where: { userId },
		order: [['createdAt', 'DESC']],
		limit,
		offset,
		include: [
			{
				association: 'workflow',
				attributes: ['id', 'name', 'description']
			}
		]
	})

	return { history, total }
}

/**
 * Limpia el historial antiguo (más de X días)
 */
export async function cleanOldHistory(daysToKeep = 365): Promise<number> {
	const cutoffDate = new Date()
	cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

	const deletedCount = await WorkflowHistory.destroy({
		where: {
			createdAt: {
				[Op.lt]: cutoffDate
			}
		}
	})

	return deletedCount
}
