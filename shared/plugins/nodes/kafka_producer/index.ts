import type { IClassNode, classOnExecuteInterface, infoInterface } from '@shared/interfaces/class.interface.js'
import type { IPropertiesType } from '@shared/interfaces/workflow.properties.interface.js'

export default class implements IClassNode {
	// ===============================================
	// Dependencias
	// ===============================================
	// #pk kafkajs
	// ===============================================
	constructor(
		public info: infoInterface,
		public properties: IPropertiesType
	) {
		this.info = {
			name: 'Kafka Producer',
			desc: 'Produce mensajes en un tópico de Kafka',
			icon: '󱀏',
			group: 'Kafka',
			color: '#3498DB',
			connectors: {
				inputs: ['input'],
				outputs: ['response', 'error']
			}
		}
		this.properties = {
			value: {
				name: 'Valor:',
				value: '',
				type: 'code',
				lang: 'json',
				size: 4
			},
			topic: {
				name: 'Tópico:',
				value: '',
				type: 'string',
				size: 3
			},
			config: {
				name: 'Configuración:',
				type: 'code',
				lang: 'json',
				value: JSON.stringify(
					{
						clientId: 'my-app',
						sasl: {
							username: '',
							password: '',
							mechanism: 'scram-sha-512'
						},
						ssl: {
							rejectUnauthorized: false
						}
					},
					null,
					' '
				)
			},
			brokers: {
				name: 'Brokers:',
				description: 'Urls de conexión',
				type: 'list',
				object: {
					broker: {
						name: 'Broker:',
						type: 'string',
						value: ''
					}
				},
				value: []
			}
		}
	}

	async onExecute({ outputData, dependency }: classOnExecuteInterface) {
		try {
			const { Kafka } = await dependency.getRequire('kafkajs')
			const kafka = new Kafka({
				...(this.properties.config.value as object),
				brokers: (this.properties.brokers.value as { broker: { value: string } }[]).map((m) => m.broker.value)
			})

			const producer = kafka.producer()
			const message = {
				value: typeof this.properties.value.value === 'object' ? JSON.stringify(this.properties.value.value) : '{}'
			}

			await producer.connect()
			const data = await producer.send({
				topic: this.properties.topic.value,
				messages: [message]
			})
			outputData('response', data)
		} catch (error) {
			let message = 'Error'
			if (error instanceof Error) message = error.toString()
			outputData('error', { error: message })
		}
	}
}
