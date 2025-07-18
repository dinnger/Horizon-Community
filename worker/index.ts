import { type MessagePort, workerData, parentPort } from 'node:worker_threads'
import type { IWorkflowExecutionContextInterface } from '@shared/interfaces/workflow.execute.interface.js'
import type { IWorkflowFull } from '@shared/interfaces/standardized.js'
import { v4 as uuidv4 } from 'uuid'
import { Worker } from './worker.js'
import { getArgs } from './shared/functions/utils.js'
import { sendData, setParentPort } from './modules/communication/parentPort.js'
import { envs } from './config/envs.js'
import express, { type Express } from 'express'
import cors from 'cors'
import os from 'node:os'
import fs from 'node:fs'
import helmet from 'helmet'
import http from 'node:http'
import cluster from 'node:cluster'
import bodyParser from 'body-parser'
import fileUpload from 'express-fileupload'

let PATH_FLOW = './data/workflows/'
let { workflowId, port } = workerData || getArgs()
const WORKER_ID = workerData?.workerId || process.env.WORKER_ID || uuidv4()
const IS_DEV = envs.IS_DEV
const SERVER_CLUSTER = envs.WORKER_CLUSTER

// Set port
if (!port) port = envs.PORT

let numCPUs = SERVER_CLUSTER < os.cpus().length ? SERVER_CLUSTER : os.cpus().length
if (numCPUs < 1) numCPUs = 1

const workerStart = async ({
	primary = true,
	uidFlow = workflowId,
	index = 0
}: {
	primary?: boolean
	uidFlow?: string
	index?: number
} = {}) => {
	// Sanitize flow
	if (uidFlow?.indexOf('/') > -1) {
		PATH_FLOW = ''
	}

	// Load flow
	const data = fs.readFileSync(uidFlow ? `${PATH_FLOW}${uidFlow}/flow.json` : 'flow.json', 'utf8')
	if (!data) {
		return
	}
	const flow: IWorkflowFull = JSON.parse(data)

	// ============================================================================
	// Worker
	// ============================================================================
	async function initWorker({ app }: { app: Express }) {
		try {
			const context: IWorkflowExecutionContextInterface = {
				info: flow.info,
				properties: flow.properties,
				getEnvironment: (name: string) => flow.environment.find((e) => e === name),
				getSecrets: (name: string) => flow.secrets.find((s) => s === name),
				currentNode: null
			}

			const worker = new Worker({
				app,
				context,
				uidFlow,
				isDev: IS_DEV,
				index
			})

			// Extend worker with server communication
			// worker.serverComm = serverComm

			// Nodes
			for (const key of Object.keys(flow.nodes)) {
				const node = flow.nodes[key]
				const newNode = worker.nodeModule.addNode({
					...node,
					id: key
				})
			}
			for (const key of Object.keys(flow.connections)) {
				const connection = flow.connections[key as any]
				worker.nodeModule.addEdge({
					...connection
				})
			}

			// =========================================================================
			// ENVS
			// =========================================================================
			if (IS_DEV) {
				await worker.variableModule.initVariable({ uidFlow })
			}
			await worker.variableModule.checkWorkflowEnvironment({ flow })
			// =========================================================================

			// Send periodic stats to server
			// const statsInterval = setInterval(async () => {
			// 	try {
			// 		const memUsage = process.memoryUsage()
			// 		const cpuUsage = process.cpuUsage()

			// 		await serverComm.sendStats({
			// 			memoryUsage: {
			// 				rss: memUsage.rss,
			// 				heapUsed: memUsage.heapUsed,
			// 				heapTotal: memUsage.heapTotal,
			// 				external: memUsage.external
			// 			},
			// 			cpuUsage: {
			// 				user: cpuUsage.user,
			// 				system: cpuUsage.system
			// 			}
			// 		})
			// 	} catch (error) {
			// 		console.warn('Error enviando estadísticas:', error)
			// 	}
			// }, 10000) // Every 10 seconds

			// Cleanup on process exit

			process.on('SIGTERM', () => {
				console.log(`Worker ${WORKER_ID} recibió SIGTERM, terminando...`)
				process.exit(0)
			})

			process.on('SIGINT', () => {
				console.log(`Worker ${WORKER_ID} recibió SIGINT, terminando...`)
				process.exit(0)
			})

			// Handle shutdown message from parent
			if (parentPort) {
				parentPort.on('message', (message: any) => {
					if (message.type === 'shutdown') {
						console.log(`Worker ${WORKER_ID} recibió mensaje de shutdown, terminando...`)
						process.exit(0)
					}
				})
			}

			worker.coreModule.startExecution({
				inputData: { idNode: '', inputName: '', data: {} },
				executeData: new Map(),
				executeMeta: { accumulativeTime: 0 }
			})
		} catch (error) {
			console.error(`Error inicializando worker ${WORKER_ID}:`, error)
			process.exit(1)
		}
	}
	// ============================================================================

	const app = express()

	app.set('trust proxy', 1) // trust first proxy
	app.use(helmet())
	app.use(cors())
	app.use(bodyParser.urlencoded({ extended: true }))
	app.use(bodyParser.json())
	app.use(
		fileUpload({
			limits: { fileSize: 50 * 1024 * 1024 }
		})
	)

	const server = http.createServer(app)

	server.listen(port, async () => {
		console.log(`[port: ${port}, flow: ${flow.info.uid}, isDev: ${IS_DEV}]`)
		// Indica que el worker se ha iniciado correctamente
		if (IS_DEV) {
			parentPort?.postMessage({ type: 'ready', value: 'worker ready' })
		}

		await initWorker({ app })
	})
}

if (numCPUs === 1) {
	workerStart()
} else {
	if (cluster.isPrimary) {
		console.log({ FLOW: workflowId, PORT: port, CLUSTERS: numCPUs, IS_DEV })

		cluster.setupPrimary({
			serialization: 'advanced'
		})

		process.argv.push(`--FLOW=${workflowId}`)
		process.argv.push(`--PORT=${port}`)

		for (let i = 0; i < numCPUs; i++) {
			const worker = cluster.fork()
			worker.on('message', async (msg) => {
				if (msg && msg.type === 'WORKER_READY') {
					worker.send({
						type: 'WORKER_READY',
						data: { FLOW: workflowId, PORT: port, INDEX: i + 1 }
					})
				} else {
					// Enviando datos al worker
					const resp = await sendData(msg.type, msg.data)
					worker.send({ type: 'RESPONSE', data: resp, uid: msg.uid })
				}
			})
		}

		cluster.on('exit', (worker, code, signal) => {
			console.log(`Worker process ${worker.process.pid} died. Restarting...`)
			cluster.fork()
		})

		if (IS_DEV) {
			parentPort?.postMessage({ type: 'ready', value: 'worker ready' })
		}
	} else {
		if (process.send) {
			process.send({
				type: 'WORKER_READY',
				pid: process.pid
			})
		}

		const listProcess: Map<string, any> = new Map()
		process.on('message', (msg: any) => {
			if (msg && msg.type === 'WORKER_READY') {
				setParentPort({
					postMessage: (data: any, ports?: MessagePort[]) => {
						if (ports && ports.length > 0) {
							const uid = uuidv4()
							if (process.send) {
								listProcess.set(uid, ports[0])
								process.send({
									type: data.type,
									data: data.data,
									uid
								})
							}
						}
					}
				})
				const { FLOW, PORT, INDEX } = msg.data
				workerStart({ uidFlow: FLOW, index: INDEX })
			} else if (msg && msg.type === 'RESPONSE') {
				listProcess.get(msg.uid)?.postMessage(msg.data)
			}
		})
	}
}
