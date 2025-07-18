import type { IClassNode, classOnExecuteInterface, infoInterface } from '@shared/interfaces/class.interface'
import type { IPropertiesType } from '@shared/interfaces/workflow.properties.interface'
import { convertJson } from '@shared/utils/utilities.js'
import type { Socket } from 'node:net'

const separator = '|$$|'
export default class implements IClassNode {
	protected server: any

	constructor(
		public info: infoInterface,
		public properties: IPropertiesType,
		public meta: { [key: string]: any } = {},
		public subscriber: {
			[key: string]: {
				index: 0
				data: {
					flow: string
					name: string
					schema: { [key: string]: any }
					socket: any
				}[]
			}
		} = {},
		public subscriberRequest = new Map<string, Socket>()
	) {
		this.info = {
			name: 'TCP Server',
			desc: 'Recibe datos a través de una conexión TCP',
			icon: '󰥿',
			group: 'TCP',
			color: '#27AE60',
			isSingleton: true,
			connectors: {
				inputs: ['init', 'stop'],
				outputs: ['connection', 'data', 'closed', 'error']
			}
		}

		this.properties = {}
	}

	async onExecute({ inputData, outputData, dependency, context }: classOnExecuteInterface): Promise<void> {
		try {
			if (!context.project) return

			const net = await import('node:net')
			if (context.project.type !== 'tcp') return
			const { host, port } = context.project.transportConfig || {}

			// Detener servidor si se recibe la señal de stop
			if (inputData.inputName === 'stop') {
				this.onDestroy()
				outputData('closed', { message: 'Servidor TCP detenido' })
				return
			}

			// Crear servidor TCP
			this.server = net.createServer()

			// Manejar conexiones entrantes
			this.server.on('connection', (socket: any) => {
				// Configurar encoding
				socket.setEncoding('utf8')

				// Emitir evento de nueva conexión
				outputData('connection', {
					client: `${socket.remoteAddress}:${socket.remotePort}`,
					timestamp: new Date().toISOString()
				})

				// Manejar recepción de datos
				socket.on('data', (data: Buffer) => {
					for (const msg of data.toString().split(separator)) {
						if (msg.trim() === '' || !msg) continue
						try {
							const parsedData = convertJson(msg)
							if (!parsedData || !parsedData.type) {
								return outputData('error', {
									error: 'No se encontró el mensaje'
								})
							}
							if (parsedData.type === 'subscribe') {
								this.actionSubscriber(parsedData, socket)
							} else if (parsedData.type === 'request') {
								this.actionRequest(parsedData, socket, outputData)
							} else if (parsedData.type === 'response') {
								this.actionResponse(parsedData, socket, outputData)
							} else {
								console.log(`Datos recibidos: ${data.toString()}`)
								outputData('data', {
									client: `${socket.remoteAddress}:${socket.remotePort}`,
									data: parsedData,
									timestamp: new Date().toISOString()
								})
							}
						} catch (error) {
							console.log('Error en la conexión TCP SERVER', error)
						}
					}
				})

				// Manejar cierre de conexión
				socket.on('end', () => {
					if (socket.name) {
						console.log('[TCP Server] Closed', socket.name)
						delete this.subscriber[socket.name]
					}
					outputData('closed', {
						client: `${socket.remoteAddress}:${socket.remotePort}`,
						timestamp: new Date().toISOString()
					})
				})

				// Manejar errores
				socket.on('error', (err: Error) => {
					outputData('error', {
						client: `${socket.remoteAddress}:${socket.remotePort}`,
						error: err.message
					})
				})
			})

			// Manejar errores del servidor
			this.server.on('error', (err: Error) => {
				outputData('error', { error: err.message })
			})

			// Iniciar el servidor
			this.server.listen(port, host, () => {
				outputData('connection', {
					message: `Servidor TCP iniciado en ${host}:${port}`,
					timestamp: new Date().toISOString()
				})
			})
		} catch (error) {
			let message = 'Error'
			if (error instanceof Error) message = error.toString()
			outputData('error', { error: message })
		}
	}

	// Método para detener el servidor y cerrar todas las conexiones
	actionSubscriber(data: any, socket: any): void {
		const { flow, name, schema } = data
		console.log('[TCP Server] Subscriber', `${data.flow.name}.${data.name}`)
		socket.name = `${data.flow.name}.${data.name}`
		if (!this.subscriber[socket.name]) this.subscriber[socket.name] = { index: 0, data: [] }
		this.subscriber[socket.name].data.push({
			flow,
			name,
			socket,
			schema: convertJson(schema)
		})
	}

	actionRequest(data: any, socket: any, outputData: any) {
		const { uid, name, timeout, message } = data
		const wf = this.subscriber[name]
		if (!wf) {
			// responder
			socket.write(
				`${separator}${JSON.stringify({
					type: 'response',
					uid,
					error: 'No se encontró el workflow'
				})}`
			)
			return outputData('error', {
				error: 'No se encontró el workflow',
				name
			})
		}
		this.subscriberRequest.set(uid, socket)
		if (wf.index >= wf.data.length) wf.index = 0
		if (!wf.data[wf.index]) return
		wf.data[wf.index].socket.write(
			`${separator}${JSON.stringify({
				type: 'request',
				uid,
				name,
				timeout,
				message
			})}`
		)
		wf.index++
	}

	actionResponse(data: any, socket: any, outputData: any) {
		const { uid, name, response } = data
		const wf = this.subscriberRequest.get(uid)
		if (!wf) {
			// responder
			socket.write(
				`${separator}${JSON.stringify({
					type: 'response',
					error: 'No se encontró el workflow'
				})}`
			)
			return outputData('error', {
				error: 'No se encontró el workflow',
				name
			})
		}
		wf.write(
			`${separator}${JSON.stringify({
				type: 'response',
				uid,
				name,
				response
			})}
      `
		)
		this.subscriberRequest.delete(uid)
	}

	// Método para detener el servidor y cerrar todas las conexiones
	onDestroy(): void {
		if (this.server) {
			// Cerrar el servidor
			this.server.close()
			this.server = null
		}
	}
}
