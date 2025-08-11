export class PluginDoubleDot {
	currentObject: { [key: string]: any }
	processedExpression: { value: string }
	scope: { [key: string]: any }

	constructor({
		currentObject,
		processedExpression,
		scope
	}: { currentObject: { [key: string]: any }; processedExpression: { value: string }; scope: { [key: string]: any } }) {
		this.currentObject = currentObject
		this.processedExpression = processedExpression
		this.scope = scope
	}

	eval() {
		// Buscar todas las expresiones con doble punto en la expresión (mejorada para múltiples niveles)
		const doubleDotRegex = /(\w+(?:\.\.\w+)+)/g
		let match: RegExpExecArray | null

		while (true) {
			match = doubleDotRegex.exec(this.processedExpression.value)
			if (match === null) break

			const fullMatch = match[0]

			// Resolver la expresión con doble punto
			const resolvedValue = this.resolveDoubleDotExpression(fullMatch)

			if (resolvedValue !== undefined) {
				// Crear una variable temporal única para este valor
				const tempVarName = `__doubleDot_${fullMatch.replace(/\.\./g, '_')}_${Date.now()}`
				this.scope[tempVarName] = resolvedValue

				// Reemplazar en la expresión
				this.processedExpression.value = this.processedExpression.value.replace(fullMatch, tempVarName)

				// Reiniciar la regex para procesar desde el principio
				doubleDotRegex.lastIndex = 0
			}
		}
	}

	// Función para resolver expresiones con doble punto (..)
	resolveDoubleDotExpression(expression: string): any {
		const parts = expression.split('..')
		if (parts.length < 2) {
			return undefined
		}

		const [rootPath, ...propertyParts] = parts

		// Obtener el objeto raíz
		let rootObject: any
		if (rootPath === 'input') {
			rootObject = this.currentObject.input
		} else if (this.currentObject[rootPath]) {
			rootObject = this.currentObject[rootPath]
		} else if (this.scope[rootPath]) {
			// Buscar en variables temporales del scope (para microservicios)
			rootObject = this.scope[rootPath]
		} else {
			return undefined
		}

		// Si solo hay una propiedad después del primer .., usar búsqueda recursiva
		if (propertyParts.length === 1) {
			const propertyName = propertyParts[0].trim()

			// Primero intentar búsqueda recursiva simple
			const simpleResult = this.findPropertyRecursive(rootObject, propertyName)
			if (simpleResult !== undefined) {
				return simpleResult
			}

			// Si no encuentra nada, intentar buscar todos los valores de esa propiedad
			const allValues = this.findAllPropertyValues(rootObject, propertyName)
			if (allValues.length === 1) {
				return allValues[0]
			}
			if (allValues.length > 1) {
				return allValues
			}

			return undefined
		}

		// Si hay múltiples propiedades, usar la nueva función de búsqueda por ruta
		const cleanPropertyParts = propertyParts.map((part) => part.trim()).filter((part) => part.length > 0)

		// Intentar búsqueda por ruta específica
		const pathResult = this.findPropertyPath(rootObject, cleanPropertyParts)
		if (pathResult !== undefined) {
			return pathResult
		}

		// Si no encuentra por ruta específica, intentar buscar la última propiedad recursivamente
		const lastProperty = cleanPropertyParts[cleanPropertyParts.length - 1]
		return this.findPropertyRecursive(rootObject, lastProperty)
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
}
