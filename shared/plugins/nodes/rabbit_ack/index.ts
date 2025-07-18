import type { IClassNode, classOnExecuteInterface, infoInterface } from '@shared/interfaces/class.interface.js'
import type { IPropertiesType } from '@shared/interfaces/workflow.properties.interface.js'

export default class implements IClassNode {
	// ===============================================
	// Dependencias
	// ===============================================
	// ===============================================
	constructor(
		public info: infoInterface,
		public properties: IPropertiesType
	) {
		this.info = {
			name: 'RabbitMQ Ack',
			desc: 'Confirma mensajes de un tópico de RabbitMQ',
			icon: '󰤇',
			group: 'RabbitMQ',
			color: '#3498DB',
			connectors: {
				inputs: ['input'],
				outputs: ['response', 'error']
			}
		}
		this.properties = {
			ack: {
				name: 'Ack:',
				value: true,
				type: 'switch',
				description: 'Habilita la confirmación del mensaje, si no se confirma el mensaje se pierde (nack)',
				size: 1
			}
		}
	}

	async onExecute({ inputData, outputData, execute }: classOnExecuteInterface) {
		try {
			const node = execute.getNodeByType('triggers/rabbit_consumer')
			if (!node) return outputData('error', { error: 'No se ha definido el nodo' })

			const channel = node?.meta?.channel
			const message = node?.meta?.message
			if (!channel || !message)
				return outputData('error', {
					error: 'No se ha definido el canal o mensaje'
				})

			if (this.properties.ack.value) {
				channel.ack(message)
			} else {
				channel.nack(message)
			}
			outputData('response', inputData.data)
		} catch (error) {
			let message = 'Error'
			if (error instanceof Error) message = error.toString()
			outputData('error', { error })
		}
	}
}
