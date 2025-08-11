import type { classDependencyInterface, IWorkerContext } from '@shared/interfaces'
import type { Worker } from '@worker/worker.js'
import { getSecret, listSecrets } from '../../../shared/engine/secret.engine.js'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import paths from 'node:path'
const require = createRequire(import.meta.url)

const __filename = fileURLToPath(import.meta.url)
const __dirname = paths.dirname(__filename)

export class ContextModule {
	el: Worker
	// logger: winston.Logger

	constructor(el: Worker) {
		this.el = el
	}

	private transformProjectForContext(project: typeof this.el.flow.project): IWorkerContext['project'] {
		if (!project) return undefined

		// Convertir el formato simplificado de transportConfig (string[])
		// al formato esperado por IProjectTransportConfigByType
		const transportType = project.transportType as any

		if (!transportType || transportType === 'none') {
			return {
				type: 'none' as const
			}
		}

		// Crear la configuración de transporte basada en el tipo
		const transportConfig: any = {}
		if (project.transportConfig) {
			// Convertir el array de strings a un objeto de configuración
			project.transportConfig.forEach((key) => {
				// Los valores reales vendrán de las variables de entorno
				const envVariable = `PROJECT_${transportType.toUpperCase()}_${key.toUpperCase()}`
				const value = process.env[envVariable]
				if (value) {
					transportConfig[key] = value
				}
			})
		}

		return {
			type: transportType,
			transportConfig
		} as IWorkerContext['project']
	}

	getContext(): IWorkerContext {
		return {
			project: this.transformProjectForContext(this.el.flow.project),
			info: this.el.flow.info,
			properties: this.el.flow.properties,
			currentNode: null,
			getEnvironment: (name: string) => this.el.flow.environment.find((e) => e === name),
			getSecrets: (name: string) => this.el.flow.secrets.find((s) => s === name),
			getMicroserviceModule: async ({ context, name }: { context: IWorkerContext; name: string }) => {
				// actual path
				const pathModule = paths.join(
					__dirname,
					'../../../shared/plugins/microservice/',
					`/${name.replace('.ts', '').replace('.js', '')}.js`
				)
				// Convert path to file URL for dynamic import
				const fileUrlModule = `file://${pathModule.replace(/\\/g, '/')}`
				const importedModule = await import(fileUrlModule)

				const module = new importedModule.default({ context })
				await module.connection()
				return Promise.resolve(module)
			}
		}
	}

	getDependencies(): classDependencyInterface {
		return {
			getRequire: async (name: string) => Promise.resolve(require(name)),
			getImport: async (name: string) => Promise.resolve(import(name)),

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
