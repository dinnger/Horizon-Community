import type {
	IClassNode,
	classOnUpdateInterface,
	classOnCredential,
	classOnExecuteInterface,
	infoInterface
} from '@shared/interfaces/class.interface.js'
import type {
	ICodeProperty,
	ICredentialProperty,
	INumberProperty,
	IOptionsProperty,
	IPasswordProperty,
	IPropertiesType,
	IStringProperty
} from '@shared/interfaces/workflow.properties.interface.js'

interface IProperties extends IPropertiesType {
	operation: IOptionsProperty
	authMode: IOptionsProperty // 'secret' or 'manual'
	authSecret: ICredentialProperty // Used if authMode is 'secret'
	host: IStringProperty // Used if authMode is 'manual'
	port: INumberProperty // Used if authMode is 'manual'
	password: IPasswordProperty // Used if authMode is 'manual', optional
	key: IStringProperty
	value: IStringProperty // Used for SET operation
	db: INumberProperty // Redis DB number
}

interface ICredentials extends IPropertiesType {
	host: IStringProperty
	port: INumberProperty
	password: IPasswordProperty // Optional
	db: INumberProperty
	additionalOptions: ICodeProperty
}

export default class implements IClassNode<IProperties, ICredentials> {
	private redisConnections = new Map<string, any>()
	constructor(
		public accessSecrets: boolean,
		public dependencies: string[],
		public info: infoInterface,
		public properties: IProperties,
		public credentials: ICredentials
	) {
		this.accessSecrets = true
		this.dependencies = ['ioredis']
		this.info = {
			name: 'Redis',
			desc: 'Conecta con Redis para obtener o asignar datos',
			icon: '󰽘', // Placeholder icon, consider finding a better one
			group: 'Database',
			color: '#DC382D',
			connectors: {
				inputs: ['input'],
				outputs: ['response', 'error']
			},
			isSingleton: true
		}

		this.properties = {
			authMode: {
				name: 'Modo de Autenticación',
				type: 'options',
				options: [
					{ label: 'Usar Secreto', value: 'secret' },
					{ label: 'Configuración Manual', value: 'manual' }
				],
				value: 'manual'
			},
			authSecret: {
				name: 'Credencial de Redis',
				type: 'credential',
				options: [],
				value: '',
				show: false
			},
			host: {
				name: 'Host',
				type: 'string',
				value: '127.0.0.1'
			},
			port: {
				name: 'Puerto',
				type: 'number',
				value: 6379
			},
			password: {
				name: 'Contraseña',
				type: 'password',
				value: ''
			},
			db: {
				name: 'DB Número',
				type: 'number',
				value: 0,
				description: 'Número de la base de datos Redis (ej: 0)'
			},
			operation: {
				name: 'Operación',
				type: 'options',
				options: [
					{ label: 'GET (Obtener valor)', value: 'get' },
					{ label: 'SET (Asignar valor)', value: 'set' },
					{ label: 'DEL (Eliminar clave)', value: 'del' },
					{ label: 'KEYS (Listar claves por patrón)', value: 'keys' },
					{ label: 'EXISTS (Verificar si existe clave)', value: 'exists' }
				],
				value: 'get'
			},
			key: {
				name: 'Clave / Patrón',
				type: 'string',
				value: '',
				description: 'La clave para operaciones GET/SET/DEL/EXISTS, o patrón para KEYS (ej: user:*)'
			},
			value: {
				name: 'Valor',
				type: 'string',
				value: '',
				description: 'El valor a asignar (solo para operación SET)',
				show: false
			}
		}

		this.credentials = {
			host: {
				name: 'Host',
				type: 'string',
				value: '127.0.0.1',
				required: true
			},
			port: {
				name: 'Puerto',
				type: 'number',
				value: 6379,
				required: true
			},
			password: {
				name: 'Contraseña',
				type: 'password',
				value: '',
				required: false
			},
			db: {
				name: 'DB Número',
				type: 'number',
				value: 0,
				required: false,
				description: 'Número de la base de datos Redis (ej: 0)'
			},
			additionalOptions: {
				name: 'Opciones adicionales',
				type: 'code',
				lang: 'json',
				value: '{\n}'
			}
		}
	}

	async onUpdateProperties({ context }: classOnUpdateInterface) {
		const authMode = this.properties.authMode.value
		const operation = this.properties.operation.value

		// Configurar visibilidad de campos según el modo de autenticación
		if (authMode === 'secret') {
			this.properties.authSecret.show = true
			this.properties.db.show = false
			this.properties.host.show = false
			this.properties.port.show = false
			this.properties.password.show = false
		} else {
			this.properties.authSecret.show = false
			this.properties.db.show = true
			this.properties.host.show = true
			this.properties.port.show = true
			this.properties.password.show = true
		}

		// Configurar visibilidad del campo valor según la operación
		if (operation === 'set') {
			this.properties.value.show = true
		} else {
			this.properties.value.show = false
		}
	}

