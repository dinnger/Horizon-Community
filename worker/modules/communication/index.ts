// import type { MessagePort } from 'node:worker_threads'
import type { Worker } from '../../worker.js'
// import { getMemoryUsage } from '../../shared/functions/utils.js'
// import { MessageChannel } from 'node:worker_threads'
// import winston from 'winston'
// import Transport from 'winston-transport'
// import { parentPort, sendData, tempParentPort } from './parentPort.js'
// import type { SubscriberType } from '../../../shared/interfaces/class.interface.js'
import { ServerCommunication } from './serverCommunication.js'
import { SharedCommunication } from './sharedCommunication.js'

export class CommunicationModule {
	el: Worker
	server: ServerCommunication
	shared: SharedCommunication
	// logger: winston.Logger

	constructor(el: Worker) {
		this.el = el
		this.server = new ServerCommunication(el)
		this.shared = new SharedCommunication(el)
		if (this.el.isDev) {
			this.intiClientInfo()
		}
		// this.logger = this.initLogger()
		// if (this.el.isDev) {
		// 	this.initSubscribeToServerMessages({ flow: this.el?.flow })
		// 	this.initDebug()
		// 	this.initMemory()
		// 	this.initTrace()
		// 	this.initInfo()
		// }
	}

	/**
	 * Inicia la comunicación con el cliente
	 */
	intiClientInfo() {
		setInterval(() => {
			// Enviar las animaciones como un lote
			const animations = this.el.coreModule.trace.get()
			if (animations) this.el.communicationModule.server.requestFromServer('worker:animations', { animations })
		}, 2000)
	}

	getEnvironment(uidFlow: string) {
		if (this.el.isDev) {
			return this.server.getEnvironmentFromServer(uidFlow)
		}
		return null
	}

	// /**
	//  * Sends data from a worker to the main thread server via a MessageChannel.
	//  *
	//  * Creates a MessageChannel for communication and returns a promise that resolves
	//  * with the response from the server. The response data is parsed as JSON if possible.
	//  *
	//  * @param type - The type of message to send to the server
	//  * @param data - Optional data to send with the message
	//  * @returns A Promise that resolves with the response from the server
	//  *
	//  * @example
	//  * // Send a message to the server
	//  * const response = await sendDataToServer('fetchData', { id: 123 });
	//  */
	// async sendDataToServer(type: string, data?: any): Promise<any> {
	// 	return await sendData(type, data)
	// }

	// /**
	//  * Initializes a periodic memory usage reporting mechanism.
	//  *
	//  * This method sets up an interval that runs every 3 seconds.
	//  * On each interval, it sends a message containing the current memory usage
	//  * to the target 'memory'.
	//  *
	//  * @private
	//  */
	// initMemory() {
	// 	// memory
	// 	setInterval(() => {
	// 		this.postMessage({
	// 			data: getMemoryUsage(),
	// 			target: 'memory'
	// 		})
	// 	}, 1000 * 3)
	// }

	// /**
	//  * Initializes a trace interval that sends trace data to the 'tools_trace' target every second.
	//  * The trace data is obtained from `this.el.coreModule.trace`.
	//  *
	//  * @remarks
	//  * This method uses `setInterval` to repeatedly execute the function every 1000 milliseconds (1 second).
	//  *
	//  * @example
	//  * ```typescript
	//  * this.initTrace();
	//  * ```
	//  */
	// initTrace() {
	// 	this.subscriberMessage('dataNode', ({ data }: any) => {
	// 		const id = data?.node?.id
	// 		this.el.coreModule.trace.dataNode.clear()
	// 		if (!id) return Promise.resolve()
	// 		this.el.coreModule.trace.dataNode.set(id, null)
	// 		return Promise.resolve()
	// 	})

	// 	this.subscriberMessage('statsNode', ({ data }: any) => {
	// 		const id = data?.node?.id
	// 		this.el.coreModule.trace.statsNode.clear()
	// 		if (!id) return Promise.resolve()
	// 		this.el.coreModule.trace.statsNode.set(id, null)
	// 		return Promise.resolve()
	// 	})

