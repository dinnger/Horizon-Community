import type { IWorkerContext } from '@shared/interfaces/context.interface.js'
import type { propertiesType } from '@shared/interfaces/workflow.properties.interface.js'
import type { INodeWorker } from '@shared/interfaces/standardized.js'
import type { Worker } from './worker.js'
import { proprietaryFunctions } from './worker_properties_proprietary.js'
import { createRequire } from 'node:module'
import { PluginDoubleDot } from './modules/properties/doubleDot.js'
import { PluginMicroservice } from './modules/properties/microservice.js'
const require = createRequire(import.meta.url)
const Sandbox = require('@nyariv/sandboxjs')

const MAX_ITERATIONS = 100
// const omitChangeProperty = ['/form']

export class initProperties {
	el: Worker
	node: INodeWorker
	nodes: { [key: string]: INodeWorker }
	input: object
	context: IWorkerContext
	executeData: Map<string, { data: object; meta?: object; time: number }>
	regexInit: RegExp
	currentObject: { [key: string]: any }

	constructor({
		el,
		node,
		input,
		executeData
	}: {
		el: Worker
		node: INodeWorker
		input: object
		executeData: Map<string, { data: object; meta?: object; time: number }>
		variables?: object
	}) {
		this.el = el
		this.node = node
		this.nodes = this.el.nodeModule.nodes
		this.input = input
		this.context = this.el.context
		this.executeData = executeData
		this.regexInit = /\{\{((?:(?!\{\{|\}\}).)+)\}\}/g
		this.currentObject = {}
		this.init()
	}

	init() {
		this.currentObject = {
			env: {},
			input: this.input
		}
		for (const key of this.executeData.keys()) {
			const value = this.executeData.get(key)
			if (!value) continue
			if (value.meta)
				this.currentObject[this.nodes[key].info.name] = {
					data: value.data,
					meta: value.meta
				}
			else this.currentObject[this.nodes[key].info.name] = { data: value.data }
		}
	}

	setInput(data: object) {
		this.currentObject.input = { data }
		return this
	}

	// ============================================================================
	// ================================= Replace ==================================
	// ============================================================================
	async replaceProperty(node: string, regCoincidencia: string) {
		const reg = regCoincidencia.slice(2, -2)
		let valideData = true

		try {
			// Preparar el scope inicial
			const sandbox = new Sandbox.default()
			const value_horizon_property = null
			const scope = {
				value_horizon_property,
				...this.currentObject,
				...proprietaryFunctions()
			}

			// Procesar expresiones con doble punto antes de evaluar
			const processedExpression = {
				value: reg
			}

			// Procesar de forma iterativa hasta que no haya más cambios
			let previousValue = ''
			let iterations = 0
			const maxIterations = 10

			while (processedExpression.value !== previousValue && iterations < maxIterations) {
				previousValue = processedExpression.value
				iterations++

				// Plugin de doble punto - resolver propiedades recursivas primero
				const pluginDoubleDot = new PluginDoubleDot({ currentObject: this.currentObject, processedExpression, scope })
				await pluginDoubleDot.eval()

				// Plugin de microservice - ejecutar después de resolver propiedades
				const pluginMicroservice = new PluginMicroservice({
					context: this.context,
					currentObject: this.currentObject,
					processedExpression,
					scope
				})
				await pluginMicroservice.eval()
			}

			// ============================================================================

			const evaluate = `value_horizon_property = ${processedExpression.value}`
			const exec = sandbox.compile(evaluate)
			exec(scope).run()
			if (scope.value_horizon_property === null) return null
			if (typeof scope.value_horizon_property === 'undefined') return ''
			return scope.value_horizon_property
		} catch (error) {
			let message = 'Error'
			if (error instanceof Error) message = error.message
			console.log(node, '\x1b[41m Error Property \x1b[0m', reg, message)
			valideData = false
			return ''
		}
	}

	searchAllObject(objeto: { [key: string]: any }, claveABuscar: string, accumulator = ''): string | undefined {
		for (const key in objeto) {
			if (key === claveABuscar) {
				return accumulator // Si encontramos la clave, retornamos su valor
			}

			if (typeof objeto[key] === 'object') {
				const resultado = this.searchAllObject(objeto[key], claveABuscar, accumulator === '' ? key : `${accumulator}.${key}`) // Llamada recursiva si el valor es otro objeto
				if (resultado !== undefined) {
					return resultado // Si encontramos el valor en la llamada recursiva, lo retornamos
				}
			}
		}
		return undefined
	}

	// Función para buscar recursivamente una propiedad en un objeto
	findPropertyRecursive(obj: any, propertyName: string): any {
		if (obj === null || typeof obj !== 'object') {
			return undefined
		}

		// Si encontramos la propiedad directamente
		if (Object.prototype.hasOwnProperty.call(obj, propertyName)) {
			return obj[propertyName]
		}

		// Si es un array, buscar en cada elemento
		if (Array.isArray(obj)) {
			for (const item of obj) {
				const result = this.findPropertyRecursive(item, propertyName)
				if (result !== undefined) {
					return result
				}
			}
		}

		// Buscar recursivamente en todas las propiedades del objeto
		for (const key in obj) {
			if (Object.prototype.hasOwnProperty.call(obj, key)) {
				const result = this.findPropertyRecursive(obj[key], propertyName)
				if (result !== undefined) {
					return result
				}
			}
		}

		return undefined
	}

