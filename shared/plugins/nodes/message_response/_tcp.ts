import type { classOnExecuteInterface } from '@shared/interfaces/class.interface.js'
import type { IConnectionModule } from '@shared/interfaces/connection.interface.js'
import { convertJson } from '@shared/utils/utilities.js'
import net from 'node:net'

const separator = '|$$|'
export default class implements IConnectionModule {
	flowUid: string
	flowName: string
	port = 0
	host = ''
	attemps = 0
	retries = 0
	client: any
	// timeoutTimer: any
	private execute: classOnExecuteInterface['execute']
	outputData: classOnExecuteInterface['outputData']

	constructor({ context, execute, outputData }: classOnExecuteInterface) {
		this.flowUid = context.info.uid
		this.flowName = context.info.name
		this.client = null
		// this.timeoutTimer = null
		this.execute = execute
		this.outputData = outputData

		if (!context.project) return
		if (context.project.type !== 'tcp') return
		const { port, host, maxRetries } = context.project.transportConfig || {}
		this.port = port
		this.host = host
		this.attemps = 0
		this.retries = Number(maxRetries)
	}

	async connection({ name, schema }: { name: string; schema: string }) {
		// Creamos el cliente
		if (!this.client) {
			console.log('Intentando conectar', this.host, this.port)
			this.client = net.createConnection({ host: this.host, port: this.port }, () => {
				console.log('[TCP Client]', `Conectado al servidor ${this.host}:${this.port}`)
			})

			// Configuramos encoding
			this.client.setEncoding('utf8')

			// Manejamos eventos
			this.client.on('data', (data: Buffer) => {
				try {
					for (const msg of data.toString().split(separator)) {
						if (msg.trim() === '' || !msg) continue
						const { uid, name, timeout, message } = convertJson(msg)
						this.outputData('message', message, {
							uid,
							name,
							socket: {
								response: (data: any) => {
									this.client.write(`${separator}${data}`, 'utf8', () => {})
								}
							}
						})
					}
				} catch (error) {
					console.log('Error en la conexión TCP', error)
				}
			})

			this.client.on('error', (err: Error) => {
				this.client.end()
				this.retry({
					fn: this.connection,
					args: { name, schema },
					error: `TCP Error: ${err.toString()}`
				})
			})

			this.client.on('end', () => {
				this.retry({
					fn: this.connection,
					error: 'Conexión cerrada',
					args: { name, schema }
				})
			})

			// ======================================================================
			// CONNECT
			// ======================================================================
			this.client.on('connect', () => {
				// Enviamos el mensaje
				const message = JSON.stringify({
					type: 'subscribe',
					name,
					flow: {
						name: this.flowName,
						uid: this.flowUid
					},
					schema
				})
				this.client.write(message, 'utf8', () => {})
			})
		}
	}

	// ======================================================================
	// RETRY
	// ======================================================================
	async retry({
		fn,
		error,
		args
	}: {
		fn: (args: any) => void
		error: any
		args: any
	}) {
		this.attemps++
		if (this.client) this.client.end()
		this.client = null
		if (this.retries !== 0 && this.attemps >= this.retries) {
			// if (this.timeoutTimer) {
			// 	clearTimeout(this.timeoutTimer)
			// 	this.timeoutTimer = null
			// }
			this.outputData('error', { error })
		} else {
			await new Promise((resolve) => setTimeout(resolve, 10000))
			console.log('Retrying...', error.toString())

			fn.call(this, args) // Llama a la función con el contexto correcto y los argumentos como un solo objeto
		}
	}

