import type { IClassNode, classOnCreateInterface, classOnExecuteInterface, infoInterface } from '@shared/interfaces/class.interface.js'
import type { IPropertiesType, IStringProperty, INumberProperty } from '@shared/interfaces/workflow.properties.interface.js'

interface IProperties extends IPropertiesType {
	key: IStringProperty
	stdTTL: INumberProperty
	checkperiod: INumberProperty
}

export default class implements IClassNode<IProperties> {
	private cacheInstance: any = null

	constructor(
		public dependencies: string[],
		public info: infoInterface,
		public properties: IProperties
	) {
		this.dependencies = ['node-cache']
		this.info = {
			name: 'Cache',
			desc: 'Almacena y recupera datos en memoria usando node-cache',
			icon: '󰍉',
			group: 'Utilities',
			color: '#27AE60',
			connectors: {
				inputs: ['get', 'set'],
				outputs: ['response', 'noExist']
			},
			isSingleton: true
		}

		this.properties = {
			key: {
				name: 'Clave',
				type: 'string',
				value: '',
				description: 'La clave para almacenar/recuperar datos del cache'
			},
			stdTTL: {
				name: 'TTL por defecto (segundos)',
				type: 'number',
				value: 600,
				description: 'Tiempo de vida por defecto para las claves en segundos (0 = sin expiración)'
			},
			checkperiod: {
				name: 'Período de verificación (segundos)',
				type: 'number',
				value: 120,
				description: 'Período en segundos para verificar claves expiradas (0 = deshabilitar)'
			}
		}
	}

	async onUpdateProperties({ context }: classOnCreateInterface) {
		// No hay configuraciones dinámicas por el momento
	}

	async onExecute({ execute, inputData, outputData, dependency }: classOnExecuteInterface) {
		const inputName = inputData.inputName
		try {
			const NodeCache = await dependency.getRequire('node-cache')
			const key = typeof this.properties.key.value === 'string' ? this.properties.key.value : JSON.stringify(this.properties.key.value)

			if (!this.cacheInstance) {
				this.cacheInstance = new NodeCache({
					stdTTL: this.properties.stdTTL.value,
					checkperiod: this.properties.checkperiod.value
				})
			}

			if (inputName === 'set') {
				const node = execute.getNodeByType('utilities/caching/cache')
				if (!node || !node.meta) return outputData('error', { error: 'No se encontró el nodo' })

				this.cacheInstance.set(node.meta.key, inputData.data)

				outputData('response', inputData.data)
			} else if (inputName === 'get') {
				if (!key) {
					throw new Error('La clave no puede estar vacía')
				}
				// Operación GET: recuperar datos del cache
				const cachedData = this.cacheInstance.get(key)

				if (cachedData !== undefined) {
					outputData('response', cachedData, { key })
				} else {
					outputData('noExist', inputData.data, { key })
				}
			}
		} catch (error: any) {
			outputData('noExist', {
				error: error.message || 'Error desconocido en operación de cache',
				operation: inputName,
				key: this.properties.key.value
			})
		}
	}
}