	// Función mejorada para buscar múltiples propiedades recursivamente
	findPropertyPath(obj: any, propertyPath: string[]): any {
		if (obj === null || typeof obj !== 'object' || propertyPath.length === 0) {
			return undefined
		}

		const [currentProperty, ...remainingPath] = propertyPath

		// Si encontramos la propiedad directamente
		if (Object.prototype.hasOwnProperty.call(obj, currentProperty)) {
			if (remainingPath.length === 0) {
				return obj[currentProperty]
			}
			return this.findPropertyPath(obj[currentProperty], remainingPath)
		}

		// Si es un array, buscar en cada elemento
		if (Array.isArray(obj)) {
			for (const item of obj) {
				// Primero intentar encontrar la propiedad actual en este elemento
				if (typeof item === 'object' && item !== null && Object.prototype.hasOwnProperty.call(item, currentProperty)) {
					if (remainingPath.length === 0) {
						return item[currentProperty]
					}
					const result = this.findPropertyPath(item[currentProperty], remainingPath)
					if (result !== undefined) {
						return result
					}
				}
				// Si no la encontramos directamente, buscar recursivamente
				const result = this.findPropertyPath(item, propertyPath)
				if (result !== undefined) {
					return result
				}
			}
		}

		// Buscar recursivamente en todas las propiedades del objeto
		for (const key in obj) {
			if (Object.prototype.hasOwnProperty.call(obj, key)) {
				const result = this.findPropertyPath(obj[key], propertyPath)
				if (result !== undefined) {
					return result
				}
			}
		}

		return undefined
	}

	// Función para recopilar todos los valores de una propiedad en arrays y objetos
	findAllPropertyValues(obj: any, propertyName: string): any[] {
		const results: any[] = []

		if (obj === null || typeof obj !== 'object') {
			return results
		}

		// Si encontramos la propiedad directamente
		if (Object.prototype.hasOwnProperty.call(obj, propertyName)) {
			results.push(obj[propertyName])
		}

		// Si es un array, buscar en cada elemento
		if (Array.isArray(obj)) {
			for (const item of obj) {
				results.push(...this.findAllPropertyValues(item, propertyName))
			}
		} else {
			// Buscar recursivamente en todas las propiedades del objeto
			for (const key in obj) {
				if (Object.prototype.hasOwnProperty.call(obj, key)) {
					results.push(...this.findAllPropertyValues(obj[key], propertyName))
				}
			}
		}

		return results
	}

	async analizar(node: string, property: { [key: string]: any }, firstAnalizar: boolean) {
		const isList = firstAnalizar && property.type === 'list'
		const obj = Object.entries(property)
			.filter(([_, f]) => !f.type || !['options'].includes(f.type))
			.filter(([key]) => !firstAnalizar || !isList || (isList && key !== 'object'))
		for (const [key, value] of obj) {
			if (value.evaluation?.active === false) continue

			if (typeof value === 'object') {
				await this.analizar(node, property[key], false)
			} else {
				const evalAll = property.evaluation?.all
				if (evalAll && key === 'value') {
					property[key] = `{{${property[key]}}}`
				}
				// const evalValue =
				// 	evalAll && key === 'value' ? `{{${property[key]}}}` : property[key]
				let iterations = 0
				// do {
				try {
					if (typeof property[key] !== 'string' || !property[key].includes('{{') || !property[key].includes('}}')) {
						// Si es posible cambiar el valor a json
						try {
							if (key === 'value') {
								property[key] = JSON.parse(property[key])
							}
						} catch (error) {}
						continue
					}
				} catch (error) {
					let message = 'Error'
					if (error instanceof Error) message = error.message
					console.log(node, '\x1b[41m Error \x1b[0m', message)
					continue
				}
				const matchReg = property[key].match(this.regexInit)
				if (!matchReg) continue

				// Verificar si se alcanzó el máximo de iteraciones
				iterations++
				if (iterations > MAX_ITERATIONS) {
					// error
					console.log(node.toUpperCase(), `\x1b[41m Error \x1b[0m  Iteraciones Máximas Property:  [${key}] `)
					continue
				}
				for (const match of matchReg) {
					const valor = await this.replaceProperty(node, match)
					if (typeof valor === 'object' && property[key] === match) {
						property[key] = valor
					} else {
						// Corrección de $ que automáticamente se borra un segundo $ si se agregaba
						const fixedValue = (text: string) => text.replace(/\$/g, '$$$$').replace(/\"/g, '\\"').replace(/\n/g, '\\n')
						const val = typeof valor === 'object' ? JSON.stringify(valor) : typeof valor === 'string' ? fixedValue(valor) : valor
						// console.log(properties[key] === match, key, properties, match)
						property[key] = evalAll ? val : val === undefined ? val : property[key].replace(match, val)
					}
				}

				// Conversion de string a objeto
				try {
					if (key === 'value') {
						property[key] = JSON.parse(property[key])
					}
				} catch (error) {}
			}
		}
	}

	// Remplazando valores en ciclos
	async analizarProperties(node: string, property: propertiesType) {
		const textProperties: propertiesType = JSON.parse(JSON.stringify(property))
		await this.analizar(node, textProperties, true)
		return textProperties
	}

	async analizarString(node: string, text: string) {
		const textProperties = JSON.parse(JSON.stringify({ data: text }))
		await this.analizar(node, textProperties, true)
		return textProperties.data
	}
}