	// 	setInterval(() => {
	// 		// Trace
	// 		const data = this.el.coreModule.trace.get()
	// 		if (data) {
	// 			this.postMessage({
	// 				target: 'trace',
	// 				data
	// 			})
	// 		}

	// 		// DataNode
	// 		for (const id of this.el.coreModule.trace.dataNode.keys()) {
	// 			const data = this.el.coreModule.trace.dataNode.get(id)
	// 			if (data) {
	// 				this.postMessage({
	// 					target: 'dataNode',
	// 					data
	// 				})
	// 			}
	// 			this.el.coreModule.trace.dataNode.set(id, null)
	// 		}

	// 		// StatsNode
	// 		for (const id of this.el.coreModule.trace.statsNode.keys()) {
	// 			const data = this.el.coreModule.trace.statsNode.get(id)
	// 			if (data) {
	// 				this.postMessage({
	// 					target: 'statsNode',
	// 					data
	// 				})
	// 			}
	// 		}
	// 	}, 500)
	// }

	// /**
	//  * Initializes the debug mode for the worker.
	//  *
	//  * This method sets up message subscribers to enable or disable debug mode
	//  * based on the environment. When in development mode, it listens for
	//  * 'debug_on' and 'debug_off' messages to toggle the debug state.
	//  *
	//  * - When 'debug_on' is received, `isDebug` is set to `true`.
	//  * - When 'debug_off' is received, `isDebug` is set to `false` and `debugData` is cleared.
	//  *
	//  * This method should only be called if the worker is in development mode.
	//  */
	// initDebug() {
	// 	this.subscriberMessage('actionDebug', ({ data }: any) => {
	// 		this.el.coreModule.debug.debugData.clear()
	// 		this.el.coreModule.debug.isDebug = data
	// 		return Promise.resolve()
	// 	})
	// }

	// /**
	//  * Initializes the info message.
	//  *
	//  * This method subscribes to the 'infoWorkflow' message and returns the flow information.
	//  *
	//  * @param {Object} node - The node object containing the properties.
	//  * @param {string} key - The key of the property that has changed.
	//  * @param {any} value - The new value of the property.
	//  */
	// initInfo() {
	// 	this.subscriberMessage('infoWorkflow', ({ data }: any): Promise<any> => {
	// 		if (data?.node) {
	// 			const node = this.el.nodeModule.nodes[data.node]
	// 			if (!node) return Promise.resolve(null)
	// 			return Promise.resolve({
	// 				data: {
	// 					node: JSON.parse(JSON.stringify(node))
	// 					// data: this.el.coreModule.getNodeData(node.id)
	// 				}
	// 			})
	// 		}
	// 		return Promise.resolve({
	// 			data: {
	// 				info: this.el.flow,
	// 				properties: this.el.context.properties,
	// 				variables: this.el.context.variables,
	// 				nodes: JSON.parse(JSON.stringify(this.el.nodeModule.nodes))
	// 			}
	// 		})
	// 	})
	// }

	// /**
	//  * Initializes the logger for the application using Winston.
	//  *
	//  * - Creates a logger instance with two file transports:
	//  *   - `error.log` for error level logs.
	//  *   - `info.log` for info level logs.
	//  *
	//  * - If the application is in development mode (`isDev` is true):
	//  *   - Periodically sends the logged messages to a target via `postMessage`.
	//  *
	//  * @remarks
	//  * Every 500 milliseconds, the accumulated log messages are sent to the `tools_log` target and the array is cleared.
	//  */
	// initLogger() {
	// 	const logger = winston.createLogger({
	// 		level: 'info',
	// 		format: winston.format.json(),
	// 		transports: [
	// 			new winston.transports.File({
	// 				filename: `logs/${this.el.flow}/error.log`,
	// 				level: 'error'
	// 			}),
	// 			new winston.transports.File({
	// 				filename: `logs/${this.el.flow}/info.log`,
	// 				level: 'info'
	// 			}),
	// 			new winston.transports.Console({
	// 				format: winston.format.combine(
	// 					winston.format.colorize(), // Colorea el texto en la consola
	// 					winston.format.simple() // Formato simple (sin detalles adicionales)
	// 				)
	// 			})
	// 		]
	// 	})

