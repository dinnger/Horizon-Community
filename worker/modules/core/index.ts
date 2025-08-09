import type { Worker } from '../../worker.js'
import type { IWorkflowExecutionInterface } from '../workflow/index.js'
import type { IClassNode } from '@shared/interfaces/class.interface.js'
import type { INodeWorker } from '@shared/interfaces/standardized.js'
import { getMemoryUsage, getTime } from '../../shared/functions/utils.js'
import { initProperties } from '../../worker_properties.js'
import { CoreStats } from './stats.module.js'
import { v4 as uid } from 'uuid'
import { CoreDebug } from './debug.module.js'
import { CoreGlobalStore } from './store.module.js'
import { convertJson } from '../../../shared/utils/utilities.js'
import { envs } from '@worker/config/envs.js'
import { CoreLogger } from './logger.module.js'

// -----------------------------------------------------------------------------
// Base
// -----------------------------------------------------------------------------

export const info = {}
export class CoreModule {
	el: Worker
	debug: CoreDebug
	coreLogger: CoreLogger
	stats: CoreStats = new CoreStats()
	globalStore: CoreGlobalStore = new CoreGlobalStore()

	constructor(el: Worker) {
		this.el = el
		this.debug = new CoreDebug({ el })
		this.coreLogger = new CoreLogger(el)
	}

	/**
	 * Initializes the console to intercept and log all calls to `console.log`.
	 * This method overrides the default `console.log` function to first log a warning
	 * with the provided arguments and then call the original `console.log` function.
	 *
	 * @example
	 * ```typescript
	 * initConsole();
	 * console.log('Hello, World!'); // Logs: console.log ['Hello, World!'] and then logs: Hello, World!
	 * ```
	 */

	/**
	 * Executes the given node with the provided execution data.
	 *
	 * @param {Object} params - The parameters for execution.
	 * @param {Interface_Node} params.node - The node to be executed.
	 * @param {Object.<string, {data: object, meta?: object}>} params.executeData - The execution data for the nodes.
	 *
	 * @returns {IWorkflowExecutionInterface} The execution interface containing methods and properties for execution.
	 */
	execute = ({ node, executeData }: { node: INodeWorker; executeData: Map<string, { data: object; meta?: object; time: number }> }) => {
		const data: IWorkflowExecutionInterface = {
			isTest: false,
			getNodeById: (id: string) => {
				return this.el.nodeModule.nodes[id]
			},
			getNodeByType: (type: string) => {
				const typeNodes = this.el.nodeModule.nodesType.get(type)
				if (!typeNodes) return null
				let lastExecuteData = null
				let lastTime = 0
				for (const node of typeNodes) {
					const executeDataNode = executeData.get(node)
					if (executeDataNode && (lastTime === 0 || executeDataNode.time > lastTime)) {
						lastTime = executeDataNode.time
						lastExecuteData = {
							node: this.el.nodeModule.nodes[node],
							meta: executeDataNode.meta,
							data: executeDataNode.data
						}
					}
				}
				return lastExecuteData
			},
			// Devuelve los nodos que se conectan a un nodo
			getNodesInputs: (idNode: string) => {
				return this.el.nodeModule.connectionsInputs[idNode]
			},
			// Devuelve los nodos que se conectan a un nodo
			getNodesOutputs: (idNode: string) => {
				return this.el.nodeModule.connectionsOutputs[idNode]
			},
			getExecuteData: () => {
				return executeData
			},
			setExecuteData: (data) => {
				executeData = data
			},
			setGlobalData: ({ type, key, value }) => {
				this.globalStore.set(`${type}_${key}`, value)
			},
			getGlobalData: ({ type, key }) => {
				return this.globalStore.get(`${type}_${key}`)
			},
			deleteGlobalData: ({ type, key }) => {
				this.globalStore.delete(`${type}_${key}`)
			},
			ifExecute: (): boolean => {
				return !!executeData.has(node.id)
			},
			stop: (): void => {
				console.log('stop')
			}
		}
		return data
	}

