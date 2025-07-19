import type { IWorkflowFull } from '@shared/interfaces/standardized.js'
import { promises as fs } from 'node:fs'
import { getNodeClassDependencies } from '@shared/store/node.store.js'
import { DeploymentQueue, DeploymentInstanceAssignment, DeploymentInstance, Workflow } from '../models/index.js'
import path from 'node:path'

export class DeploymentQueueService {
	private readonly deployBasePath: string

	constructor() {
		this.deployBasePath = path.join(process.cwd(), 'data', 'deploys')
	}

	/**
	 * Inicializa el servicio y se suscribe a los eventos de SocketRoutes
	 */
	async init() {
		// Asegurar que existe el directorio base de deploys
		await this.ensureDeployDirectory()

		console.log('DeploymentQueueService inicializado correctamente')
	}

	/**
	 * Método público para procesar una cola de despliegue creada
	 */
	async processQueueCreated(queueItem: any): Promise<string | null> {
		try {
			console.log('Procesando cola de despliegue creada:', queueItem?.id)

			if (!queueItem) return null

			// Si la cola está en pending, verificar autoaprobación
			if (queueItem.status === 'pending') {
				return await this.checkAutoApproval(queueItem)
			}
			return null
		} catch (error) {
			console.error('Error procesando cola creada:', error)
			return null
		}
	}

	/**
	 * Método público para procesar una cola de despliegue actualizada
	 */
	async processQueueUpdated(queueItem: any, previousStatus?: string): Promise<string | null> {
		try {
			console.log('Procesando cola de despliegue actualizada:', queueItem?.id)

			if (!queueItem) return null

			const currentStatus = queueItem.status

			// Si la cola está en pending, verificar autoaprobación
			if (currentStatus === 'pending') return await this.checkAutoApproval(queueItem)

			// Si la cola está en running, crear estructura de archivos
			if (currentStatus === 'running' && previousStatus !== 'running') return await this.createDeploymentStructure(queueItem)

			return null
		} catch (error) {
			console.error('Error procesando cola actualizada:', error)
			return null
		}
	}

	/**
	 * Verifica si la instancia tiene autoaprobación habilitada
	 */
	private async checkAutoApproval(queueItem: any): Promise<string | null> {
		try {
			// Actualizar el estado a running
			await DeploymentQueue.update(
				{
					status: 'running',
					startedAt: new Date()
				},
				{
					where: { id: queueItem.id }
				}
			)

			// Obtener el item actualizado y procesar el cambio a running
			const updatedQueueItem = await DeploymentQueue.findByPk(queueItem.id)
			if (updatedQueueItem) {
				console.log(`Cola ${queueItem.id} auto-aprobada y cambiada a running`)
				return await this.processQueueUpdated(updatedQueueItem, 'pending')
			}
			return null
		} catch (error) {
			console.error('Error verificando autoaprobación:', error)
			return null
		}
	}

	/**
	 * Crea la estructura de archivos para el despliegue
	 */
	async createDeploymentStructure(queueItem: any): Promise<string | null> {
		try {
			if (!queueItem.flow || !queueItem.id) {
				console.warn('No se puede crear estructura de despliegue: flow o id faltante')
				return null
			}

			const flowId = queueItem.id.toString()
			const deploymentPath = path.join(this.deployBasePath, flowId)

			console.log(`Creando estructura de despliegue en: ${deploymentPath}`)

			// Crear directorio del despliegue
			await fs.mkdir(deploymentPath, { recursive: true })

			// Transformar el flow a la estructura IWorkflowFull
			const standardizedFlow = this.transformToWorkflowFull(queueItem.flow)

			// Crear archivo flow.json con la estructura estandarizada
			const flowJsonPath = path.join(deploymentPath, 'flow.json')
			await fs.writeFile(flowJsonPath, JSON.stringify(standardizedFlow, null, 2), 'utf-8')

			// Analizar y copiar nodos utilizados
			await this.copyRequiredNodes(standardizedFlow, deploymentPath)

			// Generar package.json con dependencias requeridas
			await this.generatePackageJson(standardizedFlow, deploymentPath)

			// Incrementar versión del workflow según la configuración de la instancia
			await this.incrementWorkflowVersion(queueItem)

			// Actualizar el estado del despliegue a success
			await DeploymentQueue.update(
				{
					status: 'success',
					completedAt: new Date()
				},
				{
					where: { id: queueItem.id }
				}
			)

			console.log(`Estructura de despliegue creada exitosamente para flow ${flowId}`)
			console.log(`Estado del despliegue ${queueItem.id} actualizado a success`)

			return deploymentPath
		} catch (error) {
			console.error('Error creando estructura de despliegue:', error)

			// En caso de error, marcar el despliegue como failed
			try {
				await DeploymentQueue.update(
					{
						status: 'failed',
						completedAt: new Date(),
						errorMessage: (error as Error)?.message || 'Error desconocido'
					},
					{
						where: { id: queueItem.id }
					}
				)
				console.log(`Estado del despliegue ${queueItem.id} actualizado a failed debido a error`)
				return null
			} catch (updateError) {
				console.error('Error actualizando estado a failed:', updateError)
				return null
			}
		}
	}

