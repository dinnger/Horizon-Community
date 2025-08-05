import type { IClassNode, classOnUpdateInterface, classOnExecuteInterface, infoInterface } from '@shared/interfaces/class.interface.js'
import type { ICodeProperty, IListProperty, IPropertiesType } from '@shared/interfaces/workflow.properties.interface.js'

interface IProperties extends IPropertiesType {
	conditions: IListProperty
}

export default class ConditionalNode implements IClassNode {
	info = {
		name: 'Conditional',
		desc: 'Evalúa una condición y ramifica según el resultado.',
		icon: '󰈲',
		group: 'Control Flow / Logic',
		color: '#9b59b6',
		connectors: {
			inputs: ['input'],
			outputs: ['error']
		},
		isSingleton: true
	}

	properties = {
		conditions: {
			name: 'Condiciones:',
			type: 'list',
			object: {
				name: {
					name: 'Nombre:',
					type: 'string',
					value: 'condicion_{{index}}',
					maxlength: 20
				},
				condition: {
					name: 'Condición (JS):',
					type: 'string',
					value: 'input.data === true',
					evaluation: {
						all: true
					}
				},
				value: {
					name: 'Valor de salida:',
					type: 'string',
					value: '{{input.data}}'
				}
			},
			value: []
		} as IListProperty
	}

	async onUpdateProperties({ context, properties, connectors }: classOnUpdateInterface<this['properties']>) {
		const valor = properties.conditions.value
		connectors.outputs = []
		for (let i = 0; i < valor.length; i++) {
			const index = (i + 1).toString().padStart(2, '0')
			const name = valor[i]?.name?.value?.toString().trim().replace('{{index}}', index) || `condicion_${index}`
			connectors.outputs.push({ name: name })
		}
		connectors.outputs.push('else')
		connectors.outputs.push('error')
	}

	async onExecute({ inputData, outputData }: classOnExecuteInterface): Promise<void> {
		try {
			const code = this.properties.conditions.value.map((m) => m.condition.value)

			let name = null
			for (let i = 0; i < code.length; i++) {
				if (code[i] === true) {
					const index = (i + 1).toString().padStart(2, '0')
					name = this.properties.conditions.value[i]?.name?.value?.toString().trim().replace('{{index}}', index) || `condicion_${index}`
					break
				}
			}

			if (!name) return outputData('else', inputData.data)

			outputData(name, inputData.data)
		} catch (error) {
			let message = 'Error'
			if (error instanceof Error) message = error.message
			outputData('error', { error: message })
		}
	}
}
