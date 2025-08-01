import type { IClassNode, newClassInterface } from '../interfaces/class.interface.js'
import type { IPropertiesType } from '@shared/interfaces/workflow.properties.interface.js'
import { glob } from 'glob'
import { fileURLToPath, pathToFileURL } from 'node:url'
import path from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const dirPath = path.join(__dirname, '../plugins/nodes/')
const files = glob.sync('**/index.js', { cwd: dirPath })

const nodesClass: { [key: string]: newClassInterface } = {}
const nodeUpdateProperties: { [key: string]: any } = {}
const nodeOnCredentials: { [key: string]: { credentials: IPropertiesType; class: any } } = {}

for (const file of files) {
	if (file && file.replace(/\\/g, '/').indexOf('/_') > -1) continue
	const type = file
		.replace(/\\/g, '/')
		.toString()
		.replace(`${dirPath.replace(/\\/g, '/')}/`, '')
		.split('/')
		.slice(0, -1)
		.join('/')
	const module = await import(pathToFileURL(path.resolve(dirPath, file)).href)
	const model = module.default

	try {
		const data = new model() as IClassNode

		// Guardar la función onUpdate
		if (data.onUpdateProperties) {
			nodeUpdateProperties[type] =
				`export ${data.onUpdateProperties.toString().replace('onUpdateProperties({', 'function onUpdateProperties({')}`
		}

		// Guardar la función onDeploy
		if (data.credentials) {
			nodeOnCredentials[type] = {
				credentials: data.credentials,
				class: data.onCredential
			}
		}

		nodesClass[type] = {
			type,
			info: data.info,
			group: data.info.group,
			dependencies: data.dependencies,
			properties: data.properties,
			credentials: data.credentials,
			class: model
		}
	} catch (error) {
		console.log(`Error al cargar el nodo ${file}`, error)
	}
}

export function getNodeInfo() {
	return Object.fromEntries(
		Object.entries(nodesClass).map(([key, value]) => [
			key,
			{ ...value, typeDescription: Array.isArray(value.group) ? value.group.join('/') : value.group }
		])
	)
}

export function getNodeClassDependencies(node: string): string[] | null {
	return nodesClass[node]?.dependencies || null
}

export function getNodeOnUpdateProperties(node: string): string {
	return nodeUpdateProperties[node]
}

export function getNodeCredentials(node?: string): { properties?: IPropertiesType; class?: any } | { keys: () => any } {
	if (node) {
		return nodeOnCredentials[node]
	}
	return Object.keys(nodeOnCredentials).map((key) => {
		return {
			name: key,
			info: nodesClass[key].info
		}
	})
}