	async onExecute({ outputData, dependency, credential }: classOnExecuteInterface) {
		const Redis = await dependency.getRequire('ioredis')

		let redisClient: any

		try {
			let connectionOpts: any
			let connectionKey: string
			const dbNumber = this.properties.db.value || 0

			if (this.properties.authMode.value === 'secret') {
				connectionKey = `secret_${String(this.properties.authSecret.value)}`
				const redisAuthCredentials = await credential.getCredential(String(this.properties.authSecret.value))
				connectionOpts = {
					host: redisAuthCredentials.host,
					port: Number(redisAuthCredentials.port),
					db: Number(redisAuthCredentials.db) || 0
				}
				if (redisAuthCredentials.password) {
					connectionOpts.password = redisAuthCredentials.password
				}
			} else if (this.properties.authMode.value === 'manual') {
				connectionKey = `manual_${this.properties.host.value}_${this.properties.port.value}_${dbNumber}`
				connectionOpts = {
					host: this.properties.host.value,
					port: Number(this.properties.port.value),
					db: dbNumber
				}
				if (this.properties.password.value) {
					connectionOpts.password = this.properties.password.value
				}
			} else {
				return outputData('error', { error: 'Modo de autenticación no válido' })
			}

			// Obtener conexión existente o crear nueva
			const existingConnection = this.redisConnections.get(connectionKey)

			if (existingConnection && existingConnection.status === 'ready') {
				redisClient = existingConnection
			} else {
				// Remover conexión cerrada o inválida del mapa
				if (existingConnection) {
					this.redisConnections.delete(connectionKey)
				}

				redisClient = new Redis(connectionOpts)

				// Manejar eventos de conexión
				redisClient.on('error', (err: any) => {
					console.error('Redis connection error:', err)
					this.redisConnections.delete(connectionKey)
				})

				redisClient.on('end', () => {
					this.redisConnections.delete(connectionKey)
				})

				redisClient.on('close', () => {
					this.redisConnections.delete(connectionKey)
				})

				// Guardar la nueva conexión
				this.redisConnections.set(connectionKey, redisClient)
			}

			// Verificar conexión
			await redisClient.ping()

			const operation = this.properties.operation.value
			const key = this.properties.key.value
			const value = this.properties.value.value
			let result: any

			if (!operation) {
				return outputData('error', {
					error: 'No se ha seleccionado una operación.'
				})
			}

			if (!key && ['get', 'set', 'del', 'exists', 'keys'].includes(String(operation))) {
				throw new Error('La clave o patrón no puede estar vacía para esta operación.')
			}

			switch (operation) {
				case 'get':
					result = await redisClient.get(key)
					break
				case 'set':
					result = await redisClient.set(key, value)
					break
				case 'del':
					result = await redisClient.del(key)
					break
				case 'keys':
					result = await redisClient.keys(key)
					break
				case 'exists':
					result = await redisClient.exists(key)
					break
				default:
					return outputData('error', { error: 'Operación no reconocida' })
			}

			try {
				outputData('response', JSON.parse(result))
			} catch (_) {
				outputData('response', result)
			}
		} catch (error: any) {
			let message = 'Error: '
			if (error instanceof Error) message += error.message
			else message += String(error)

			// Si hay error de conexión, remover del mapa para forzar reconexión
			if (message.includes('Connection is closed') || message.includes('ECONNREFUSED')) {
				const connectionKey =
					this.properties.authMode.value === 'secret'
						? `secret_${String(this.properties.authSecret.value)}`
						: `manual_${this.properties.host.value}_${this.properties.port.value}_${this.properties.db.value || 0}`
				this.redisConnections.delete(connectionKey)
			}

			outputData('error', { error: message })
		}
		// NO cerramos la conexión aquí para permitir reutilización
	}

	async onCredential({ action, dependency }: classOnCredential) {
		if (action === 'test') {
			let redisClient: any
			const Redis = await dependency.getRequire('ioredis')
			try {
				const config = {
					host: this.credentials.host.value,
					port: this.credentials.port.value,
					password: this.credentials.password.value,
					db: this.credentials.db.value,
					lazyConnect: true,
					connectTimeout: 5000,
					maxRetriesPerRequest: 3,
					...(this.credentials.additionalOptions.value as object)
				}
				redisClient = new Redis(config)
				// Manejar eventos de conexión
				redisClient.on('error', () => {})
				redisClient.on('end', () => {})
				redisClient.on('close', () => {})
				await redisClient.ping()
				return { status: true, data: { alert: 'Conexión establecida', type: 'info' } }
			} catch (error: any) {
				redisClient.disconnect()
				return { status: false, data: { alert: String(error.message), type: 'error' } }
			}
		}
		const { host, port, password, db, additionalOptions } = this.credentials
		// Las credenciales se definen directamente en la configuración del nodo de credenciales.
		// Este método podría usarse para validaciones adicionales si fuera necesario.
		return {
			status: true,
			data: {
				host: host.value,
				port: port.value,
				password: password.value,
				db: db.value,
				...(additionalOptions.value as object)
			}
		}
	}
}
