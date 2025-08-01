import { getNodeCredentials, getNodeInfo } from '@shared/store/node.store.js'
import { Storage, type StorageAttributes } from '../../models/index.js'
import { envs } from '../../config/envs.js'
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
	'storage:create': async ({
		data,
		callback,
		socket,
		io
	}: SocketData<Omit<StorageAttributes, 'id' | 'createdAt' | 'updatedAt' | 'status'>>) => {
		try {
			const storageData = { ...data }

			// Si es tipo credential, verificar si el nodo tiene onCredential y ejecutarla
			if (data.type === 'credential' && data.nodeType) {
				const nodeCredentials = getNodeCredentials(data.nodeType)

				if (nodeCredentials && 'class' in nodeCredentials && typeof nodeCredentials.class === 'function') {
					try {
						// Crear instancia del nodo para obtener credenciales
						const nodeClass = nodeCredentials.class
						const nodeInstance = new nodeClass()

						// Primero ejecutar onUpdateCredential si existe para configurar el callback
						if (nodeInstance.onUpdateCredential) {
							const credentialContext = {
								environments: {
									serverUrl: envs.SERVER_URL,
									baseUrl: envs.CLIENT_URL,
									callback: `${envs.CLIENT_URL}/auth/callback`
								}
							}

							await nodeInstance.onUpdateCredential({
								properties: nodeInstance.credentials,
								context: credentialContext
							})
						}

						// Crear cliente real que se comunica con el frontend
						const realClient = {
							openUrl: async (options: any) => {
								return new Promise((resolve, reject) => {
									// Emitir evento al cliente para abrir URL
									socket.emit('credential:open-url', options, (response: any) => {
										if (response.success) {
											resolve(response)
										} else {
											reject(new Error(response.message || 'Error al abrir URL'))
										}
									})

									// Timeout de 5 minutos para la respuesta
									setTimeout(() => {
										reject(new Error('Timeout: El usuario no completó la autenticación'))
									}, 300000)
								})
							}
						}

						// Crear dependency real
						const realDependency = {
							getRequire: async (moduleName: string) => {
								try {
									// Usar dynamic import para ES modules o require para CommonJS
									if (moduleName === 'axios') {
										const axios = await import('axios')
										return axios.default || axios
									}

									// Para otros módulos, intentar import dinámico primero
									try {
										const module = await import(moduleName)
										return module.default || module
									} catch {
										// Fallback a require si import falla
										return require(moduleName)
									}
								} catch (error) {
									throw new Error(`No se pudo cargar el módulo: ${moduleName}`)
								}
							}
						}

						// Ejecutar onCredential del nodo
						const credentialResult = await nodeInstance.onCredential({
							client: realClient,
							dependency: realDependency
						})

						if (credentialResult?.status && credentialResult?.data) {
							// Convert credential data to string for storage
							const credentialDataString = JSON.stringify({
								...storageData.data,
								credentialData: credentialResult.data,
								timestamp: new Date().toISOString()
							})

							// Guardar los datos de credencial en el storage (cast to any due to model flexibility)
							storageData.data = credentialDataString as any
						} else {
							return callback({
								success: false,
								message: 'No se pudieron obtener las credenciales del nodo'
							})
						}
					} catch (credentialError) {
						console.error('Error ejecutando onCredential:', credentialError)
						return callback({
							success: false,
							message: `Error al procesar credenciales: ${credentialError instanceof Error ? credentialError.message : 'Error desconocido'}`
						})
					}
				} else {
					return callback({
						success: false,
						message: 'El nodo especificado no tiene configuración de credenciales'
					})
				}
			}

			const storage = await Storage.create(storageData)
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
