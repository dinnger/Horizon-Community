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
			name: 'RabbitMQ Consumer',
			desc: 'Consume mensajes de un tópico de RabbitMQ',
			icon: '󰤇',
			group: 'RabbitMQ',
			color: '#3498DB',
			isTrigger: true,
			connectors: {
				inputs: ['init'],
				outputs: ['response', 'error', 'error:connection']
			}
		}
		this.properties = {
			url: {
				name: 'URL:',
				value: 'amqp://localhost:5672',
				type: 'string',
				size: 4
			},
			// divider1: {
			// 	name: 'Configuración de Exchange',
			// 	type: 'divider'
			// },
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
			// divider2: {
			// 	name: 'Configuración de Colas',
			// 	type: 'divider'
			// },
			queue: {
				name: 'Cola (Queue):',
				value: '',
				type: 'string',
				description: 'Nombre de la cola'
			},
			// divider3: {
			// 	name: 'Opciones',
			// 	type: 'divider'
			// },
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
			autoAck: {
				name: 'Auto Ack:',
				value: true,
				description: 'Habilitar commit automático, si es falso se debe hacer manualmente mediante la entrada "next"',
				type: 'switch',
				size: 1
			}
		}
	}

	async onExecute({ inputData, outputData, context, dependency }: classOnExecuteInterface) {
		const convertJson = (value: string) => {
			try {
				return JSON.parse(value)
			} catch (error) {
				return value
			}
		}
		try {
			const amqp = await dependency.getRequire('amqplib')
			const queue = this.properties.queue.value
			const durable = this.properties.durable.value

			// const fnRetry = retryAsync({
			// 	maxTime: this.properties.retry.value || 10
			// })

			const exec = async () => {
				const conn = await amqp.connect(this.properties.url.value)
				const channel = await conn.createChannel()
				await channel.prefetch(1)

				await channel.on('error', () => {})

				await channel.on('close', () => {
					main()
				})

				await channel.assertQueue(queue, { durable })

				// Bind the queue to the exchange
				if (this.properties.exchange.value !== '') {
					await channel.assertExchange(this.properties.exchange.value, this.properties.exchangeType.value, { durable })
					await channel.bindQueue(queue, this.properties.exchange.value, this.properties.routingKey.value || '')

					// Start consuming
					channel.consume(
						queue,
						(message: { content: Buffer }) => {
							outputData('response', { value: convertJson(message.content.toString()) }, { channel, message })
							if (this.properties.autoAck.value) channel.ack(message)
						},
						{ noAck: false }
					)
				} else {
					channel.consume(
						queue,
						(message: { content: Buffer }) => {
							outputData('response', { value: convertJson(message.content.toString()) }, { channel, message })
							if (this.properties.autoAck.value) channel.ack(message)
						},
						{ noAck: false }
					)
				}
			}
			const main = async () => {
				// fnRetry({
				// 	fn: exec,
				// 	// onSuccess: () => outputData('response', { message: 'Ok' }),
				// 	onError: () =>
				// 		outputData('error', { error: 'Error consuming message' }),
				// 	onErrorEnd: () =>
				// 		outputData('error:connection', {
				// 			error: 'Error consuming message end'
				// 		})
				// })
			}
			main()
		} catch (error) {
			let message = 'Error'
			if (error instanceof Error) message = error.toString()
			outputData('error', { error })
		}
	}
}
