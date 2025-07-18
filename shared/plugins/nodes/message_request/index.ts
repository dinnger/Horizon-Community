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
			name: 'Message Request',
			desc: 'Envía un mensaje y espera su respuesta',
			icon: '󱧐',
			group: 'Project',
			color: '#3498DB',
			connectors: {
				inputs: ['init', 'send'],
				outputs: ['response', 'error', 'timeout']
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

	async onExecute({ outputData, dependency, execute, context }: classOnExecuteInterface): Promise<void> {
		try {
			const { v4 } = await dependency.getRequire('uuid')
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
