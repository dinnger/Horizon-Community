import type { classDependencyInterface, IWorkerContext } from '@shared/interfaces'
import type { Worker } from '@worker/worker.js'
import { getSecret, listSecrets } from '../../../shared/engine/secret.engine.js'
import { createRequire } from 'node:module'
import paths from 'node:path'
const require = createRequire(import.meta.url)

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

	getDependencies(): classDependencyInterface {
		return {
			getRequire: async (name: string) => Promise.resolve(require(name)),
			getModule: async ({ path, name }: { path: string; name: string }) => {
				// actual path
				if (path.startsWith('/')) path = path.slice(1)
				const pathModule = paths.join(
					__dirname,
					'../../../shared/plugins/nodes/',
					`/${path}`,
					`/${name.replace('.ts', '').replace('.js', '')}.js`
				)
				// Convert path to file URL for dynamic import
				const fileUrlModule = `file://${pathModule.replace(/\\/g, '/')}`
				const importedModule = await import(fileUrlModule)
				return Promise.resolve(importedModule.default)
			},
			getSecret: ({ type, subType, name }: { type: string; subType?: string; name?: string }) =>
				Promise.resolve(getSecret({ type, subType, name })),
			listSecrets: ({ type, subType }: { type: string; subType?: string }) => Promise.resolve(listSecrets({ type, subType }))
		}
	}

	getCredential() {
		return {
			getCredential: (id: string) => {
				const credential = this.el.variableModule.variablesValue.get(id)
				if (!credential) return null
				return credential.values
			}
		}
	}
}