	/**
	 * Transforma un flow a la estructura IWorkflowFull estandarizada
	 */
	private transformToWorkflowFull(flow: any): IWorkflowFull {
		try {
			// Crear la estructura base requerida por IWorkflowFull
			const workflowData = flow.workflowData || {}
			const standardizedFlow: IWorkflowFull = {
				// IWorkflowBase properties
				version: flow.version || '1.0.0',
				info: {
					uid: flow.id || '',
					name: flow.name || 'Unnamed Workflow',
					disabled: false
				},
				properties: flow.properties,
				environment: flow.environment || [],
				secrets: flow.secrets || [],

				// IWorkflowData properties
				nodes: workflowData.nodes || {},
				connections: workflowData.connections || [],
				notes: workflowData.notes || [],
				groups: workflowData.groups || []
			}

			console.log(`Flow transformado a IWorkflowFull para workflow: ${standardizedFlow.info.name}`)
			return standardizedFlow
		} catch (error) {
			console.error('Error transformando flow a IWorkflowFull:', error)
			// En caso de error, retornar una estructura mínima válida
			return {
				version: '1.0.0',
				info: {
					uid: '',
					name: 'Error Workflow',
					disabled: false
				},
				properties: {
					basic: {
						router: ''
					},
					deploy: null
				},
				environment: [],
				secrets: [],
				nodes: {},
				connections: [],
				notes: [],
				groups: []
			}
		}
	}

	/**
	 * Analiza el flow y copia los nodos necesarios
	 */
	private async copyRequiredNodes(flow: IWorkflowFull, deploymentPath: string) {
		try {
			if (!flow.nodes || typeof flow.nodes !== 'object') {
				console.warn('No se encontraron nodos en el flow')
				return
			}

			const nodesPath = path.join(deploymentPath, 'shared', 'plugins', 'nodes')
			const sourceNodesPath = path.join(process.cwd(), 'dist', 'shared', 'plugins', 'nodes')

			// Crear directorio de nodos
			await fs.mkdir(nodesPath, { recursive: true })

			// Obtener lista de tipos de nodos únicos desde el objeto nodes
			const nodeTypes = new Set<string>()

			// Iterar sobre las claves del objeto nodes
			for (const nodeId in flow.nodes) {
				const node = flow.nodes[nodeId]
				if (node?.type) {
					nodeTypes.add(node.type)
				}
			}

			console.log(`Copiando ${nodeTypes.size} tipos de nodos:`, Array.from(nodeTypes))

			// Copiar cada tipo de nodo
			for (const nodeType of nodeTypes) {
				const sourceNodePath = path.join(sourceNodesPath, nodeType)
				const targetNodePath = path.join(nodesPath, nodeType)

				try {
					// Verificar si el nodo existe en el directorio fuente
					await fs.access(sourceNodePath)

					// Copiar directorio completo del nodo
					await this.copyDirectory(sourceNodePath, targetNodePath)

					console.log(`Nodo ${nodeType} copiado exitosamente`)
				} catch (error) {
					console.warn(`No se pudo copiar el nodo ${nodeType}:`, error)
				}
			}

			// Copiar shared/store y shared/utils
			const dirs = ['shared/store', 'shared/utils', 'worker']
			for (const dir of dirs) {
				const sourceDir = path.join(process.cwd(), 'dist', dir)
				const targetDir = path.join(deploymentPath, dir)
				try {
					await this.copyDirectory(sourceDir, targetDir)
					console.log(`Directorio ${dir} copiado exitosamente`)
				} catch (error) {
					console.warn(`No se pudo copiar el directorio ${dir}:`, error)
				}
			}

			// Copiando .env.deploy como .env
			try {
				const sourceEnv = path.join(process.cwd(), '.env.deploy')
				const targetEnv = path.join(deploymentPath, '.env')
				await fs.copyFile(sourceEnv, targetEnv)
				console.log('Archivo .env copiado exitosamente')
			} catch (error) {
				console.warn('No se pudo copiar el archivo .env.deploy:', error)
			}
		} catch (error) {
			console.error('Error copiando nodos requeridos:', error)
		}
	}