	/**
	 * Executes a console log for a given node execution with detailed timing and memory usage information.
	 *
	 * @param params - The parameters for the console execution.
	 * @param params.uuid - The unique identifier for the execution.
	 * @param params.node - The node being executed.
	 * @param params.destiny - The list of destination nodes.
	 * @param params.executeTime - The time taken for the execution.
	 * @param params.executeMeta - Metadata about the execution.
	 * @param params.executeMeta.accumulativeTime - The accumulative time of the execution.
	 * @param params.startTime - The start time of the execution.
	 * @param params.data - Additional data related to the execution.
	 */
	consoleExecute({
		uuid,
		node,
		connectorName,
		destiny,
		executeTime,
		executeMeta,
		data
	}: {
		uuid: string
		node: INodeWorker
		connectorName: string
		destiny: string[]
		executeTime: number
		executeMeta: { accumulativeTime: number }
		startTime: number

		data: any
	}) {
		// Consola
		if (this.el.isDev || envs.TRACKING_EXECUTE) {
			const memory = getMemoryUsage()
			const executeTimeString = executeTime
			if (envs.TRACKING_EXECUTE) {
				const timeString = `[Duration: ${`${executeTimeString}ms`.toString().padEnd(10, ' ')} Accumulative: ${`${executeMeta.accumulativeTime}ms`.padEnd(10, ' ')} Memory: ${memory}mb]`
				for (const o of destiny) {
					if (!o) continue
					console.debug(
						`\x1b[42m Execute \x1b[0m ${node.info.name.padEnd(13, ' ')} --> ${connectorName ? `${connectorName.padEnd(13, ' ')} --> ` : ''} ${o.padEnd(13, ' ')} \x1b[34m ${timeString.padEnd(40, ' ')} \x1b[0m`
					)
				}
			}
			// Enviar mensaje de debug
			this.debug.send({
				uid,
				node,
				destiny,
				executeTimeString,
				executeMeta,
				data,
				memory
			})
		}

		// Registrar animación para envío al cliente
		if (this.el.nodeModule.connections[node.id] && this.el.nodeModule.connections[node.id][connectorName]) {
			const destinationNodeIds = this.el.nodeModule.connections[node.id][connectorName].map((o: any) => o.idNodeDestiny)
		}
	}

