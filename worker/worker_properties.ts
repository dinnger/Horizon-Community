import type { IWorkflowExecutionContextInterface } from '@shared/interfaces/workflow.execute.interface.js'
import type { propertiesType } from '@shared/interfaces/workflow.properties.interface.js'
import type { INodeWorker } from '@shared/interfaces/standardized.js'
import type { Worker } from './worker.js'
import { proprietaryFunctions } from './worker_properties_proprietary.js'
import { createRequire } from 'node:module'
import { variablesValue } from '../shared/store/variables.store.js'
const require = createRequire(import.meta.url)
const Sandbox = require('@nyariv/sandboxjs')

const MAX_ITERATIONS = 100
// const omitChangeProperty = ['/form']

export class initProperties {
	el: Worker
	node: INodeWorker
	nodes: { [key: string]: INodeWorker }
	input: object
	context: IWorkflowExecutionContextInterface
	executeData: Map<string, { data: object; meta?: object; time: number }>
	regexInit: RegExp
	currentObject: { [key: string]: any }

	constructor({
		el,
		node,
		nodes,
		input,
		context,
		executeData,
		variables = {}
	}: {
		el: Worker
		node: INodeWorker
		nodes: { [key: string]: INodeWorker }
		input: object
		context: IWorkflowExecutionContextInterface
		executeData: Map<string, { data: object; meta?: object; time: number }>
		variables?: object
	}) {
		this.el = el
		this.node = node
		this.nodes = nodes
		this.input = input
		this.context = context
		this.executeData = executeData
		this.regexInit = /\{\{((?:(?!\{\{|\}\}).)+)\}\}/g
		this.currentObject = {}
		this.init()
	}

	init() {
		this.currentObject = {
			env: {
				...variablesValue
			},
			input: this.input
		}
		for (const key of this.executeData.keys()) {
			const value = this.executeData.get(key)
			if (!value) continue
			if (value.meta)
				this.currentObject[this.nodes[key].name] = {
					data: value.data,
					meta: value.meta
				}
			else this.currentObject[this.nodes[key].name] = { data: value.data }
		}
	}

	setInput(data: object) {
		this.currentObject.input = { data }
		return this
	}

	// ============================================================================
	// ================================= Replace ==================================
	// ============================================================================
	replaceProperty(node: string, regCoincidencia: string, object = null) {
		const reg = regCoincidencia.slice(2, -2)
		let valideData = true

		try {
			const sandbox = new Sandbox.default()
			const value_horizon_property = null
			const scope = {
				value_horizon_property,
				...this.currentObject,
				...proprietaryFunctions()
			}
			const evaluate = `value_horizon_property = ${reg}`
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
			return undefined
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

	analizar(node: string, property: { [key: string]: any }, firstAnalizar: boolean) {
		const isList = firstAnalizar && property.type === 'list'
		const obj = Object.entries(property)
			.filter(([_, f]) => !f.type || !['options'].includes(f.type))
			.filter(([key]) => !firstAnalizar || !isList || (isList && key !== 'object'))
		for (const [key, value] of obj) {
			if (value.evaluation?.active === false) continue

			if (typeof value === 'object') {
				this.analizar(node, property[key], false)
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
					const valor = this.replaceProperty(node, match)
					if (typeof valor === 'object' && property[key] === match) {
						property[key] = valor
					} else {
						// Corrección de $ que automáticamente se borra un segundo $ si se agregaba
						const fixedValue = (text: string) => text.replace(/\$/g, '$$$$')
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
	analizarProperties(node: string, property: propertiesType) {
		const textProperties: propertiesType = JSON.parse(JSON.stringify(property))
		this.analizar(node, textProperties, true)
		return textProperties
	}

	analizarString(node: string, text: string) {
		const textProperties = JSON.parse(JSON.stringify({ data: text }))
		this.analizar(node, textProperties, true)
		return textProperties.data
	}
}