	/**
	 * Obtiene todas las dependencias requeridas por los nodos del flow
	 */
	private getNodeDependencies(flow: IWorkflowFull): Set<string> {
		const dependencies = new Set<string>()

		if (!flow.nodes || typeof flow.nodes !== 'object') {
			return dependencies
		}

		// Iterar sobre todos los nodos para obtener sus dependencias
		for (const nodeId in flow.nodes) {
			const node = flow.nodes[nodeId]
			if (node?.type) {
				const nodeDependencies = getNodeClassDependencies(node.type)
				if (nodeDependencies && Array.isArray(nodeDependencies)) {
					for (const dep of nodeDependencies) {
						dependencies.add(dep)
					}
				}
			}
		}

		console.log('Dependencias encontradas en los nodos:', Array.from(dependencies))
		return dependencies
	}

	/**
	 * Genera un package.json con las dependencias requeridas por los nodos
	 */
	private async generatePackageJson(flow: IWorkflowFull, deploymentPath: string) {
		try {
			// Leer el package.json principal para obtener la estructura base
			const mainPackageJsonPath = path.join(process.cwd(), 'package.json')
			const mainPackageJson = JSON.parse(await fs.readFile(mainPackageJsonPath, 'utf-8'))

			// Obtener dependencias requeridas por los nodos
			const nodeDependencies = this.getNodeDependencies(flow)

			// Crear objeto de dependencias filtradas, empezando con las dependencies existentes
			const filteredDependencies: { [key: string]: string } = {
				...mainPackageJson.dependencies
			}

			// Buscar cada dependencia de los nodos en devDependencies y dependencies del package.json principal
			for (const dep of nodeDependencies) {
				let version: string | undefined

				// Buscar primero en devDependencies, luego en dependencies
				if (mainPackageJson.devDependencies?.[dep]) {
					version = mainPackageJson.devDependencies[dep]
				} else if (mainPackageJson.dependencies?.[dep]) {
					version = mainPackageJson.dependencies[dep]
				}

				if (version) {
					filteredDependencies[dep] = version
					console.log(`Dependencia de nodo agregada: ${dep}@${version}`)
				} else {
					console.warn(`Dependencia ${dep} no encontrada en package.json principal`)
				}
			}

			// Crear package.json para el despliegue manteniendo la estructura original
			const { devDependencies, workspaces, ...basePackageJson } = mainPackageJson

			const deploymentPackageJson = {
				...basePackageJson,
				name: `${flow.info.name.toLowerCase().replace(/\s+/g, '-')}-deployment`,
				description: `Deployment package for workflow: ${flow.info.name}`,
				main: 'worker/index.js',
				dependencies: filteredDependencies,
				scripts: {
					...mainPackageJson.scripts,
					start: 'node worker/index.js'
				}
			}

			// Escribir package.json
			const packageJsonPath = path.join(deploymentPath, 'package.json')
			await fs.writeFile(packageJsonPath, JSON.stringify(deploymentPackageJson, null, 2), 'utf-8')

			console.log(`package.json generado exitosamente con ${Object.keys(filteredDependencies).length} dependencias`)
		} catch (error) {
			console.error('Error generando package.json:', error)
		}
	}

