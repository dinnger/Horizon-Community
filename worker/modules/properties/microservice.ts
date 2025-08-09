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
		const microserviceCallRegex = /([\w]+):([\w]+)\([^)]*\)/g
		const projectType = this.context.project?.type || 'none'

		while (true) {
			const match = microserviceCallRegex.exec(this.processedExpression.value)
			if (match === null) break

			const module = await this.context.getMicroserviceModule({
				context: this.context,
				name: projectType
			})

			const fullMatch = match[0]

			const [functionName, parameters] = fullMatch.split('(')

			// Verificar si hay parámetros
			try {
				const objectTrim = parameters.slice(0, -1).replace(/'/g, '"')
				const objectParams = JSON.parse(objectTrim)

				const response = await module.request({
					name: functionName,
					message: objectParams
				})
				// Reemplazar en la expresión
				this.scope['___temp___'] = response
				this.processedExpression.value = this.processedExpression.value.replace(fullMatch, '___temp___')
			} catch (error) {
				console.error(error)
			}
		}
	}
}
