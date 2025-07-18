import type { ICodeProperty, IPropertiesType } from '@shared/interfaces/workflow.properties.interface.js'
import type { IClassNode, classOnExecuteInterface, infoInterface } from '@shared/interfaces/class.interface.js'

interface IProperties extends IPropertiesType {
	mapping: ICodeProperty
	helperFunctions: ICodeProperty
}

export default class implements IClassNode<IProperties> {
	constructor(
		public dependencies: string[],
		public info: infoInterface,
		public properties: IProperties
	) {
		this.dependencies = []

		this.info = {
			name: 'Data Transformer',
			desc: 'Transforma datos mediante mapeo, filtrado y expresiones personalizadas',
			icon: '󰁪',
			group: 'Utilities',
			color: '#E67E22',
			connectors: {
				inputs: ['input'],
				outputs: ['output', 'error']
			}
		}

		this.properties = {
			// Propiedades específicas para mapeo
			mapping: {
				name: 'Definición de mapeo:',
				type: 'code',
				lang: 'json',
				value: `{
  "id": "{{input.data.id}}",
  "nombre": "{{input.data.nombre}}",
  "precio_con_iva": "{{input.data.precio}} * 1.21",
  "fecha_formateada": "formatDate({{input.data.fecha}})"
}`,
				show: true
			},
			// Funciones auxiliares disponibles
			helperFunctions: {
				name: 'Funciones auxiliares:',
				type: 'code',
				lang: 'js',
				value: `// Estas funciones auxiliares estarán disponibles en tus expresiones
function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString();
}`,
				show: true
			}
		}
	}

	async onExecute({ inputData, outputData }: classOnExecuteInterface) {
		try {
			const value = this.properties.mapping.value
			const obj = typeof value === 'string' ? JSON.parse(value) : value
			// Enviar el resultado transformado
			outputData('output', obj)
		} catch (error) {
			let message = 'Error al transformar los datos'
			if (error instanceof Error) message = error.message
			outputData('error', { error: message })
		}
	}

	// Métodos auxiliares para las transformaciones

	transformMap(data: any[], mappingStr: string, helperCode: string): any[] {
		try {
			const mapping = JSON.parse(mappingStr)
			const helperFunctions = this.evaluateHelperFunctions(helperCode)

			return data.map((item) => {
				const result: any = {}

				for (const [targetField, expression] of Object.entries(mapping)) {
					try {
						// Crear un contexto para evaluar la expresión
						const context = {
							item,
							...helperFunctions
						}

						// Evaluar la expresión en el contexto
						const valueFunction = new Function(...Object.keys(context), `return ${expression};`)

						result[targetField] = valueFunction(...Object.values(context))
					} catch (e) {
						result[targetField] = null
					}
				}

				return result
			})
		} catch (error) {
			let message = 'Error al transformar los datos'
			if (error instanceof Error) message = error.message
			throw new Error(message)
		}
	}

	transformFilter(data: any[], filterExpr: string, helperCode: string): any[] {
		try {
			const helperFunctions = this.evaluateHelperFunctions(helperCode)

			return data.filter((item) => {
				const context = {
					item,
					...helperFunctions
				}

				const filterFunction = new Function(...Object.keys(context), `return ${filterExpr};`)

				return filterFunction(...Object.values(context))
			})
		} catch (error) {
			let message = 'Error al transformar los datos'
			if (error instanceof Error) message = error.message
			throw new Error(message)
		}
	}

	transformProjection(data: any[], fieldsStr: string): any[] {
		try {
			const fields = JSON.parse(fieldsStr)

			if (!Array.isArray(fields)) {
				throw new Error('La lista de campos debe ser un array')
			}

			return data.map((item) => {
				const result: any = {}

				for (const field of fields) {
					if (field in item) {
						result[field] = item[field]
					}
				}

				return result
			})
		} catch (error) {
			let message = 'Error al transformar los datos'
			if (error instanceof Error) message = error.message
			throw new Error(message)
		}
	}

	transformGroup(data: any[], groupByField: string, aggregationsStr: string, helperCode: string): any {
		try {
			const helperFunctions = this.evaluateHelperFunctions(helperCode)
			const { groupBy } = helperFunctions

			// Agrupar los datos
			const groups = groupBy(data, groupByField)

			// Aplicar agregaciones
			const result: any = {}
			const aggregations = JSON.parse(aggregationsStr)

			for (const [groupKey, items] of Object.entries(groups)) {
				result[groupKey] = {}

				// Añadir los items del grupo
				result[groupKey].items = items

				// Aplicar las agregaciones
				for (const [aggName, aggExpression] of Object.entries(aggregations)) {
					try {
						const context = {
							items,
							...helperFunctions
						}

						const aggFunction = new Function(...Object.keys(context), `return ${aggExpression};`)

						result[groupKey][aggName] = aggFunction(...Object.values(context))
					} catch (e) {
						result[groupKey][aggName] = null
					}
				}
			}

			return result
		} catch (error) {
			let message = 'Error al transformar los datos'
			if (error instanceof Error) message = error.message
			throw new Error(message)
		}
	}

	transformCustom(data: any, customExpr: string): any {
		try {
			const customFunction = new Function('data', customExpr)
			return customFunction(data)
		} catch (error) {
			let message = 'Error al transformar los datos'
			if (error instanceof Error) message = error.message
			throw new Error(message)
		}
	}

	evaluateHelperFunctions(code: string): any {
		try {
			const helperFunction = new Function(`
        ${code}
        return {
          formatDate,
          sum,
          avg,
          count,
          min,
          max,
          groupBy
        };
      `)

			return helperFunction()
		} catch (error) {
			let message = 'Error al transformar los datos'
			if (error instanceof Error) message = error.message
			throw new Error(message)
		}
	}
}
