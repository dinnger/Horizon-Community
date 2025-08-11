//  https://node-oracledb.readthedocs.io/en/v6.7.2/user_guide/aq.html
import type { IClassNode, classOnUpdateInterface, classOnExecuteInterface, infoInterface } from '@shared/interfaces/class.interface.js'
import type {
	ICodeProperty,
	INumberProperty,
	IOptionsProperty,
	IPropertiesType,
	ISecretProperty,
	IStringProperty,
	ISwitchProperty
} from '@shared/interfaces/workflow.properties.interface.js'

export default class OracleAQNode implements IClassNode {
	accessSecrets = true
	dependencies = ['oracledb']
	info = {
		name: 'Oracle AQ',
		desc: 'Consumir o producir mensajes en Oracle Advanced Queuing',
		icon: '󰘙',
		group: 'Base de Datos',
		color: '#F80000',
		connectors: {
			inputs: [{ name: 'input' }],
			outputs: [{ name: 'response' }, { name: 'error' }]
		},
		isSingleton: true
	}

	properties = {
		connection: {
			name: 'Tipo de conexión',
			type: 'options',
			options: [
				{
					label: 'Manual',
					value: 'manual'
				},
				{
					label: 'Secreto',
					value: 'secret'
				}
			],
			value: 'manual'
		} as IOptionsProperty,
		config: {
			name: 'Configuración',
			type: 'code',
			lang: 'json',
			value: `{
  "host": "localhost",
  "username": "user",
  "password": "password",
  "database": "mydatabase",
  "port": 5432,
  "logging": false
}`
		} as ICodeProperty,
		configSecret: {
			name: 'Configuración',
			type: 'secret',
			secretType: 'DATABASE',
			options: [],
			value: '',
			show: false
		} as ISecretProperty,
		operation: {
			name: 'Operación',
			type: 'options',
			options: [
				{
					label: 'Enqueue (Producir mensaje)',
					value: 'enqueue'
				},
				{
					label: 'Dequeue (Consumir mensaje)',
					value: 'dequeue'
				}
			],
			value: 'enqueue'
		} as IOptionsProperty,
		instantClientPath: {
			name: 'Directorio de instantclient',
			type: 'string',
			value: 'C:/instantclient_19_8',
			description: 'Directorio donde se encuentra instantclient'
		} as IStringProperty,
		queueName: {
			name: 'Nombre de la cola',
			type: 'string',
			value: 'MY_QUEUE',
			description: 'Nombre de la cola AQ'
		} as IStringProperty,
		message: {
			name: 'Mensaje',
			type: 'code',
			lang: 'json',
			value:
				'{\n  "P_TABLE_NAME": "EXAMPLE_TABLE",\n  "P_PROCEDURE_NAME": "EXAMPLE_PROCEDURE",\n  "P_INSTRUCTION": "SELECT * FROM DUAL"\n}',
			description: 'Contenido del mensaje a enviar (solo para enqueue)'
		} as ICodeProperty,
		keepAlive: {
			name: 'Mantener conexión',
			type: 'switch',
			value: true
		} as ISwitchProperty,
		advancedOptions: {
			name: 'Opciones avanzadas',
			type: 'switch',
			value: false
		} as ISwitchProperty,
		deliveryMode: {
			name: 'Modo de entrega',
			type: 'options',
			options: [
				{
					label: 'Persistent (Persistente)',
					value: 'PERSISTENT'
				},
				{
					label: 'Buffered (En buffer)',
					value: 'BUFFERED'
				}
			],
			value: 'PERSISTENT',
			show: false
		} as IOptionsProperty,
		maxMessages: {
			name: 'No. máximo de mensaje',
			type: 'number',
			value: 10,
			show: false
		} as INumberProperty,
		timeout: {
			name: 'Tiempo de espera',
			type: 'number',
			value: 10,
			show: false
		} as INumberProperty
	}

	credentials = {
		config: {
			name: 'Configuración de conexión',
			type: 'code',
			lang: 'json',
			value: `{ 
    "database": "mydb",
    "user": "myuser",
    "password": "mypass",
    "host": "localhost"
}
`
		} as ICodeProperty
	}

	connections: { [key: string]: any } = {}

	async onUpdateProperties({ context }: classOnUpdateInterface): Promise<void> {
		if (this.properties.connection.value === 'secret') {
			this.properties.configSecret.show = true
			this.properties.config.show = false
			// const secrets = await context.getSecrets(String(this.properties.dialect.value))
			// if (secrets) {
			// 	this.properties.configSecret.options = secrets
			// }
		}
		if (this.properties.connection.value === 'manual') {
			this.properties.config.show = true
			this.properties.configSecret.show = false
		}
	}

