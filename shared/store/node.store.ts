import fs from 'node:fs'
import { glob } from 'glob'
import type { newClassInterface } from '../interfaces/class.interface.js'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const dirPath = path.join(__dirname, '../plugins/nodes/')
const files = glob.sync('**/index.js', { cwd: dirPath })
const filesOnCreate = glob.sync('**/onCreate.js', { cwd: dirPath })

const nodesClass: { [key: string]: newClassInterface } = {}
const nodeOnCreate: { [key: string]: any } = {}

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
		const data = new model()
		nodesClass[type] = {
			type,
			info: data.info,
			group: data.info.group,
			dependencies: data.dependencies,
			properties: data.properties,
			credentials: data.credentials,
			credentialsActions: data.credentialsActions,
			class: model
		}
	} catch (error) {
		console.log(`Error al cargar el nodo ${file}`, error)
	}
}

for (const file of filesOnCreate) {
	const type = file
		.replace(/\\/g, '/')
		.toString()
		.replace(`${dirPath.replace(/\\/g, '/')}/`, '')
		.split('/')
		.slice(0, -1)
		.join('/')
	try {
		nodeOnCreate[type] = fs.readFileSync(path.resolve(dirPath, file), 'utf8')
	} catch (error) {
		console.log(`Error al cargar el nodo ${file}`, error)
	}
}

export function getNodeClass() {
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

export function getNodeOnCreate(node: string): string {
	return nodeOnCreate[node]
}
