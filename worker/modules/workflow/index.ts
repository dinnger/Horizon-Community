import type { IPropertiesType } from '@shared/interfaces/workflow.properties.interface.js'
import type { Worker } from '../../worker.js'
import { getNodeInfo } from '../../../shared/engine/node.engine.js'
import { v4 as uuidv4 } from 'uuid'
import type {
	INodeWorker,
	INodeConnection,
	IWorkflowFull,
	IWorkflowExecution,
	IWorkflowDependencies
} from '@shared/interfaces/standardized.js'

// Interfaces legacy - usar las nuevas interfaces estandarizadas

export interface IWorkflow extends IWorkflowFull {}

export interface IWorkflowExecutionInterface extends IWorkflowExecution {}

export class NodeModule {
	el: Worker

	nodesInit: INodeWorker | null = null
	nodes: { [key: string]: INodeWorker } = {}
	nodesType = new Map<string, Set<string>>()
	nodesClass = getNodeInfo()
	connections: {
		[key: string]: {
			[key: string]: { idNodeDestiny: string; connectorDestinyName: string }[]
		}
	} = {}
	connectionsInputs: { [key: string]: Set<string> } = {}
	connectionsOutputs: { [key: string]: Set<string> } = {}

	dependencies: IWorkflowDependencies = {
		secrets: new Set(),
		credentials: new Set()
	}

	constructor(el: Worker) {
		this.el = el
	}

	/**
	 * Adds a new node to the system.
	 *
	 * @param {Object} params - The parameters for adding a node.
	 * @param {string} [params.id] - The unique identifier for the node. If not provided, a new UUID will be generated.
	 * @param {string} params.name - The name of the node.
	 * @param {string} params.className - The class name of the node.
	 * @param {Object} params.pos - The position of the node.
	 * @param {number} params.pos.x - The x-coordinate of the node's position.
	 * @param {number} params.pos.y - The y-coordinate of the node's position.
	 * @param {IPropertiesType} [params.properties={}] - The properties of the node.
	 * @param {Object} [params.meta] - Additional metadata for the node.
	 * @returns {INode} The newly added node.
	 * @throws {Error} If the class name does not exist in nodesClass.
	 */
	addNode(data: Omit<INodeWorker, 'class'>) {
		if (!this.el) return null
		if (!this.nodesClass[data.type]) {
			console.error(`No existe el nodo ${data.type}`)
		}
		data.id = data.id || uuidv4()

		const prop: { [key: string]: any } = {}
		if (this.nodesClass[data.type]?.properties) {
			for (const [key, value] of Object.entries(this.nodesClass[data.type].properties) as [string, any][]) {
				prop[key] = JSON.parse(JSON.stringify(value))
				if (value.type === 'list') {
					prop[key].object = value.object
				}
				if (data.properties?.[key]?.value) {
					prop[key].value = data.properties[key].value
				}
			}
		}

		// Determinando si la propiedad secret o credencial
		for (const [key, value] of Object.entries(prop)) {
			if (!value.value || value?.value.toString().trim() === '') continue

			// Secrets
			if (value.type === 'secret') {
				this.dependencies.secrets.add({
					idNode: data.id,
					value: value.value,
					type: data.type,
					secret: value.value
				})
			}
			// Credentials
			if (value.type === 'credential') {
				this.dependencies.credentials.add({
					idNode: data.id,
					type: data.type,
					value: value.value,
					credentials: Array.isArray(data.credentials) ? data.credentials : []
				})
			}
		}

		this.nodes[data.id] = {
			...data,
			properties: prop,
			class: this.nodesClass[data.type]?.class
		}

		if (!this.nodesType.has(data.type)) {
			this.nodesType.set(data.type, new Set())
		}
		this.nodesType.get(data.type)?.add(data.id)
		if (this.nodes[data.id].type === 'workflow_init') this.nodesInit = this.nodes[data.id]

		return this.nodes[data.id]
	}

	/**
	 * Adds an edge to the connections object, linking an origin node's output to a destination node's input.
	 *
	 * @param {Object} params - The parameters for adding an edge.
	 * @param {string} params.id_node_origin - The ID of the origin node.
	 * @param {string} params.output - The output of the origin node.
	 * @param {string} params.id_node_destiny - The ID of the destination node.
	 * @param {string} params.input - The input of the destination node.
	 */
	addEdge(data: INodeConnection) {
		if (!this.el) return
		const { id, connectorOriginName, idNodeOrigin, idNodeDestiny, connectorDestinyName, pointers, colorGradient, isFocused, isNew } = data
		if (!idNodeOrigin || !idNodeDestiny) return
		if (!this.connections[idNodeOrigin]) this.connections[idNodeOrigin] = {}
		if (!this.connections[idNodeOrigin][connectorOriginName]) this.connections[idNodeOrigin][connectorOriginName] = []
		this.connections[idNodeOrigin][connectorOriginName].push({ idNodeDestiny, connectorDestinyName })

		// Guardar los nodos que se conectan a un nodo
		// if (!this.connectionsInputs[id_node_destiny]) this.connectionsInputs[id_node_destiny] = new Set()
		// if (!this.connectionsOutputs[idNodeOrigin]) this.connectionsOutputs[idNodeOrigin] = new Set()
		// this.connectionsInputs[id_node_destiny].add(idNodeOrigin)
		// this.connectionsOutputs[idNodeOrigin].add(id_node_destiny)
	}
}
