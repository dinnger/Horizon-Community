import type { IWorkerContext } from '@shared/interfaces'
import type { Worker } from '@worker/worker.js'

export class ContextModule {
	el: Worker
	// logger: winston.Logger

	constructor(el: Worker) {
		this.el = el
	}

	getContext(): IWorkerContext {
		return {
			info: this.el.flow.info,
			properties: this.el.flow.properties,
			getEnvironment: (name: string) => this.el.flow.environment.find((e) => e === name),
			getSecrets: (name: string) => this.el.flow.secrets.find((s) => s === name),
			currentNode: null
		}
	}
}
