import type { IClassNode, classOnExecuteInterface, infoInterface } from '@shared/interfaces/class.interface.js'
import type { IPropertiesType } from '@shared/interfaces/workflow.properties.interface.js'

export default class implements IClassNode {
	constructor(
		public dependencies: string[],
		public info: infoInterface,
		public properties: IPropertiesType,
		public meta: { [key: string]: any } = {}
	) {
		this.dependencies = ['uuid']
		this.info = {
			name: 'Microservice Request',
			desc: 'Send and receive messages',
			icon: '󱧐',
			group: 'Microservice',
			color: '#3498DB',
			connectors: {
				inputs: [{ name: 'init' }, { name: 'send' }],
				outputs: [{ name: 'response' }, { name: 'error' }, { name: 'timeout' }]
			}
		}

		this.properties = {
			name: {
				name: 'Nombre:',
				value: '',
				type: 'string'
			},
			timeout: {
				name: 'Timeout (ms):',
				value: 5000,
				type: 'number',
				description: 'Tiempo máximo de espera para la respuesta (en milisegundos)',
				size: 2
			},
			message: {
				name: 'Mensaje:',
				value: JSON.stringify({ action: 'request' }, null, ' '),
				type: 'code',
				lang: 'json',
				description: 'Datos a enviar como mensaje',
				size: 4
			},
			// solo enviar sin esperar respuesta
			wait: {
				name: 'Esperar respuesta',
				type: 'switch',
				value: true,
				description: 'Espera la respuesta del servicio'
			}
		}
	}

	async onExecute({ outputData, dependency, context }: classOnExecuteInterface): Promise<void> {
		try {
			const { v4 } = await dependency.getRequire('uuid')
			if (!context.project) return
			const projectType = Object.keys(context.project)[0]

			const module = await context.getMicroserviceModule({
				context,
				name: `${projectType}`
			})

			const wait = this.properties.wait.value
			module.request({
				wait,
				name: this.properties.name.value,
				timeout: this.properties.timeout.value,
				message: this.properties.message.value
			})
		} catch (error) {
			let message = 'Error'
			if (error instanceof Error) message = error.toString()
			outputData('error', { error: message })
		}
	}
}
