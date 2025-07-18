import type { IClassNode, classOnExecuteInterface, infoInterface } from '@shared/interfaces/class.interface.js'
import type { IPropertiesType } from '@shared/interfaces/workflow.properties.interface.js'

export default class implements IClassNode {
	// ===============================================
	// Dependencias
	// ===============================================
	// #pk amqplib
	// ===============================================
	constructor(
		public info: infoInterface,
		public properties: IPropertiesType
	) {
		this.info = {
			name: 'RabbitMQ Producer',
			desc: 'Produce mensajes de un tópico de RabbitMQ',
			icon: '󰤇',
			group: 'RabbitMQ',
			color: '#3498DB',
			connectors: {
				inputs: ['init'],
				outputs: ['response', 'error']
			}
		}

		this.properties = {
			url: {
				name: 'URL:',
				value: 'amqp://localhost:5672',
				type: 'string',
				size: 4
			},
			queue: {
				name: 'Cola (Queue):',
				value: '',
				type: 'string',
				size: 4
			},
			exchange: {
				name: 'Exchange:',
				value: '',
				type: 'string',
				description: 'Nombre del Exchange, si no se define se usa el nombre de la cola',
				size: 2
			},
			exchangeType: {
				name: 'Tipo de Exchange:',
				value: 'topic',
				type: 'options',
				options: [
					{
						label: 'Direct',
						value: 'direct'
					},
					{
						label: 'Fanout',
						value: 'fanout'
					},
					{
						label: 'Topic',
						value: 'topic'
					}
				],
				size: 1
			},
			routingKey: {
				name: 'Routing Key:',
				value: '',
				type: 'string',
				description: 'Nombre del routing key, si no se define se usa el nombre de la cola',
				size: 1
			},
			retry: {
				name: 'Reintento (seg):',
				value: 10,
				description: 'Tiempo máximo de espera para reintentar una conexión (Cada reintento se tomara el doble de tiempo de la anterior)',
				type: 'number',
				size: 1
			},
			durable: {
				name: 'Durable:',
				value: true,
				type: 'switch',
				description: 'Habilita la durabilidad de la cola',
				size: 1
			},
			persistent: {
				name: 'Persistent:',
				value: true,
				type: 'switch',
				description: 'Habilita la persistencia del mensaje',
				size: 1
			},
			value: {
				name: 'Value:',
				value: JSON.stringify({ data: 'Hello World' }, null, ' '),
				type: 'code',
				lang: 'json',
				size: 4
			}
		}
	}

	async onExecute({ inputData, outputData, context, dependency }: classOnExecuteInterface) {
		try {
			const amqp = await dependency.getRequire('amqplib')
			const queue = this.properties.queue.value
			const durable = this.properties.durable.value
			const persistent = this.properties.persistent.value
			const message = Buffer.from(JSON.stringify(this.properties.value.value))

			const conn = await amqp.connect(this.properties.url.value)
			// Create a channel
			const channel = await conn.createChannel()

			channel.on('error', (error: Error) => {
				outputData('error', { error: error.toString() })
			})

			channel.on('close', () => {})

			// Create a queue
			if (this.properties.exchange.value !== '') {
				await channel.assertExchange(this.properties.exchange.value, this.properties.exchangeType.value, { durable })
				const sent = await channel.publish(this.properties.exchange.value, this.properties.routingKey.value || '', message, { persistent })
				if (!sent) return outputData('error', { error: 'Error sending message' })
				outputData('response', { message: 'Ok' })
			} else {
				await channel.assertQueue(queue, { durable })
				// Bind the queue to the exchange
				const sent = await channel.sendToQueue(queue, message, { persistent })
				if (!sent) return outputData('error', { error: 'Error sending message' })
				outputData('response', { message: 'Ok' })
			}
		} catch (error) {
			let message = 'Error'
			if (error instanceof Error) message = error.toString()
			outputData('error', { error })
		}
	}
}
