import type { IWorkflowFull } from '@shared/interfaces/standardized.js'
import type { SocketData } from './index.js'
import { Op } from 'sequelize'
import { Project, Workflow, WorkflowExecution, WorkflowHistory } from '../../models/index.js'
import { getNodeClass } from '@shared/store/node.store.js'
import { workerManager } from '../../services/workerManager.js'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const nodeClass = getNodeClass()

export const setupWorkflowRoutes = {
	// List workflows - requires read permission
	'workflows:list': async ({ socket, data, callback }: SocketData) => {
		try {
			const { workspaceId, projectId } = data

			const workflows = await Workflow.findAll({
				include: [
					{
						model: Project,
						as: 'project',
						where: {
							workspaceId,
							id: projectId
						}
					}
				],
				where: {
					projectId,
					status: {
						[Op.ne]: 'archived'
					}
				},
				order: [['createdAt', 'DESC']]
			})

			callback({ success: true, workflows })
		} catch (error) {
			console.error('Error listando workflows:', error)
			callback({ success: false, message: 'Error al cargar workflows' })
		}
	},

	// Get workflow by ID - requires read permission
	'workflows:get': async ({ socket, data, callback }: SocketData) => {
		try {
			const { workspaceId, id, hidratation = true } = data

			const workflow = await Workflow.findOne({
				include: [
					{
						attributes: ['id', 'name', 'description', 'transportType'],
						model: Project,
						as: 'project',
						where: {
							workspaceId
						}
					}
				],
				where: {
					id,
					status: {
						[Op.ne]: 'archived'
					}
				}
			})

			// Hidratación de propiedades
			if (hidratation && workflow?.workflowData?.nodes) {
				for (const nodes of Object.values(workflow.workflowData.nodes)) {
					if (!nodes?.properties) continue
					// Si no existe el nodo, eliminarlo
					if (!nodeClass[nodes.type]) {
						delete workflow.workflowData.nodes[nodes.id]
						continue
					}
					const property = nodeClass[nodes.type].properties
					for (const [key, value] of Object.entries(nodes.properties)) {
						nodes.properties[key] = {
							...property[key],
							...(value as object)
						}
					}
				}
			}

			// if (!workflow) {
			// 	callback({ success: false, message: 'Workflow no encontrado' })
			// 	return
			// }

			// // leave all
			// for (const room of socket.rooms) {
			// 	if (room.startsWith('workflow:')) socket.leave(room)
			// }

			// // join
			// socket.join(`workflow:${id}`)

			callback({ success: true, workflow })
		} catch (error) {
			console.error('Error obteniendo workflow:', error)
			callback({ success: false, message: 'Error al obtener workflow' })
		}
	},

	// Create workflow - requires authentication and project access
	// Create workflow - requires create permission
	'workflows:create': async ({ socket, data, callback }: SocketData) => {
		try {
			const workflow = await Workflow.create(data)
			callback({ success: true, workflow })
		} catch (error) {
			console.error('Error creando workflow:', error)
			callback({ success: false, message: 'Error al crear workflow' })
		}
	},

	// Update workflow - requires authentication and project access
	// Update workflow - requires update permission
	'workflows:update': async ({ socket, data, callback }: SocketData) => {
		try {
			const { id, connections, nodes, notes, groups } = data

			const updates = {
				workflowData: {
					nodes,
					connections,
					notes,
					groups
				},
				updatedAt: new Date()
			}

			// Validar si existen cambios en el workflow
			const originalWorkflow = await Workflow.findByPk(id)
			if (!originalWorkflow) {
				callback({ success: false, message: 'Workflow no encontrado' })
				return
			}

			if (originalWorkflow.workflowData) {
				// Verificar si los nodos y conexiones han cambiado
				const originalNodes = originalWorkflow.workflowData.nodes
				const originalConnections = originalWorkflow.workflowData.connections
				const originalNotes = originalWorkflow.workflowData.notes
				const originalGroups = originalWorkflow.workflowData.groups
				const newNodes = nodes
				const newConnections = connections
				const newNotes = notes
				const newGroups = groups

				if (
					JSON.stringify(originalNodes) === JSON.stringify(newNodes) &&
					JSON.stringify(originalConnections) === JSON.stringify(newConnections) &&
					JSON.stringify(originalNotes) === JSON.stringify(newNotes) &&
					JSON.stringify(originalGroups) === JSON.stringify(newGroups)
				) {
					callback({ success: false, message: 'No se han realizado cambios en el workflow' })
					return
				}
			}

			const [updatedRows] = await Workflow.update(updates, { where: { id }, individualHooks: true })
			if (updatedRows > 0) {
				const updatedWorkflow = await Workflow.findByPk(id)
				callback({ success: true, workflow: updatedWorkflow })
			} else {
				callback({ success: false, message: 'Error al actualizar workflow' })
			}
		} catch (error) {
			console.error('Error actualizando workflow:', error)
			callback({ success: false, message: 'Error al actualizar workflow' })
		}
	},

	// Delete workflow - requires authentication and project access
	// Delete workflow - requires delete permission
	'workflows:delete': async ({ socket, data, callback }: SocketData) => {
		try {
			const { id } = data
			await Workflow.update({ status: 'archived' }, { where: { id }, individualHooks: true })
			callback({ success: true })
		} catch (error) {
			console.error('Error eliminando workflow:', error)
			callback({ success: false, message: 'Error al eliminar workflow' })
		}
	},

	// Execute workflow - requires authentication and project access
	// Execute workflow - requires execute permission
	'workflows:execute': async ({ socket, data, callback }: SocketData) => {
		try {
			const { workflowId, trigger = 'manual', version } = data

			let workflowData: any
			let workflowVersion: string
			let workflowInfo: Workflow

			if (version) {
				// Si se especifica una versión, buscar en el historial
				const historyEntry = await WorkflowHistory.findOne({
					where: {
						workflowId,
						version
					},
					order: [['createdAt', 'DESC']] // En caso de múltiples entradas con la misma versión
				})

				if (!historyEntry) {
					callback({ success: false, message: `Versión ${version} no encontrada para el workflow` })
					return
				}

				const workflow = await Workflow.findByPk(workflowId)
				if (!workflow) {
					callback({ success: false, message: 'Workflow no encontrado' })
					return
				}

				workflowInfo = workflow
				workflowData = historyEntry.newData
				workflowVersion = historyEntry.version
			} else {
				// Si no se especifica versión, usar la versión actual (última)
				const workflow = await Workflow.findByPk(workflowId)
				if (!workflow) {
					callback({ success: false, message: 'Workflow no encontrado' })
					return
				}

				workflowInfo = workflow
				workflowData = workflow.workflowData
				workflowVersion = workflow.version
			}

			// Save workflow to file before execution with version info
			try {
				const dataDir = path.join(process.cwd(), 'data', 'workflows', workflowId)

				// Create directory if it doesn't exist
				if (!fs.existsSync(dataDir)) {
					fs.mkdirSync(dataDir, { recursive: true })
				}

				// Save flow.json with version info
				const flowData: IWorkflowFull = {
					info: {
						name: workflowInfo.name,
						description: workflowInfo.description,
						uid: workflowInfo.id
					},
					properties: workflowInfo.properties,
					version: workflowVersion,
					...workflowData
				}

				// Also save as latest flow.json
				const latestFlowPath = path.join(dataDir, 'flow.json')
				fs.writeFileSync(latestFlowPath, JSON.stringify(flowData, null, 2), 'utf8')

				console.log(`Flujo v${workflowVersion} guardado en: ${latestFlowPath}`)
			} catch (fileError) {
				console.error('Error guardando flujo en archivo:', fileError)
				// Continue with execution even if file save fails
			}

			// Create execution record
			const execution = await WorkflowExecution.create({
				workflowId,
				status: 'running',
				startTime: new Date(),
				trigger,
				version: workflowVersion // Store the executed version
			})

			// Update workflow status (only if executing latest version)
			if (!version) {
				await Workflow.update(
					{
						status: 'running',
						lastRun: new Date()
					},
					{ where: { id: workflowId } }
				)
			}

			// Create and start worker for workflow execution
			try {
				const worker = await workerManager.createWorker({
					workflowId,
					executionId: execution.id.toString(),
					version: workflowVersion
				})

				console.log(`Worker ${worker.id} creado para ejecutar workflow ${workflowId}`)

				// Set up worker event listeners for this execution
				const handleWorkerReady = (workerInfo: any) => {
					if (workerInfo.id === worker.id) {
						console.log(`Worker ${worker.id} listo para ejecutar workflow ${workflowId}`)
						socket.emit('workflows:worker-ready', {
							workflowId,
							executionId: execution.id,
							workerId: worker.id,
							port: worker.port
						})
						workerManager.off('worker:ready', handleWorkerReady)
					}
				}

				const handleWorkerError = (errorData: any) => {
					if (errorData.workerId === worker.id) {
						console.error(`Error en worker ${worker.id}:`, errorData.error)

						// Update execution status
						execution.update({
							status: 'failed',
							endTime: new Date(),
							errorMessage: errorData.error
						})

						// Update workflow status if executing latest version
						if (!version) {
							Workflow.update({ status: 'failed' }, { where: { id: workflowId } })
						}

						socket.emit('workflows:execution-error', {
							workflowId,
							executionId: execution.id,
							workerId: worker.id,
							error: errorData.error
						})

						workerManager.off('worker:error', handleWorkerError)
					}
				}

				const handleWorkerExit = (exitData: any) => {
					if (exitData.workerId === worker.id) {
						const endTime = new Date()
						const duration = `${Math.floor((endTime.getTime() - execution.startTime.getTime()) / 1000)}s`

						// Determine final status based on exit code
						const finalStatus = exitData.code === 0 ? 'success' : 'failed'

						// Update execution record
						execution.update({
							status: finalStatus,
							endTime,
							duration
						})

						// Update workflow status if executing latest version
						if (!version) {
							Workflow.update(
								{
									status: finalStatus,
									duration
								},
								{ where: { id: workflowId } }
							)
						}

						socket.emit('workflows:execution-completed', {
							workflowId,
							executionId: execution.id,
							status: finalStatus,
							version: workflowVersion,
							duration,
							workerId: worker.id
						})

						workerManager.off('worker:exit', handleWorkerExit)
					}
				}

				// Listen for worker events
				workerManager.on('worker:ready', handleWorkerReady)
				workerManager.on('worker:error', handleWorkerError)
				workerManager.on('worker:exit', handleWorkerExit)

				callback({
					success: true,
					executionId: execution.id,
					workerId: worker.id,
					port: worker.port,
					version: workflowVersion,
					message: version
						? `Ejecutando versión específica: ${workflowVersion} en worker ${worker.id}`
						: `Ejecutando última versión: ${workflowVersion} en worker ${worker.id}`
				})
			} catch (workerError) {
				console.error('Error creando worker:', workerError)

				// Update execution status
				await execution.update({
					status: 'failed',
					endTime: new Date(),
					errorMessage: workerError instanceof Error ? workerError.message : 'Error creating worker'
				})

				// Update workflow status if executing latest version
				if (!version) {
					await Workflow.update({ status: 'failed' }, { where: { id: workflowId } })
				}

				callback({
					success: false,
					message: `Error creando worker: ${workerError instanceof Error ? workerError.message : 'Unknown error'}`
				})
			}
		} catch (error) {
			console.error('Error ejecutando workflow:', error)
			callback({ success: false, message: 'Error al ejecutar workflow' })
		}
	},

	// Save workflow to JSON file - requires authentication and project access
	'workflows:save-to-json': async ({ socket, data, callback }: SocketData) => {
		try {
			const { id } = data

			const workflow = await Workflow.findOne({
				where: {
					id,
					status: {
						[Op.ne]: 'archived'
					}
				}
			})

			if (!workflow) {
				callback({ success: false, message: 'Workflow no encontrado' })
				return
			}

			// Define file path and name
			const filePath = path.join(__dirname, `../../uploads/workflow_${id}.json`)

			// Write workflow data to JSON file
			fs.writeFileSync(filePath, JSON.stringify(workflow, null, 2))

			callback({ success: true, filePath })
		} catch (error) {
			console.error('Error guardando workflow a JSON:', error)
			callback({ success: false, message: 'Error al guardar workflow a JSON' })
		}
	},

	// Save workflow to file - requires update permission
	'workflows:saveToFile': async ({ socket, data, callback }: SocketData) => {
		try {
			const { workflowId } = data

			// Get workflow data
			const workflow = await Workflow.findByPk(workflowId)
			if (!workflow) {
				callback({ success: false, message: 'Workflow no encontrado' })
				return
			}

			// Create data directory
			const dataDir = path.join(process.cwd(), 'data', 'workflows', workflowId)

			if (!fs.existsSync(dataDir)) {
				fs.mkdirSync(dataDir, { recursive: true })
			}

			const flowData: IWorkflowFull = {
				info: {
					name: workflow.name,
					uid: workflow.id
				},
				version: workflow.version,
				properties: workflow.properties,
				...workflow.workflowData,
				environment: [],
				secrets: []
			}

			// Save flow.json
			const flowPath = path.join(dataDir, 'flow.json')
			fs.writeFileSync(flowPath, JSON.stringify(flowData, null, 2), 'utf8')

			console.log(`Flujo guardado en: ${flowPath}`)

			callback({
				success: true,
				message: 'Flujo guardado exitosamente',
				path: flowPath
			})
		} catch (error) {
			console.error('Error guardando flujo en archivo:', error)
			callback({ success: false, message: 'Error al guardar flujo en archivo' })
		}
	},

	// Get workflow versions - requires read permission
	'workflows:getVersions': async ({ socket, data, callback }: SocketData) => {
		try {
			const { workflowId } = data

			// Get current workflow version
			const workflow = await Workflow.findByPk(workflowId)
			if (!workflow) {
				callback({ success: false, message: 'Workflow no encontrado' })
				return
			}

			// Get all versions from history
			const historyVersions = await WorkflowHistory.findAll({
				where: { workflowId },
				attributes: ['version', 'changeType', 'changeDescription', 'createdAt'],
				order: [['createdAt', 'DESC']]
			})

			// Combine current version with history
			const versions = [
				{
					version: workflow.version,
					changeType: 'current',
					changeDescription: 'Versión actual',
					createdAt: workflow.updatedAt,
					isCurrent: true
				},
				...historyVersions.map((h: any) => ({
					version: h.version,
					changeType: h.changeType,
					changeDescription: h.changeDescription,
					createdAt: h.createdAt,
					isCurrent: false
				}))
			]

			// Remove duplicates and sort by version
			const uniqueVersions = versions
				.filter((v, i, arr) => arr.findIndex((a) => a.version === v.version) === i)
				.sort((a, b) => {
					// Sort by semantic version (major.minor.patch)
					const aVersion = a.version.split('.').map(Number)
					const bVersion = b.version.split('.').map(Number)

					for (let i = 0; i < Math.max(aVersion.length, bVersion.length); i++) {
						const aPart = aVersion[i] || 0
						const bPart = bVersion[i] || 0
						if (aPart !== bPart) {
							return bPart - aPart // Descending order (latest first)
						}
					}
					return 0
				})

			callback({
				success: true,
				versions: uniqueVersions,
				currentVersion: workflow.version
			})
		} catch (error) {
			console.error('Error obteniendo versiones:', error)
			callback({ success: false, message: 'Error al obtener versiones del workflow' })
		}
	}
}
