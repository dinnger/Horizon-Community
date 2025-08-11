import type { IClassNode, classOnExecuteInterface, classOnUpdateInterface } from '@shared/interfaces/class.interface.js'
import type { ICodeProperty, IListProperty, IStringProperty } from '@shared/interfaces/workflow.properties.interface.js'

export default class implements IClassNode {
	public meta: { [key: string]: any } = {}
	info = {
		name: 'Microservice Client',
		desc: 'Response from microservice',
		icon: '󱋵',
		group: 'Microservice',
		color: '#3498DB',
		connectors: {
			inputs: [{ name: 'input' }],
			outputs: [{ name: 'client:get' }, { name: 'error' }]
		}
	}
	properties = {
		actions: {
			type: 'list',
			name: 'Acciones:',
			tabLabel: 'name',
			object: {
				name: {
					name: 'Nombre:',
					value: '',
					type: 'string',
					description: 'Nombre de la función'
				} as IStringProperty,
				validationSchema: {
					name: 'Esquema de validación (AJV):',
					type: 'code',
					lang: 'json',
					value: '{\n  "properties": {\n    "foo": {"type": "integer"},\n    "bar": {"type": "string"}\n  },\n  "required": ["foo"]\n}',
					autocomplete: 'ajv',
					description: 'Esquema JSON para validación de datos con AJV'
				} as ICodeProperty
			},
			value: [
				{
					name: {
						name: 'Nombre:',
						value: 'client:get',
						type: 'string',
						description: 'Nombre de la función'
					},
					validationSchema: {
						name: 'Esquema de validación (AJV):',
						type: 'code',
						lang: 'json',
						value: '{\n  "properties": {\n    "foo": {"type": "integer"},\n    "bar": {"type": "string"}\n  },\n  "required": ["foo"]\n}',
						autocomplete: 'ajv',
						description: 'Esquema JSON para validación de datos con AJV'
					}
				}
			]
		} as IListProperty
	}

	async onUpdateProperties({ properties, connectors }: classOnUpdateInterface<this['properties']>) {
		const valor = properties.actions.value
		connectors.outputs = []
		for (let i = 0; i < valor.length; i++) {
			const listName = valor[i].name?.value || `Item ${i + 1}`
			connectors.outputs.push({ name: String(listName) })
		}
		connectors.outputs.push({ name: 'error' })
	}

	async onExecute({ outputData, context }: classOnExecuteInterface): Promise<void> {
		try {
			if (!context.project) return
			const module = await context.getMicroserviceModule({
				context,
				name: context.project.type
			})

			await module.subscribers({
				items: this.properties.actions.value,
				callback: ({ name, data }: { name: string; data: any }, callback: (data: { connectorName: string; data: object }) => void) => {
					outputData(name, data, undefined, callback)
				}
			})
		} catch (error) {
			let message = 'Error'
			if (error instanceof Error) message = error.toString()
			outputData('error', { error: message })
		}
	}
}
