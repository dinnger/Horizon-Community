import { validate } from './valid.js'
import type { IClassNode, classOnExecuteInterface, infoInterface } from '@shared/interfaces/class.interface.js'
import type { IPropertiesType } from '@shared/interfaces/workflow.properties.interface.js'

export default class implements IClassNode {
	constructor(
		public info: infoInterface,
		public properties: IPropertiesType,
		public meta: { [key: string]: any } = {}
	) {
		this.info = {
			name: 'Message',
			desc: 'Send and receive messages',
			icon: '󱋵',
			group: 'Project',
			color: '#3498DB',
			connectors: {
				inputs: ['init'],
				outputs: ['message', 'error']
			}
		}
		this.properties = {
			name: {
				name: 'Nombre:',
				value: '',
				type: 'string',
				description: 'Nombre de la función'
			},
			validationSchema: {
				name: 'Esquema de validación (AJV):',
				type: 'code',
				lang: 'json',
				value: `{
  "nombre":"string",
  "valor":"number"
}`,
				description: 'Esquema JSON para validación de datos con AJV'
			},
			autoAck: {
				name: 'Auto Ack',
				type: 'switch',
				value: true,
				description: 'Si se activa, se confirmará automáticamente la recepción de mensajes'
			},
			validateButton: {
				name: 'Validar esquema',
				type: 'button',
				value: 'Validar esquema',
				action: {
					click: 'validateSchema'
				},
				buttonClass: 'btn-info'
			}
		}
	}

	async onAction() {
		return {
			validateSchema: async () => {
				return validate(this.properties.validationSchema.value)
			}
		}
	}

	async onExecute({ outputData, execute, dependency, context }: classOnExecuteInterface): Promise<void> {
		try {
			if (!context.project) return
			const projectType = Object.keys(context.project)[0]

			const classModule = await dependency.getModule({
				path: 'project/connection',
				name: `_${projectType}`
			})
			const module = new classModule({
				context,
				execute,
				outputData
			})
			module.connection({
				autoAck: this.properties.autoAck.value,
				name: this.properties.name.value,
				schema: this.properties.validationSchema.value
			})
		} catch (error) {
			let message = 'Error'
			if (error instanceof Error) message = error.toString()
			outputData('error', { error: message })
		}
	}
}
