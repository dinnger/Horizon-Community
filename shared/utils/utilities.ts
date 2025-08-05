import type { INodeFull, IWorkflowSaveFull } from '@shared/interfaces/standardized'
import fs from 'node:fs'

export function loadWorkflowFile(path: string): IWorkflowSaveFull {
	const data = fs.readFileSync(path, 'utf8')
	if (!data) {
		throw new Error('No se encontro el archivo de workflow')
	}
	return convertJson(data)
}

export function convertJson(json: string | object) {
	try {
		return typeof json === 'string' ? JSON.parse(json) : json
	} catch (error) {
		console.log('Error en la conversión de JSON', json)
		throw error
	}
}

/**
 * Extracts values from an object using a template string with double curly braces notation.
 * @param value - Template string containing expressions in double curly braces (e.g. "Hello {{user.name}}")
 * @param object - Source object to extract values from
 * @returns String with all expressions replaced by their corresponding values from the object
 * @example
 * const obj = { user: { name: "John" } };
 * utilsExtractObject("Hello {{user.name}}", obj); // Returns "Hello John"
 */
export function utilsExtractObject(value: string, object: any) {
	return value.replace(/\{\{([^{}]+)\}\}/g, (_, path) => {
		const result = path.split('.').reduce((o: any, k: any) => o?.[k], object)
		return typeof result === 'object' && result !== null ? JSON.stringify(result) : (result ?? '')
	})
}

export function utils_standard_name(text: string) {
	let lower = text.replace(/[A-Z]/g, (val: string) => {
		return val.toLowerCase()
	})
	lower = lower.replace(/\ \ /g, ' ')
	lower = lower.replace(/\ /g, '_')
	return lower
}

export function utils_validate_name({ id, text, nodes }: { id?: number; text: string; nodes: INodeFull[] }): string {
	const node_name = id ? `${text.toLowerCase()}_${id}` : text.toLowerCase()
	const exist = nodes.find((f) => f.name.toLowerCase() === node_name)
	const id_new = id ? id + 1 : 1
	if (exist) return utils_validate_name({ id: id_new, text, nodes })
	if (!id) return text
	return `${text}_${id}`
}

export function utils_map_json({ prefix, json }: { prefix?: string; json: string }): object {
	const list: { [key: string]: any } = {}
	const mapJson = (data: any, prev: string | null = null) => {
		for (const [key, value] of Object.entries(data)) {
			const iKey: string | null = prev ? `${prev}_${key.toUpperCase()}` : key.toUpperCase()
			if (typeof value === 'object') {
				mapJson(value, iKey)
			} else {
				list[iKey] = value
			}
		}
	}
	if (typeof json === 'object') {
		mapJson(json, prefix)
	} else {
		try {
			mapJson(JSON.parse(json), prefix)
		} catch (error) {}
	}
	return list
}
