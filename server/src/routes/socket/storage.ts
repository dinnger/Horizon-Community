import { getNodeCredentials, getNodeInfo } from '@shared/store/node.store.js'
import { Storage, type StorageAttributes } from '../../models/index.js'
import type { SocketData } from './index.js'

export const setupStorageRoutes = {
	// List all available node classes - requires read permission
	'storage-credentials:list': async ({ callback }: SocketData) => {
		callback({ success: true, credentials: getNodeCredentials() })
	},
	// Get the properties of a node class - requires read permission
	'storage-credentials:get': async ({ callback, data }: SocketData) => {
		const { node } = data as { node: string }

		const nodeInfo = getNodeCredentials(node)
		if (!nodeInfo) return callback({ success: false, message: 'No se encontró la credencial' })
		const credentials = 'credentials' in nodeInfo ? nodeInfo.credentials : undefined
		return callback({ success: true, credentials })
	},

	// Listar storages por workspace
	'storage:list': async ({ data, callback }: SocketData<Pick<StorageAttributes, 'workspaceId' | 'type'>>) => {
		try {
			const { workspaceId, type } = data

			const storages = await Storage.findAll({
				attributes: ['id', 'name', 'type', 'nodeType', 'status', 'createdAt'],
				where: { workspaceId, status: 'active', type },
				order: [['createdAt', 'DESC']]
			})
			callback({
				success: true,
				storages: storages.map((storage: any) => {
					const node = getNodeInfo()[storage.nodeType]
					storage.dataValues.node = node ? node.info : null
					return { ...storage.dataValues }
				})
			})
		} catch (error) {
			console.error('Error listando storages:', error)
			callback({ success: false, message: 'Error al cargar storages' })
		}
	},

	// Obtener storage por ID
	'storage:get': async ({ data, callback }: SocketData) => {
		try {
			const { id } = data
			const storage = await Storage.findByPk(id)
			if (!storage) {
				callback({ success: false, message: 'Storage not found' })
				return
			}
			callback({ success: true, storage })
		} catch (error) {
			console.error('Error obteniendo storage:', error)
			callback({ success: false, message: 'Error al obtener storage' })
		}
	},

	// Crear storage
	'storage:create': async ({ data, callback }: SocketData<Omit<StorageAttributes, 'id' | 'createdAt' | 'updatedAt' | 'status'>>) => {
		try {
			const storage = await Storage.create(data)
			callback({ success: true, storage })
		} catch (error) {
			console.error('Error creando storage:', error)
			callback({ success: false, message: 'Error al crear storage' })
		}
	},

	// Actualizar storage
	'storage:update': async ({ data, callback }: SocketData<Omit<StorageAttributes, 'createdAt' | 'updatedAt' | 'status'>>) => {
		try {
			const { id, ...updates } = data
			const [updatedRows] = await Storage.update(updates, { where: { id } })
			if (updatedRows > 0) {
				const updatedStorage = await Storage.findByPk(id)
				callback({ success: true, storage: updatedStorage })
			} else {
				callback({ success: false, message: 'Error al actualizar storage' })
			}
		} catch (error) {
			console.error('Error actualizando storage:', error)
			callback({ success: false, message: 'Error al actualizar storage' })
		}
	},

	// Eliminar storage (soft delete)
	'storage:delete': async ({ data, callback }: SocketData<Pick<StorageAttributes, 'id'>>) => {
		try {
			const { id } = data
			await Storage.update({ status: 'archived' }, { where: { id } })
			callback({ success: true })
		} catch (error) {
			console.error('Error eliminando storage:', error)
			callback({ success: false, message: 'Error al eliminar storage' })
		}
	}
}
