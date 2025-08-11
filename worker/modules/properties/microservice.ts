import type { IWorkerContext } from '@shared/interfaces'

export class PluginMicroservice {
	context: IWorkerContext
	currentObject: { [key: string]: any }
	processedExpression: { value: string }
	scope: { [key: string]: any }

	constructor({
		context,
		currentObject,
		processedExpression,
		scope
	}: {
		context: IWorkerContext
		currentObject: { [key: string]: any }
		processedExpression: { value: string }
		scope: { [key: string]: any }
	}) {
		this.context = context
		this.currentObject = currentObject
		this.processedExpression = processedExpression
		this.scope = scope
	}

	async eval() {
		// Regex mejorada para capturar mejor las llamadas de microservicio
		const microserviceCallRegex = /([\w]+):([\w]+)\(([^)]*)\)/g
		const projectType = this.context.project?.type || 'none'

		let match: RegExpExecArray | null
		// biome-ignore lint/suspicious/noAssignInExpressions: Es necesario para el loop de regex
		while ((match = microserviceCallRegex.exec(this.processedExpression.value)) !== null) {
			const module = await this.context.getMicroserviceModule({
				context: this.context,
				name: projectType
			})

			const fullMatch = match[0]
			const serviceName = match[1]
			const methodName = match[2]
			const parametersStr = match[3]

			// Construir el nombre completo de la función
			const functionName = `${serviceName}:${methodName}`

			// Verificar si hay parámetros
			try {
				let objectParams = {}

				if (parametersStr.trim()) {
					// Reemplazar comillas simples por dobles para JSON válido
					const objectTrim = parametersStr.replace(/'/g, '"')
					objectParams = JSON.parse(objectTrim)
				}

				const response = await module.request({
					name: functionName,
					message: objectParams
				})

				// Crear una variable temporal única para este resultado
				const tempVarName = `__microservice_${serviceName}_${methodName}_${Date.now()}`
				this.scope[tempVarName] = JSON.parse(response)

				// Reemplazar en la expresión
				this.processedExpression.value = this.processedExpression.value.replace(fullMatch, tempVarName)

				// Reiniciar la regex para procesar desde el principio con el nuevo valor
				microserviceCallRegex.lastIndex = 0
			} catch (error) {
				console.error(`Error en microservicio ${functionName}:`, error)
				// En caso de error, mantener la expresión original
			}
		}
	}
}