	/**
	 * Starts the execution of a node.
	 *
	 * @param {Object} params - The parameters for execution.
	 * @param {string} [params.uuid] - The unique identifier for the execution.
	 * @param {Interface_Node} [params.node] - The node to be executed.
	 * @param {Object} params.inputData - The input data for the node.
	 * @param {Object} params.inputData.data - The actual input data.
	 * @param {Object} [params.meta] - Additional metadata.
	 * @param {Object} params.executeData - Data required for execution.
	 * @param {Object} params.executeMeta - Metadata for execution.
	 * @param {number} params.executeMeta.accumulativeTime - The accumulative time for execution.
	 */
	async startExecution({
		uuid = '',
		node,
		inputData,
		executeMeta,
		executeData = new Map(),
		executeClass = new Map(),
		meta
	}: {
		uuid?: string
		node?: INodeWorker
		inputData: { idNode: string; inputName: string; data: object }
		executeData: Map<string, { data: object; meta?: object; time: number }>
		executeMeta: { accumulativeTime: number }
		executeClass?: Map<string, IClassNode>
		meta?: object
	}) {
		node = node || this.el.nodeModule.nodesInit || undefined
		if (!node) return
		uuid = uuid || uid()

		// Class
		// if (isNewExecution) executeClass.clear()
		let classExecute: IClassNode | undefined = undefined
		if (!executeClass.has(node.id)) {
			const defineClass = node.class
			classExecute = new (defineClass as any)()
			if (classExecute?.info?.isSingleton) executeClass.set(node.id, classExecute)
		} else {
			classExecute = executeClass.get(node.id)
		}
		if (!classExecute) {
			throw new Error(`Class for node id ${node.id} not found`)
		}

		// Observer
		if (this.el.isDev) {
			this.stats.animations({ nodeId: node.id, connectName: inputData.inputName, executeTime: 0 })
		}

		// remplazando propiedades que se hayan definido en el nodo
		const fnProperties = new initProperties({
			el: this.el,
			node,
			input: inputData,
			executeData
		})
		for (const key in classExecute.properties) {
			if (node.properties?.[key]) {
				classExecute.properties[key].value = node.properties[key].value
			}

			// Analizar propiedades si es necesario hacer un replace
			const matchReg = JSON.stringify(classExecute.properties[key]).match(/\{\{((?:(?!\{\{|\}\}).)+)\}\}/g)
			if (matchReg) {
				classExecute.properties[key] = await fnProperties.analizarProperties(node.name, classExecute.properties[key])
			} else {
				if (typeof classExecute.properties[key] === 'string') {
					classExecute.properties[key] = convertJson(classExecute.properties[key])
				}
			}
		}

		// metada
		classExecute.meta = node.meta

		// Verificar si es trigger
		const isTrigger = this.el.nodeModule.nodesClass[node.type].info.isTrigger

		// Iniciador de tiempo
		const startTime = isTrigger ? null : getTime()

		// Iniciar logs
		const logStart:
			| {
					type: 'none' | 'info' | 'warn' | 'error' | 'debug'
					value: string
			  }
			| undefined = node?.meta?.logs?.start
		const logExec:
			| {
					type: 'none' | 'info' | 'warn' | 'error' | 'debug'
					value: string
			  }
			| undefined = node?.meta?.logs?.exec

		if (logStart && logStart.type !== 'none') {
			this.coreLogger.logger[logStart.type](await fnProperties.analizarString(node.name, logStart.value), {
				node: node.name
			})
		}

		// Nodo actual
		const currentNode = {
			id: node.id,
			name: node.name,
			type: node.type,
			meta: node.meta
		}

		const execute = this.execute({ node: node, executeData })

		// Ejecución del nodo
		classExecute.onExecute({
			app: this.el.app,
			execute,
			environment: this.el.environment,
			context: {
				...this.el.context,
				currentNode
			},
			logger: this.coreLogger.logger,
			dependency: this.el.dependencies,
			credential: this.el.credential,
			inputData,
			outputData: async (connectorName, data, meta) => {
				// Si es trigger, generar uuid
				if (isTrigger) uuid = uid()

				// Registrando tiempo
				const executeTime: number = startTime ? Number.parseFloat((getTime() - startTime).toFixed(3)) : 0

				// Observer
				if (this.el.isDev) this.stats.animations({ nodeId: node.id, connectName: connectorName, executeTime })

				// Registrando logs
				if (logExec && logExec.type !== 'none') {
					const value = await fnProperties.setInput(data).analizarString(node.name, logExec.value)
					this.coreLogger.logger[logExec.type](value, {
						node: node.name
					})
				}

				const executeDateNode = execute.getExecuteData()
				executeDateNode.set(node.id, { data, meta, time: getTime() })
				executeMeta.accumulativeTime = Number.parseFloat((executeMeta.accumulativeTime + executeTime).toFixed(3))
				if (this.el.nodeModule.connections[node.id] && this.el.nodeModule.connections[node.id][connectorName]) {
					// Console
					this.consoleExecute({
						uuid,
						node,
						connectorName,
						destiny: this.el.nodeModule.connections[node.id][connectorName].map(
							(o: any) => this.el.nodeModule.nodes[o.idNodeDestiny].info.name
						),
						executeTime,
						executeMeta,
						startTime: startTime || 0,
						data
					})

					// const newExecuteClass = isTrigger ? new Map() : executeClass
					const outputs = this.el.nodeModule.connections[node.id][connectorName]

					for (const output of outputs) {
						const newExecuteData = new Map(executeDateNode)
						const newExecuteMeta = { ...executeMeta }
						this.startExecution({
							uuid,
							node: this.el.nodeModule.nodes[output.idNodeDestiny],
							inputData: {
								idNode: node.id,
								inputName: output.connectorDestinyName,
								data
							},
							meta,
							// executeData: { ...executeData },
							// Se cambia para que solo los trigger inicien los datos
							executeData: newExecuteData,
							executeMeta: newExecuteMeta,
							executeClass
						})
					}
				} else {
					//  Si no existen outputs
					// executeClass.clear()
					executeData.clear()
					executeDateNode.clear()
					this.consoleExecute({
						uuid,
						node,
						connectorName,
						destiny: ['Finished'],
						executeTime,
						executeMeta,
						startTime: startTime || 0,
						data
					})
				}
			}
		})
	}

	/**
	 * Destructor - limpia recursos cuando el worker se destruye
	 */
	destroy() {
		// this.animation.destroy()
	}
}
