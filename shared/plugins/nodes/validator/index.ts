import type { IClassNode, classOnCreateInterface, classOnExecuteInterface, infoInterface } from '@shared/interfaces/class.interface.js'
import type { IPropertiesType } from '@shared/interfaces/workflow.properties.interface.js'

export default class implements IClassNode {
	// ===============================================
	// Dependencias
	// ===============================================
	// #pk ajv
	// #pk ajv-errors
	// #pk ajv-formats
	// ===============================================
	constructor(
		public dependencies: string[],
		public info: infoInterface,
		public properties: IPropertiesType
	) {
		this.dependencies = ['ajv', 'ajv-errors', 'ajv-formats', 'ajv-i18n']

		this.info = {
			name: 'Validación',
			desc: 'Valida datos usando esquema JSON (AJV)',
			icon: '󰒉',
			group: 'Utilities',
			color: '#E67E22',
			connectors: {
				inputs: ['input'],
				outputs: ['valid', 'invalid', 'error']
			}
		}

		this.properties = {
			inputPath: {
				name: 'Ruta de datos de entrada:',
				type: 'string',
				value: '',
				placeholder: 'Ej: data (vacío para usar todo)'
			},
			validationSchema: {
				name: 'Esquema de validación (AJV):',
				type: 'code',
				lang: 'json',
				value: `{
  "type": "object",
  "properties": {
    "nombre": { "type": "string" },
    "edad": { "type": "number" },
    "email": { "type": "string", "format": "email" }
  },
  "required": ["nombre", "edad", "email"],
  "additionalProperties": false
}`,
				size: 6
			},
			errorDetails: {
				name: 'Incluir detalles completos del error:',
				type: 'switch',
				value: true
			},
			customKeywords: {
				name: 'Keywords personalizados:',
				type: 'code',
				lang: 'js',
				value: `// Ejemplo - validación de rango de fechas
// ajv.addKeyword({
//   keyword: "dateRangeWithinYear",
//   type: "array",
//   validate: function(schema, data) {
//     if (!Array.isArray(data) || data.length !== 2) return false;
//     const [date1, date2] = data;
//     const oneYearInMs = 365 * 24 * 60 * 60 * 1000;
//     return Math.abs(date2 - date1) <= oneYearInMs;
//   },
//   errors: false
// });`,
				size: 5
			},
			advancedOptions: {
				name: 'Opciones avanzadas:',
				type: 'switch',
				value: false
			},
			customErrorMessages: {
				name: 'Mensajes de error personalizados:',
				type: 'switch',
				value: true,
				show: false
			},
			globalErrorMessages: {
				name: 'Mensajes de error globales:',
				type: 'code',
				lang: 'json',
				value: `{
  "type": "El tipo del campo $$ no corresponde",
  "required": "El campo $$ es requerido",
  "additionalProperties": "La propiedad $$ no está definida"
}`,
				show: false
			}
		}
	}

	async onCreate({ context }: classOnCreateInterface): Promise<void> {
		// Mostrar u ocultar opciones avanzadas
		const showAdvanced = this.properties.advancedOptions.value === true
		this.properties.customErrorMessages.show = showAdvanced
		this.properties.globalErrorMessages.show = showAdvanced && this.properties.customErrorMessages.value === true
	}

	async onExecute({ inputData, outputData, dependency }: classOnExecuteInterface): Promise<void> {
		try {
			if (!inputData || !inputData.data) {
				throw new Error('No se encontraron datos en la entrada')
			}

			// Obtener dependencias
			const Ajv = await dependency.getRequire('ajv')
			const ajvErrors = await dependency.getRequire('ajv-errors')
			const ajvFormats = await dependency.getRequire('ajv-formats')
			const localize = await dependency.getRequire('ajv-i18n')

			// Crear instancia de AJV con opciones
			const ajv = new Ajv({
				allErrors: true,
				verbose: this.properties.errorDetails.value === true
			})

			// Agregar soporte para formatos y mensajes de error personalizados
			ajvFormats(ajv)
			ajvErrors(ajv)

			// Obtener los datos de entrada desde la ruta especificada o usar todos los datos
			let inputValue: any = inputData.data
			if (this.properties.inputPath.value) {
				const path = String(this.properties.inputPath.value).split('.')
				let currentValue: any = inputData.data

				for (const key of path) {
					if (currentValue && typeof currentValue === 'object' && key in currentValue) {
						currentValue = currentValue[key]
					} else {
						throw new Error(`Ruta de entrada inválida: ${this.properties.inputPath.value}`)
					}
				}

				inputValue = currentValue
			}

			// Parsear el esquema de validación
			let validationSchema: any
			try {
				validationSchema = JSON.parse(String(this.properties.validationSchema.value))
			} catch (error) {
				throw new Error(`Error al parsear el esquema de validación: ${(error as Error).message}`)
			}

			// Aplicar keywords personalizados si hay código
			const customKeywordsCode = String(this.properties.customKeywords.value).trim()
			if (customKeywordsCode && !customKeywordsCode.startsWith('//')) {
				try {
					// Crear una función segura para ejecutar el código
					// eslint-disable-next-line no-new-func
					const applyCustomKeywords = new Function('ajv', customKeywordsCode)
					applyCustomKeywords(ajv)
				} catch (error) {
					throw new Error(`Error en keywords personalizados: ${(error as Error).message}`)
				}
			}

			// Aplicar mensajes de error personalizados si están habilitados
			if (this.properties.advancedOptions.value === true && this.properties.customErrorMessages.value === true) {
				try {
					const globalErrorMessages = JSON.parse(String(this.properties.globalErrorMessages.value))

					// Si no hay un errorMessage en el esquema, agregarlo
					if (!validationSchema.errorMessage) {
						validationSchema.errorMessage = globalErrorMessages
					}
				} catch (error) {
					console.warn('Error al parsear mensajes de error personalizados:', error)
				}
			}

			// Compilar el esquema
			const validate = ajv.compile(validationSchema)

			// Validar los datos
			const isValid = validate(inputValue)

			if (isValid) {
				// Datos válidos
				outputData('valid', {
					valid: true,
					data: inputValue
				})
			} else {
				// Datos inválidos

				const errors = localize.es(validate.errors) || []

				// Formatear errores para mejor legibilidad
				const formattedErrors = errors.map(
					(err: {
						message: any
						instancePath: any
						keyword: any
						params: any
					}) => ({
						message: err.message,
						path: err.instancePath || '/',
						keyword: err.keyword,
						params: err.params
					})
				)

				outputData('invalid', {
					valid: false,
					errors: formattedErrors,
					originalErrors: this.properties.errorDetails.value ? errors : undefined,
					data: inputValue
				})
			}
		} catch (error) {
			let message = 'Error en validación'
			if (error instanceof Error) {
				message = error.message
			}

			outputData('error', {
				error: message,
				stack: error instanceof Error ? error.stack : undefined
			})
		}
	}
}
