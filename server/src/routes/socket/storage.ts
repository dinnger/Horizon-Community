import type { SocketData } from './index.js'
import type { IPropertiesType } from '@shared/interfaces/workflow.properties.interface.js'
import { Storage, type StorageAttributes } from '../../models/index.js'
import { getNodeInfo, getNodesInfo } from '@shared/engine/node.engine.js'
import { onCredentialModule } from '@server/src/modules/context.js'

export const setupStorageRoutes = {
	// List all available node classes - requires read permission
	'storage-credentials:list': async ({ callback }: SocketData) => {
		const arr = getNodesInfo()
		const getNodeCredentials = Object.keys(arr)
			.filter((key) => arr[key].credentials)
			.map((key) => {
				return {
					name: key,
					info: arr[key].info
				}
			})
		callback({ success: true, credentials: getNodeCredentials })
	},
	// Get the properties of a node class - requires read permission
	'storage-credentials:get': async ({ callback, data }: SocketData) => {
		const { node } = data as { node: string }
		const nodeInfo = getNodeInfo(node)
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
					const node = getNodesInfo()[storage.nodeType]
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
			const storage = await Storage.findOne({
				attributes: ['id', 'name', 'type', 'nodeType', 'status', 'createdAt'],
				where: { id }
			})
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
	'storage:create': async ({
		data,
		callback,
		socket,
		io
	}: SocketData<Omit<StorageAttributes, 'id' | 'data' | 'createdAt' | 'updatedAt' | 'status'> & { data: IPropertiesType }>) => {
		try {
			// =======================================================================
			// Valores iniciales
			// =======================================================================
			const dataProperties = JSON.stringify(
				Object.fromEntries(
					Object.entries(data.properties || {}).map(([key, value]) => {
						if (value && typeof value === 'object' && 'value' in value) {
							return [key, (value as { value: unknown }).value]
						}
						return [key, value]
					})
				)
			)
			let dataResult = ''
			const dataReturnedValues: string[] = []

			// =======================================================================
			// Credenciales
			// =======================================================================
			if (data.type === 'credential' && data.nodeType) {
				const nodeCredentials = getNodeInfo(data.nodeType)

				if (nodeCredentials && 'onCredential' in nodeCredentials && typeof nodeCredentials.onCredential === 'function') {
					try {
						// Crear instancia del nodo para obtener credenciales
						const fnOnCredential = nodeCredentials.onCredential

						// Ejecutar onCredential del nodo
						const credentialResult = await fnOnCredential(onCredentialModule({ socket, credentials: data.properties }))

						if (credentialResult?.status && credentialResult?.data) {
						} else {
							return callback({ success: false, message: 'No se pudieron obtener las credenciales del nodo' })
						}
						dataResult = JSON.stringify(credentialResult.data)
						// Extraer keys de los valores devueltos
						if (credentialResult.data && typeof credentialResult.data === 'object') {
							dataReturnedValues.push(...Object.keys(credentialResult.data))
						}
					} catch (credentialError) {
						console.error('Error ejecutando onCredential:', credentialError)
						return callback({
							success: false,
							message: `Error al procesar credenciales: ${credentialError instanceof Error ? credentialError.message : 'Error desconocido'}`
						})
					}
				} else {
					return callback({ success: false, message: 'El nodo especificado no tiene configuración de credenciales' })
				}
			}

			// =======================================================================
			// Crear storage
			// =======================================================================
			const storage = await Storage.create({ ...data, properties: dataProperties, data: dataResult, returnedValues: dataReturnedValues })
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
