import fs from 'node:fs'
import type { IWorkerContext } from '@shared/interfaces/context.interface.js'
import type { classBaseEnvironmentInterface, classDependencyInterface } from '@shared/interfaces/class.interface.js'
import type { Express } from 'express'
import type { IWorkflowFull, IWorkflowSaveFull } from '@shared/interfaces/standardized.js'
import { VariableModule } from './modules/variables/index.js'
import { NodeModule } from './modules/workflow/index.js'
import { CoreModule } from './modules/core/index.js'
import { envs } from './config/envs.js'
import { CommunicationModule } from './modules/communication/index.js'
import { ContextModule } from './modules/context/index.js'
import { loadWorkflowFile } from '@shared/utils/utilities.js'
// -----------------------------------------------------------------------------
// Base
// -----------------------------------------------------------------------------
let PATH_FLOW = './data/workflows/'

export const info = {}
export class Worker {
	app: Express
	workflowId: string
	flow: IWorkflowSaveFull
	context: IWorkerContext
	dependencies: classDependencyInterface
	environment: classBaseEnvironmentInterface

	index: number | null
	isDev: boolean

	coreModule: CoreModule
	nodeModule: NodeModule
	communicationModule: CommunicationModule
	variableModule: VariableModule

	constructor({
		app,
		uidFlow,
		isDev,
		index
	}: {
		app: Express
		uidFlow: string
		isDev: boolean
		index: number
	}) {
		// Sanitize flow
		if (uidFlow?.indexOf('/') > -1) PATH_FLOW = ''

		this.workflowId = uidFlow
		this.flow = loadWorkflowFile(this.workflowId ? `${PATH_FLOW}${this.workflowId}/flow.json` : 'flow.json')
		this.app = app
		this.isDev = isDev
		this.index = index

		this.context = new ContextModule(this).getContext()
		this.dependencies = new ContextModule(this).getDependencies()
		this.environment = {
			baseUrl: this.context.properties?.basic?.router || '',
			serverUrl: envs.SERVER_URL,
			isDev,
			isSubFlow: false,
			subFlowBase: '',
			subFlowParent: ''
		}
		this.communicationModule = new CommunicationModule(this)
		this.variableModule = new VariableModule(this)
		this.coreModule = new CoreModule(this)
		this.nodeModule = new NodeModule(this)

		// Initialize modules
		this.initWorker()

		// Iniciar el server
		this.communicationModule.server.sendReady()
	}

	async initWorker() {
		// Nodes
		for (const key of Object.keys(this.flow.nodes)) {
			const node = this.flow.nodes[key]
			const newNode = this.nodeModule.addNode({
				...node,
				id: key
			})
		}
		for (const key of Object.keys(this.flow.connections)) {
			const connection = this.flow.connections[key as any]
			this.nodeModule.addEdge({
				...connection
			})
		}

		// =========================================================================
		// ENVS
		// =========================================================================
		if (this.isDev) {
			await this.variableModule.initVariable({ uidFlow: this.workflowId })
		}
		await this.variableModule.checkWorkflowEnvironment({ flow: this.flow })
		// =========================================================================
	}
}