	/**
	 * Incrementa la versión del workflow según la configuración de versionChange de la instancia
	 */
	private async incrementWorkflowVersion(queueItem: any) {
		try {
			if (!queueItem.instanceId || !queueItem.workflowId) {
				console.log('No se puede incrementar versión: instanceId o workflowId faltante')
				return
			}

			// Obtener la instancia de despliegue para verificar el tipo de cambio de versión
			const instance = await DeploymentInstance.findByPk(queueItem.instanceId)
			if (!instance) {
				console.warn(`Instancia ${queueItem.instanceId} no encontrada`)
				return
			}

			// Si versionChange es 'none', no hacer nada
			if (instance.versionChange === 'none') {
				console.log(`Instancia ${instance.name} configurada para no cambiar versión`)
				return
			}

			// Obtener el workflow actual
			const workflow = await Workflow.findByPk(queueItem.workflowId)
			if (!workflow) {
				console.warn(`Workflow ${queueItem.workflowId} no encontrado`)
				return
			}

			const currentVersion = workflow.version || '0.0.1'

			// Calcular la nueva versión según el tipo de cambio configurado
			const versionParts = currentVersion.split('.').map(Number)
			while (versionParts.length < 3) {
				versionParts.push(0)
			}

			let [major, minor, patch] = versionParts

			switch (instance.versionChange) {
				case 'patch':
					patch += 1
					break
				case 'minor':
					minor += 1
					patch = 0
					break
				case 'major':
					major += 1
					minor = 0
					patch = 0
					break
			}

			const newVersion = `${major}.${minor}.${patch}`

			// Actualizar la versión del workflow - el hook beforeUpdate detectará el cambio manual
			await Workflow.update(
				{ version: newVersion },
				{
					where: { id: queueItem.workflowId }
				}
			)

			console.log(`Versión del workflow ${workflow.name} incrementada de ${currentVersion} a ${newVersion} (${instance.versionChange})`)
		} catch (error) {
			console.error('Error incrementando versión del workflow:', error)
		}
	}

	/**
	 * Copia un directorio recursivamente
	 */
	private async copyDirectory(source: string, target: string) {
		try {
			await fs.mkdir(target, { recursive: true })

			const entries = await fs.readdir(source, { withFileTypes: true })

			for (const entry of entries) {
				const sourcePath = path.join(source, entry.name)
				const targetPath = path.join(target, entry.name)

				if (entry.isDirectory()) {
					await this.copyDirectory(sourcePath, targetPath)
				} else {
					await fs.copyFile(sourcePath, targetPath)
				}
			}
		} catch (error) {
			console.error(`Error copiando directorio ${source} a ${target}:`, error)
			throw error
		}
	}

	/**
	 * Asegura que existe el directorio base de deploys
	 */
	private async ensureDeployDirectory() {
		try {
			await fs.mkdir(this.deployBasePath, { recursive: true })
		} catch (error) {
			console.error('Error creando directorio de deploys:', error)
		}
	}

	/**
	 * Obtiene información de un despliegue por ID
	 */
	async getDeploymentInfo(flowId: string) {
		try {
			const deploymentPath = path.join(this.deployBasePath, flowId)
			const flowJsonPath = path.join(deploymentPath, 'flow.json')

			// Verificar si existe el archivo flow.json
			await fs.access(flowJsonPath)

			const flowContent = await fs.readFile(flowJsonPath, 'utf-8')
			return JSON.parse(flowContent)
		} catch (error) {
			console.error(`Error obteniendo información del despliegue ${flowId}:`, error)
			return null
		}
	}

	/**
	 * Limpia archivos de despliegue obsoletos
	 */
	async cleanupOldDeployments(daysOld = 30) {
		try {
			const entries = await fs.readdir(this.deployBasePath, { withFileTypes: true })
			const cutoffDate = new Date()
			cutoffDate.setDate(cutoffDate.getDate() - daysOld)

			for (const entry of entries) {
				if (!entry.isDirectory()) continue

				const deploymentPath = path.join(this.deployBasePath, entry.name)
				const stats = await fs.stat(deploymentPath)

				if (stats.mtime < cutoffDate) {
					console.log(`Eliminando despliegue obsoleto: ${entry.name}`)
					await fs.rm(deploymentPath, { recursive: true, force: true })
				}
			}
		} catch (error) {
			console.error('Error limpiando despliegues obsoletos:', error)
		}
	}
}

// Exportar instancia singleton
export const deploymentQueueService = new DeploymentQueueService()