	async onExecute({ outputData, dependency, credential }: classOnExecuteInterface) {
		const oracledb = await dependency.getRequire('oracledb')
		let connection: any = null
		let queue: any = null

		let config: any = {}

		if (this.properties.connection.value === 'secret') {
			const secretData = await credential.getCredential(String(this.properties.configSecret.value))
			config = JSON.parse(secretData.config)
		} else {
			config = this.properties.config.value as any
		}

		// Crear connectionString
		if (config.host && config.port && config.database) {
			config.connectString = `${config.host}:${config.port}/${config.database}`
		}
		const queueName = this.properties.queueName.value as string
		const configHash = btoa(JSON.stringify(config) + queueName)

		const operation = this.properties.operation.value as string

		try {
			// Obtener configuración de conexión
			// Establecer conexión
			if (this.connections.has(configHash)) {
				connection = this.connections.get(configHash)?.connection
				queue = this.connections.get(configHash)?.queue
			} else {
				// Configurar Oracle DB
				oracledb.initOracleClient({
					libDir: this.properties.instantClientPath.value
					// configDir: walletPath
				})

				// Configurar Oracle DB
				oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT
				const db = await oracledb.createPool(config)
				connection = await db.getConnection()
				queue = await connection.getQueue(queueName, {
					payloadType: 'TEST_OBJ_TYPE'
				})
				this.connections.set(configHash, { connection, queue })
			}

			if (operation === 'enqueue') {
				// Producir mensaje
				let message: { [key: string]: any } = {}
				if (typeof this.properties.message.value === 'string') {
					try {
						message = JSON.parse(this.properties.message.value)
					} catch (error) {}
				}

				// Obtener la clase del objeto Oracle

				queue.enqOptions.visibility = oracledb.AQ_VISIBILITY_IMMEDIATE

				// Crear una instancia del objeto Oracle
				const messageObj = new queue.payloadTypeClass({
					...message
				})

				await queue.enqOne(messageObj)

				outputData('response', {
					success: true,
					operation: 'enqueue',
					queueName: queueName,
					messageId: 'enqueued',
					timestamp: new Date().toISOString()
				})
			} else if (operation === 'dequeue') {
				// Consumir mensaje
				const timeout = this.properties.timeout.value as number
				const maxMessages = this.properties.maxMessages.value as number
				// const condition = this.properties.condition.value as string

				const dequeueOptions: any = {
					wait: timeout,
					visibility: oracledb.AQ_VISIBILITY_IMMEDIATE
				}

				// if (condition) {
				// 	dequeueOptions.condition = condition
				// }

				const messages = []
				for (let i = 0; i < maxMessages; i++) {
					try {
						const message = await queue.deqOne(dequeueOptions)
						if (message) {
							let payload = message.payload
							if (Buffer.isBuffer(payload)) {
								payload = payload.toString('utf8')
							}

							// Intentar parsear como JSON
							try {
								payload = JSON.parse(payload)
							} catch (e) {
								// Mantener como string si no es JSON válido
							}

							messages.push({
								payload: payload,
								correlationId: message.correlation,
								priority: message.priority,
								enqueuedTime: message.enqueuedTime,
								attempts: message.attempts,
								messageId: message.msgId
							})
						} else {
							break // No hay más mensajes
						}
					} catch (err: any) {
						if (err?.message?.includes('ORA-25228')) {
							// Timeout - no hay mensajes disponibles
							break
						}
						throw err
					}
				}

				await connection.commit()

				outputData('response', {
					success: true,
					operation: 'dequeue',
					queueName: queueName,
					messagesCount: messages.length,
					messages: messages,
					timestamp: new Date().toISOString()
				})
			}
		} catch (error: any) {
			if (connection) {
				try {
					await connection.rollback()
				} catch (rollbackError) {
					// Ignorar errores de rollback
				}
			}
			outputData('error', {
				success: false,
				error: error.message,
				code: error.errorNum || 'UNKNOWN',
				operation: this.properties.operation.value,
				queueName: this.properties.queueName.value,
				timestamp: new Date().toISOString()
			})
		} finally {
			if (connection && !this.properties.keepAlive.value) {
				try {
					this.connections.delete(configHash)
					await queue.close()
					await connection.close()
				} catch (closeError) {
					// Ignorar errores de cierre
				}
			}
		}
	}

	// async onCredential() {
	// 	const { database, config } = this.credentials
	// 	// Las credenciales se definen directamente en la configuración del nodo de credenciales.
	// 	// Este método podría usarse para validaciones adicionales si fuera necesario.
	// 	return {
	// 		database: database.value,
	// 		config: config.value
	// 	}
	// }
}
