// https://node-llama-cpp.withcat.ai/guide/
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'
// import { getLlama, LlamaChatSession, defineChatSessionFunction } from 'node-llama-cpp'

import type { IPropertiesType } from '@shared/interfaces/workflow.properties.interface.js'
import type { IClassNode, classOnExecuteInterface, infoInterface } from '@shared/interfaces/class.interface.js'

export default class implements IClassNode {
	constructor(
		public info: infoInterface,
		public properties: IPropertiesType
	) {
		this.info = {
			name: 'IA',
			desc: 'Processa el flujo con IA',
			icon: '󱫞',
			group: 'Timer',
			color: '#95A5A6',
			connectors: {
				inputs: ['input'],
				outputs: ['response']
			}
		}

		this.properties = {
			delay: {
				name: 'Tiempo de Espera (seg)',
				type: 'number',
				value: 3
			}
		}
	}

	async onExecute({ inputData, outputData }: classOnExecuteInterface) {
		setTimeout(
			() => {
				outputData('response', inputData.data)
			},
			(this.properties.delay.value as number) * 1000
		)
	}
}

async function load() {
	// --- Configuración de rutas
	const __filename = fileURLToPath(import.meta.url)
	const __dirname = path.dirname(__filename)
	const modelDir = path.join(__dirname, 'models')
	const modelFileName = 'hf_mradermacher_gemma-2-abliterated-Ifable-9B.IQ4_XS.gguf' // <–– Cambia por tu modelo
	const modelURL = 'hf:mradermacher/gemma-2-abliterated-Ifable-9B-GGUF' // <–– Cambia por tu modelo

	// const modelFileName =
	// 	'hf_mradermacher_amoral-gemma-3-1b-thinking-i1.Q6_K.gguf' // <–– Cambia por tu modelo
	// const modelURL =
	// 	'hf:mradermacher/MFANN-Llama3.1-Abliterated-SLERP-V4-i1-GGUF:IQ2_S' // <–– Cambia por tu modelo
	const modelPath = path.join(modelDir, modelFileName)

	// --- Asegurar que exista la carpeta de modelos
	if (!fs.existsSync(modelDir)) {
		fs.mkdirSync(modelDir, { recursive: true })
	}

	// --- Verificar y descargar modelo si hace falta
	if (!fs.existsSync(modelPath)) {
		console.log(`🔍 Modelo no encontrado en ${modelPath}. Iniciando descarga...`)
		try {
			execSync(`npx node-llama-cpp pull --dir ${modelDir} ${modelURL}`, {
				stdio: 'inherit'
			})
			console.log('✅ Descarga completada.')
		} catch (err) {
			console.error('❌ Error al descargar el modelo:', err)
			process.exit(1)
		}
	} else {
		console.log('✅ Modelo ya existe. Continuando con la carga...')
	}

	// --- Cargar y usar el modelo
	// try {
	// 	console.log('⚙️ Cargando el modelo...', modelPath)
	// 	const llama = await getLlama()
	// 	const model = await llama.loadModel({ modelPath })
	// 	const context = await model.createContext()
	// 	const session = new LlamaChatSession({
	// 		contextSequence: context.getSequence()
	// 	})

	// 	const categories: {
	// 		nodo: string
	// 		path: string
	// 		path_description: string
	// 	}[] = [
	// 		{
	// 			nodo: 'postgres',
	// 			path: 'database/relational',
	// 			path_description: 'Database / Relational'
	// 		},
	// 		{
	// 			nodo: 'sequelize',
	// 			path: 'database/relational',
	// 			path_description: 'Database / Relational'
	// 		},
	// 		{
	// 			nodo: 'sqllite',
	// 			path: 'database/relational',
	// 			path_description: 'Database / Relational'
	// 		},
	// 		{
	// 			nodo: 'as400/query',
	// 			path: 'database/relational',
	// 			path_description: 'Database / Relational'
	// 		},
	// 		{
	// 			nodo: 'as400/program',
	// 			path: 'database/relational',
	// 			path_description: 'Database / Relational'
	// 		},
	// 		{
	// 			nodo: 'mongo',
	// 			path: 'database/non_relational',
	// 			path_description: 'Database / Non Relational'
	// 		},
	// 		{
	// 			nodo: 'redis',
	// 			path: 'database/non_relational',
	// 			path_description: 'Database / Non Relational'
	// 		},
	// 		{
	// 			nodo: 'cassandra',
	// 			path: 'database/non_relational',
	// 			path_description: 'Database / Non Relational'
	// 		},
	// 		{
	// 			nodo: 'rabbit',
	// 			path: 'messaging/queueing',
	// 			path_description: 'Messaging / Queueing'
	// 		},
	// 		{
	// 			nodo: 'rabbitProducer',
	// 			path: 'messaging/queueing',
	// 			path_description: 'Messaging / Queueing'
	// 		},
	// 		{
	// 			nodo: 'rabbitAck',
	// 			path: 'messaging/queueing',
	// 			path_description: 'Messaging / Queueing'
	// 		},
	// 		{
	// 			nodo: 'oracleAq',
	// 			path: 'messaging/queueing',
	// 			path_description: 'Messaging / Queueing'
	// 		},
	// 		{
	// 			nodo: 'kafka',
	// 			path: 'messaging/streaming',
	// 			path_description: 'Messaging / Streaming'
	// 		},
	// 		{
	// 			nodo: 'kafkaProducer',
	// 			path: 'messaging/streaming',
	// 			path_description: 'Messaging / Streaming'
	// 		},
	// 		{
	// 			nodo: 'kafkaAck',
	// 			path: 'messaging/streaming',
	// 			path_description: 'Messaging / Streaming'
	// 		},
	// 		{
	// 			nodo: 'kafkaKerberos',
	// 			path: 'messaging/streaming',
	// 			path_description: 'Messaging / Streaming'
	// 		},
	// 		{
	// 			nodo: 'tcp',
	// 			path: 'network/tcp',
	// 			path_description: 'Network / Tcp'
	// 		},
	// 		{
	// 			nodo: 'tcpResponse',
	// 			path: 'network/tcp',
	// 			path_description: 'Network / Tcp'
	// 		},
	// 		{
	// 			nodo: 'tcpEmit',
	// 			path: 'network/tcp',
	// 			path_description: 'Network / Tcp'
	// 		},
	// 		{
	// 			nodo: 'socket',
	// 			path: 'network/socket',
	// 			path_description: 'Network / Socket'
	// 		},
	// 		{
	// 			nodo: 'socketEmit',
	// 			path: 'network/socket',
	// 			path_description: 'Network / Socket'
	// 		},
	// 		{
	// 			nodo: 'socketDisconnect',
	// 			path: 'network/socket',
	// 			path_description: 'Network / Socket'
	// 		},
	// 		{
	// 			nodo: 'socketConsumer',
	// 			path: 'network/socket',
	// 			path_description: 'Network / Socket'
	// 		},
	// 		{
	// 			nodo: 'ftp',
	// 			path: 'network/ftp',
	// 			path_description: 'Network / Ftp'
	// 		},
	// 		{
	// 			nodo: 'soap',
	// 			path: 'integration/web_services',
	// 			path_description: 'Integration / Web Services'
	// 		},
	// 		{
	// 			nodo: 'requestSoap',
	// 			path: 'integration/web_services',
	// 			path_description: 'Integration / Web Services'
	// 		},
	// 		{
	// 			nodo: 'responseSoap',
	// 			path: 'integration/web_services',
	// 			path_description: 'Integration / Web Services'
	// 		},
	// 		{
	// 			nodo: 'response',
	// 			path: 'integration/web_services',
	// 			path_description: 'Integration / Web Services'
	// 		},
	// 		{
	// 			nodo: 'request',
	// 			path: 'integration/web_services',
	// 			path_description: 'Integration / Web Services'
	// 		},
	// 		{
	// 			nodo: 'webhook',
	// 			path: 'integration',
	// 			path_description: 'Integration'
	// 		},
	// 		{
	// 			nodo: 'conditional',
	// 			path: 'control_flow/logic',
	// 			path_description: 'Control Flow / Logic'
	// 		},
	// 		{
	// 			nodo: 'limitIterations',
	// 			path: 'control_flow/logic',
	// 			path_description: 'Control Flow / Logic'
	// 		},
	// 		{
	// 			nodo: 'iteration',
	// 			path: 'control_flow/logic',
	// 			path_description: 'Control Flow / Logic'
	// 		},
	// 		{
	// 			nodo: 'subFlow',
	// 			path: 'control_flow/logic',
	// 			path_description: 'Control Flow / Logic'
	// 		},
	// 		{
	// 			nodo: 'timer',
	// 			path: 'control_flow/timing',
	// 			path_description: 'Control Flow / Timing'
	// 		},
	// 		{
	// 			nodo: 'delay',
	// 			path: 'control_flow/timing',
	// 			path_description: 'Control Flow / Timing'
	// 		},
	// 		{
	// 			nodo: 'transform',
	// 			path: 'utilities/data_processing',
	// 			path_description: 'Utilities / Data Processing'
	// 		},
	// 		{
	// 			nodo: 'validate',
	// 			path: 'utilities/data_processing',
	// 			path_description: 'Utilities / Data Processing'
	// 		},
	// 		{
	// 			nodo: 'converter',
	// 			path: 'utilities/data_processing',
	// 			path_description: 'Utilities / Data Processing'
	// 		},
	// 		{
	// 			nodo: 'script',
	// 			path: 'utilities/scripting',
	// 			path_description: 'Utilities / Scripting'
	// 		},
	// 		{
	// 			nodo: 'python',
	// 			path: 'utilities/scripting',
	// 			path_description: 'Utilities / Scripting'
	// 		},
	// 		{
	// 			nodo: 'file',
	// 			path: 'utilities/file_operations',
	// 			path_description: 'Utilities / File Operations'
	// 		},
	// 		{
	// 			nodo: 'storage',
	// 			path: 'utilities/file_operations',
	// 			path_description: 'Utilities / File Operations'
	// 		},
	// 		{
	// 			nodo: 'excel_generator',
	// 			path: 'utilities/file_operations',
	// 			path_description: 'Utilities / File Operations'
	// 		},
	// 		{
	// 			nodo: 'console',
	// 			path: 'utilities/console',
	// 			path_description: 'Utilities / Console'
	// 		},
	// 		{
	// 			nodo: 'actions',
	// 			path: 'utilities/actions',
	// 			path_description: 'Utilities / Actions'
	// 		},
	// 		{
	// 			nodo: 'logger',
	// 			path: 'utilities/actions',
	// 			path_description: 'Utilities / Actions'
	// 		},
	// 		{
	// 			nodo: 'none',
	// 			path: 'utilities/actions',
	// 			path_description: 'Utilities / Actions'
	// 		},
	// 		{
	// 			nodo: 'form',
	// 			path: 'ui/form',
	// 			path_description: 'Ui / Form'
	// 		},
	// 		{
	// 			nodo: 'formSetValue',
	// 			path: 'ui/form',
	// 			path_description: 'Ui / Form'
	// 		},
	// 		{
	// 			nodo: 'formNotify',
	// 			path: 'ui/form',
	// 			path_description: 'Ui / Form'
	// 		},
	// 		{
	// 			nodo: 'formGoTo',
	// 			path: 'ui/form',
	// 			path_description: 'Ui / Form'
	// 		},
	// 		{
	// 			nodo: 'scraper',
	// 			path: 'ui/automation',
	// 			path_description: 'Ui / Automation'
	// 		},
	// 		{
	// 			nodo: 'ai_model',
	// 			path: 'analytics/machine_learning',
	// 			path_description: 'Analytics / Machine Learning'
	// 		},
	// 		{
	// 			nodo: 'generator',
	// 			path: 'analytics/machine_learning',
	// 			path_description: 'Analytics / Machine Learning'
	// 		},
	// 		{
	// 			nodo: 'parallelism',
	// 			path: 'control_flow/execution',
	// 			path_description: 'Control Flow / Execution'
	// 		},
	// 		{
	// 			nodo: 'mail',
	// 			path: 'email/email_services',
	// 			path_description: 'Email / Email Services'
	// 		},
	// 		{
	// 			nodo: 'gmail',
	// 			path: 'email/email_services',
	// 			path_description: 'Email / Email Services'
	// 		},
	// 		{
	// 			nodo: 'spotify',
	// 			path: 'services/music',
	// 			path_description: 'Servicios / Música'
	// 		},
	// 		{
	// 			nodo: 'local',
	// 			path: 'services/ia',
	// 			path_description: 'Servicios / IA'
	// 		},
	// 		{
	// 			nodo: 'auth_service',
	// 			path: 'auth',
	// 			path_description: 'Autenticación'
	// 		},
	// 		{
	// 			nodo: 'message',
	// 			path: 'project/connection',
	// 			path_description: 'Project / Message'
	// 		},
	// 		{
	// 			nodo: 'message_response',
	// 			path: 'project/connection',
	// 			path_description: 'Project / Message Response'
	// 		},
	// 		{
	// 			nodo: 'message_request',
	// 			path: 'project/connection',
	// 			path_description: 'Project / Message Request'
	// 		},
	// 		{
	// 			nodo: 'tcp',
	// 			path: 'project/server',
	// 			path_description: 'Project / Server'
	// 		}
	// 	]

	// 	const functions1 = {
	// 		getNodesList: defineChatSessionFunction({
	// 			description: 'Get a list of nodes',
	// 			async handler() {
	// 				console.log('getNodesList')
	// 				return categories
	// 			}
	// 		})
	// 	}

	// 	const fruitPrices: Record<string, string> = {
	// 		apple: '$6',
	// 		banana: '$4',
	// 		mango: '$2',
	// 		orange: '$3',
	// 		grapes: '$1',
	// 		strawberry: '$1',
	// 		pineapple: '$1',
	// 		watermelon: '$1',
	// 		kiwi: '$1'
	// 	}
	// 	const functions = {
	// 		getFruitList: defineChatSessionFunction({
	// 			description: 'Get a list of fruits',
	// 			async handler() {
	// 				console.log('getFruitList')
	// 				return Object.keys(fruitPrices)
	// 			}
	// 		}),

	// 		getFruitPrice: defineChatSessionFunction({
	// 			description: 'Get the price of a fruit',
	// 			params: {
	// 				type: 'object',
	// 				properties: {
	// 					name: {
	// 						type: 'string'
	// 					}
	// 				}
	// 			},
	// 			async handler(params: any) {
	// 				console.log('getFruitPrice', params)
	// 				const name = params.name.toLowerCase()
	// 				if (Object.keys(fruitPrices).includes(name))
	// 					return {
	// 						name: name,
	// 						price: fruitPrices[name]
	// 					}

	// 				return `Unrecognized fruit "${params.name}" retrived from the list of fruits.`
	// 			}
	// 		})
	// 	}

	// 	// const q1 =
	// 	// 	'verifica primero el listado de frutas y despues contesta. que diferencia de precio hay entre manzana y los aguacates, contesta siempre en español'
	// 	// console.log(`User: ${q1}`)

	// 	// const a1 = await session.prompt(q1, { functions })
	// 	// console.log(`AI: ${a1}`)

	// 	const q2 = 'NO ASUMAS NADA, crea un proceso para realizar inventario con los nodos, contesta siempre en español'
	// 	console.log(`User: ${q2}`)

	// 	const a2 = await session.prompt(q2, { functions: functions1 })
	// 	console.log(`AI: ${a2}`)
	// } catch (err) {
	// 	console.error('❌ Error al cargar o ejecutar el modelo:', err)
	// }
}

// async function main() {
// 	try {
// 		await load()
// 	} catch (err) {
// 		console.error('❌ Error al ejecutar la aplicación:', err)
// 		process.exit(1)
// 	}
// }
