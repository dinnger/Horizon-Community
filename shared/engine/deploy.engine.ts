import type { newClassDeployInterface } from '../interfaces/deployment.interface.js'
import { glob } from 'glob'
import { fileURLToPath, pathToFileURL } from 'node:url'
import path from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const dirPath = path.join(__dirname, '../plugins/deploys/')
const files = glob.sync('*.js', { cwd: dirPath })

const pluginsRegistry: { [key: string]: newClassDeployInterface } = {}

const loadPlugins = async () => {
	for (const file of files) {
		if (file && file.indexOf('/_') > -1) continue

		const name = file.replace(/\\/g, '/').split('/').pop()?.replace('.ts', '').replace('.js', '').toLocaleLowerCase() || ''

		const module = await import(pathToFileURL(path.resolve(dirPath, file)).href)
		const model = module.default
		try {
			const data = new model()
			pluginsRegistry[`${name}`] = {
				name,
				info: data.info,
				properties: data.properties,
				class: model
			}
		} catch (error) {}
	}
}

// Initialize plugins on module load
loadPlugins()

export function getDeploysClass() {
	return Object.fromEntries(
		Object.entries(pluginsRegistry).map(([key, value]) => [
			key,
			{
				name: value.name,
				info: value.info,
				properties: { ...value.properties },
				class: value.class
			}
		])
	)
}