	// 	if (this.el.isDev) {
	// 		let logMessages: { date: string; level: string; message: string }[] = []
	// 		class CustomTransport extends Transport {
	// 			log(info: any, callback: () => void) {
	// 				const d = new Date()
	// 				const pad = (n: number) => String(n).padStart(2, '0')
	// 				const date = `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
	// 				logMessages.push({ ...structuredClone(info), date })
	// 				callback()
	// 			}
	// 		}
	// 		logger.add(new CustomTransport())
	// 		setInterval(() => {
	// 			if (logMessages.length > 0) {
	// 				this.sendLogs(logMessages)
	// 			}
	// 			logMessages = []
	// 		}, 500)
	// 	}
	// 	return logger
	// }

	// sendLogs(logMessages: { date: string; level: string; message: string }[]) {
	// 	this.postMessage({
	// 		data: logMessages,
	// 		target: 'getLogs'
	// 	})
	// }

	// /**
	//  * Initializes the message handling for the worker.
	//  *
	//  * This function sends an initial message to the parent port indicating that the worker has been initialized.
	//  * It also sets up a listener for incoming messages from the parent port. When a message is received, it checks
	//  * if the message is an object and has a type property. If so, it retrieves the list of subscribers for that message type
	//  * and invokes each subscriber with the message data.
	//  *
	//  * @param data - An object containing the flow information.
	//  * @param data.flow - A string representing the flow information.
	//  */
	// initSubscribeToServerMessages(data: { flow: string }) {
	// 	// const parent = parentPort || tempParentPort
	// 	parentPort?.on(
	// 		'message',
	// 		async (message: {
	// 			type: string
	// 			data: object
	// 			ports?: MessagePort[]
	// 		}) => {
	// 			const subscriberList = subscribers.get(message.type)
	// 			// Si es un mensaje solicitado desde el server
	// 			if (message.ports) {
	// 				if (!subscriberList || subscriberList?.length === 0) {
	// 					console.log('No se encontró el suscriptor para el mensaje', message)
	// 					return message.ports[0].postMessage({ data: null, ports: [] })
	// 				}
	// 				try {
	// 					const listPromises: Promise<any>[] = []
	// 					for (const subscriber of subscriberList) {
	// 						listPromises.push(subscriber(message.data))
	// 					}
	// 					const result = await Promise.all(listPromises)
	// 					message.ports[0].postMessage({ data: result.flat(), ports: [] })
	// 				} catch (error) {
	// 					message.ports[0].postMessage({ data: null, ports: [] })
	// 				}
	// 			} else if (typeof message === 'object' && message.type) {
	// 				if (subscriberList) {
	// 					for (const subscriber of subscriberList) {
	// 						subscriber(message.data)
	// 					}
	// 				}
	// 			}
	// 		}
	// 	)
	// 	flow = data.flow
	// }

	// /**
	//  * Registers a callback function to be invoked when a message of type 'command' is received.
	//  *
	//  * @param callback - A function to be called with the message data when a 'command' message is received.
	//  */

	// subscriberMessage(
	// 	type: SubscriberType,
	// 	// biome-ignore lint/suspicious/noConfusingVoidType: <explanation>
	// 	callback: (value: object) => Promise<{ data: any } | null | void>
	// ) {
	// 	if (!subscribers.has(type)) subscribers.set(type, [])
	// 	const subscriberList = subscribers.get(type)
	// 	if (subscriberList) {
	// 		subscriberList.push(callback)
	// 	}
	// }

	// postMessage({ data, target }: { data: any; target: SubscriberType }) {
	// 	const parent = parentPort || tempParentPort
	// 	parent?.postMessage({
	// 		type: 'emit',
	// 		room: flow,
	// 		value: data,
	// 		target: target
	// 	})
	// }
}
