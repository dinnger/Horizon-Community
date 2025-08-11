import type { classOnExecuteInterface } from '@shared/interfaces/class.interface.js'
import type { IConnectionModule } from '@shared/interfaces/connection.interface.js'
import amqplib from 'amqplib'
import { v4 as uuid } from 'uuid'

export default class implements IConnectionModule {
	private amqpConnection: any = null
	private channel: any = null
	private exchange = ''
	private retries = 0
	private attempts = 0
	private url = ''
	private execute: classOnExecuteInterface['execute']
	private outputData: classOnExecuteInterface['outputData']
	private context: classOnExecuteInterface['context']

	constructor({ context, execute, outputData }: classOnExecuteInterface) {
		this.outputData = outputData
		this.execute = execute
		this.context = context

		if (!context.project) return
		if (context.project.type !== 'rabbitmq') return
		const { amqpUrl, exchange, maxRetries } = context.project.transportConfig || {}
		this.url = amqpUrl
		this.exchange = exchange || ''
		this.retries = maxRetries || 0
	}

	// ======================================================================
	// CONNECTION
	// ======================================================================
	async connection({ name, schema, autoAck }: { name: string; schema: string; autoAck: boolean }) {
		const queue = `${this.exchange}-${this.context.info.name}-${name}`

		if (!this.amqpConnection) {
			this.amqpConnection = await amqplib.connect(this.url)
		}

		if (this.amqpConnection && !this.channel) {
			try {
				this.channel = await (this.amqpConnection as any).createChannel()
				await this.channel.assertExchange(this.exchange, 'topic', {
					durable: true
				})
				await this.channel.assertQueue(queue, {
					durable: true
				})
				await this.channel.bindQueue(queue, this.exchange, `${this.context.info.name}.${name}`)
				this.channel.prefetch(1)

				this.channel.consume(queue, (msg: any) => {
					if (msg) {
						let content = msg.content.toString()
						try {
							content = JSON.parse(content)
						} catch {}

						// Confirmar recepción
						if (autoAck) this.channel?.ack(msg)

						// Ensure payload is object
						const payload = typeof content === 'object' ? content : { message: content }
						const { uid, message } = payload
						this.outputData('message', message, {
							socket: {
								response: (data: any) => {
									let contentMsg = data.toString()
									try {
										contentMsg = JSON.parse(contentMsg)
									} catch {}
									if (!autoAck) this.channel?.ack(msg)
									if (uid) {
										this.channel?.sendToQueue(`${this.exchange}-${uid}`, Buffer.from(JSON.stringify(contentMsg)))
									}
								}
							}
						})
					}
				})

				this.channel.on('error', async (err: any) => {
					console.error('RabbitMQ channel error:', err.toString())
					this.channel = null
					await this.retry({
						fn: this.connection.bind(this),
						error: `RabbitMQ error: ${err.message}`,
						args: { name, schema }
					})
				})
			} catch (err: any) {
				await this.retry({
					fn: this.connection.bind(this),
					error: `RabbitMQ error: ${err.message}`,
					args: { name, schema }
				})
			}
		}
	}

	async subscribers(params: Record<string, any>): Promise<void> {
		return
	}

	// ======================================================================
	// REQUEST
	// ======================================================================
	async request({ name, timeout, message, wait }: { name: string; timeout: number; message: any; wait: boolean }) {
		this.amqpConnection = this.amqpConnection || this.execute.getGlobalData({ type: 'rabbitMQ', key: 'request' })

		try {
			if (!this.amqpConnection) {
				this.amqpConnection = await amqplib.connect(this.url)
				this.execute.setGlobalData({
					type: 'rabbitMQ',
					key: 'request',
					value: this.amqpConnection
				})
			}
			this.newChannel({
				amqpConnection: this.amqpConnection,
				name,
				message,
				wait
			})
		} catch (err: any) {
			// await this.retry({
			// 	fn: this.request.bind(this),
			// 	error: `RabbitMQ request error: ${err.message}`,
			// 	args: { name, timeout, message }
			// })
		}
		return ''
	}

	// ======================================================================
	// RETRY
	// ======================================================================
	async retry({ fn, error, args }: { fn: (args?: any) => Promise<void> | void; error: string; args?: any }): Promise<void> {
		this.attempts++
		if (this.channel) {
			await this.channel.close()
		}
		this.channel = null
		if (this.retries !== 0 && this.attempts >= this.retries) {
			this.outputData('rollback', { error })
		} else {
			await new Promise((resolve) => setTimeout(resolve, 10000))
			await fn(args)
		}
	}

	async newChannel({ amqpConnection, name, message, wait }: { amqpConnection: any; name: string; message: any; wait: boolean }) {
		const uid = wait ? uuid() : null
		const queue = `${this.exchange}-${uid}`
		const channel = await (amqpConnection as any).createChannel()
		await channel.assertExchange(this.exchange, 'topic', {
			durable: true
		})
		if (wait) {
			await channel.assertQueue(queue, {
				durable: false,
				autoDelete: true
			})
			await channel.bindQueue(queue, this.exchange, '#')
			channel.consume(
				queue,
				(msg: any) => {
					if (msg) {
						let content = msg.content.toString()
						try {
							content = JSON.parse(content)
						} catch {}
						// Ensure payload is object
						const payload = typeof content === 'object' ? content : { message: content }
						if (content?.type === 'response') {
							this.outputData('response', payload.response)
						} else {
							this.outputData('error', payload)
						}
						channel?.ack(msg)

						// Cancelar el consumidor y eliminar la cola después de recibir la respuesta
						channel
							.cancel(uid)
							.then(() => {
								channel
									.deleteQueue(queue)
									.then(() => {
										channel.close()
									})
									.catch((err: any) => {
										channel.close()
										console.error(`Error al eliminar la cola ${queue}:`, err.message)
									})
							})
							.catch((err: any) => {
								console.error(`Error al cancelar el consumidor ${uid}:`, err.message)
								channel.close()
							})
					}
				},
				{ consumerTag: uid }
			)
		}
		try {
			const queueName = `${this.exchange}-${name.replace(/\./g, '-')}`
			channel.sendToQueue(queueName, Buffer.from(JSON.stringify({ uid, message })))
			if (!wait) {
				this.outputData('response', message)
				channel.close()
			}
		} catch (error) {
			let message = 'Error'
			if (error instanceof Error) message = error.toString()
			if (channel) channel.close()
			this.outputData('error', { error: message })
		}
	}
}