	// ======================================================================
	// REQUEST
	// ======================================================================
	async request({
		uid,
		name,
		timeout,
		message,
		client
	}: {
		uid: string
		name: string
		timeout: number
		message: { [key: string]: any }
		client?: any
	}) {
		// Initialize the client
		this.client = client || this.execute.getGlobalData({ type: 'tcp', key: 'request' })
		const globalPendings = this.execute.getGlobalData({
			type: 'tcp',
			key: 'request_pending'
		})
		const pendingRequests = globalPendings
			? globalPendings
			: new Map<
					string,
					{
						outputDataCallback: classOnExecuteInterface['outputData']
						timeoutId: NodeJS.Timeout
					}
				>()
		if (!globalPendings) {
			this.execute.setGlobalData({
				type: 'tcp',
				key: 'request_pending',
				value: pendingRequests
			})
		}

		// Asegurarse de que el cliente esté conectado y sea escribible antes de enviar.
		// Si el cliente se creó en el bloque anterior, el evento 'connect' se disparará
		// y luego este código procederá. Si el cliente ya existía, se usará directamente.

		const sendRequest = () => {
			if (this.client?.writable) {
				const requestTimeoutId = setTimeout(() => {
					const pendingRequest = pendingRequests.get(uid)
					if (pendingRequest) {
						pendingRequest.outputDataCallback('timeout', {
							error: `Timeout de ${timeout}ms para el request ${uid}`
						})
						pendingRequests.delete(uid)
						// No destruir el cliente aquí, ya que puede haber otros requests.
					}
				}, Number(timeout))

				pendingRequests.set(uid, {
					outputDataCallback: this.outputData,
					timeoutId: requestTimeoutId
				})

				this.client.write(
					JSON.stringify({
						type: 'request',
						flow: {
							name: this.flowName,
							uid: this.flowUid
						},
						uid,
						name,
						timeout, // El timeout original se sigue enviando en el mensaje
						message
					}),
					'utf8',
					(err?: Error) => {
						if (err) {
							console.error('Error al escribir en el socket TCP:', err)
							const pendingRequest = pendingRequests.get(uid)
							if (pendingRequest) {
								clearTimeout(pendingRequest.timeoutId)
								pendingRequest.outputDataCallback('error', {
									error: `Error al enviar request ${uid}: ${err.message}`
								})
								pendingRequests.delete(uid)
							}
						}
					}
				)
			} else {
				this.outputData('error', {
					error: 'No se puede escribir en el cliente TCP o el cliente no está conectado.'
				})
			}
		}

		// Creamos el cliente
		if (!this.client) {
			this.client = net.createConnection({ host: this.host, port: this.port }, () => {})

			// Guardamos el cliente
			this.execute.setGlobalData({
				type: 'tcp',
				key: 'request',
				value: this.client
			})

			// Configuramos encoding
			this.client.setEncoding('utf8')

			// Manejamos eventos
			this.client.on('data', (data: Buffer) => {
				for (const msg of data.toString().split(separator)) {
					try {
						if (msg.trim() === '' || !msg) continue
						const { uid: requestUid, response } = convertJson(msg) // Asumimos que 'name' no es necesario aquí para la respuesta
						const pendingRequest = pendingRequests.get(requestUid)
						if (pendingRequest) {
							clearTimeout(pendingRequest.timeoutId)
							pendingRequest.outputDataCallback('response', response)
							pendingRequests.delete(requestUid)
						}
					} catch (err) {
						console.log('Error processing incoming data for request:', err)
					}
				}
			})

			this.client.on('error', (err: Error) => {
				console.log('TCP client error during request:', err.message)
				for (const [requestUid, pendingRequest] of pendingRequests.entries()) {
					clearTimeout(pendingRequest.timeoutId)
					pendingRequest.outputDataCallback('error', {
						error: `Error en la conexión TCP durante el request ${requestUid}: ${err.message}`
					})
				}
				pendingRequests.clear()
				if (this.client) {
					this.client.destroy() // Usar destroy para asegurar que se cierra
					this.client = null
					this.execute.deleteGlobalData({ type: 'tcp', key: 'request' })
				}
				// No se reintenta la conexión aquí, se asume que la lógica de conexión principal lo maneja o la solicitud falla.
			})

			this.client.on('end', () => {
				console.log('TCP client connection ended during request.')
				for (const [requestUid, pendingRequest] of pendingRequests.entries()) {
					clearTimeout(pendingRequest.timeoutId)
					pendingRequest.outputDataCallback('error', {
						error: `Conexión cerrada durante el request ${requestUid}`
					})
				}
				pendingRequests.clear()
				if (this.client) {
					this.client.destroy() // Usar destroy
					this.client = null
					this.execute.deleteGlobalData({ type: 'tcp', key: 'request' })
				}
			})

			this.client.on('connect', () => {
				sendRequest()
			})
			return
		}
		if (this.client?.connecting) {
			this.client.once('connect', sendRequest)
		} else {
			sendRequest()
		}
	}
}
