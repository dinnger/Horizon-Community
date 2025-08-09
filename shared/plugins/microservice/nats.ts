import type { classOnExecuteInterface } from '@shared/interfaces'
import type { IConnectionModule } from '@shared/interfaces/connection.interface.js'
// import { v4 as uuid } from 'uuid'
import { connect, StringCodec, type NatsConnection, type Subscription } from 'nats'

export default class implements IConnectionModule {
	context: classOnExecuteInterface['context']
	outputData: classOnExecuteInterface['outputData']
	nc: NatsConnection | null

	constructor({ context, outputData }: classOnExecuteInterface) {
		this.context = context
		this.outputData = outputData
		this.nc = null
	}

	async connection() {
		// biome-ignore lint/suspicious/noAsyncPromiseExecutor: <explanation>
		return new Promise(async (resolve, reject) => {
			if (!this.context.project || this.context.project.type !== 'nats') return reject('No project')
			try {
				if (!this.nc) this.nc = await connect({ servers: this.context.project?.transportConfig.url.split(',') || [] })

				// wait for the client to close here.
				this.nc.closed().then((err) => {
					let m = `connection to ${this.nc?.getServer()} closed`
					if (err) {
						m = `${m} with an error: ${err.message}`
					}
					this.nc = null
					console.log(m)
				})
				resolve({ status: true })
			} catch (error: any) {
				console.error(error.toString())
				reject(error)
			}
		})
	}

	// ======================================================================
	// SUBSCRIBER
	// ======================================================================
	async subscribers({
		items,
		callback
	}: {
		items: { name: { value: any }; validationSchema: { value: any } }[]
		callback: ({ name, data }: { name: string; data: any }, callback: (obj: { connectorName: string; data: object }) => void) => void
	}) {
		if (!this.nc) return
		// Subscribers
		for (const item of items) {
			console.info('[SUBSCRIBE]', item.name.value)
			this.nc.subscribe(item.name.value, {
				callback: (err, msg) => {
					if (err) {
						console.log('subscription error', err.message)
						return
					}
					const sc = StringCodec()
					const data = JSON.parse(sc.decode(msg.data))
					callback({ name: msg.subject, data }, (obj) => {
						msg.respond(sc.encode(JSON.stringify(obj)))
					})
				}
			})
		}
	}

	// ======================================================================
	// REQUEST
	// ======================================================================
	async request({ name, message }: { name: string; message: any }): Promise<any> {
		// biome-ignore lint/suspicious/noAsyncPromiseExecutor: <explanation>
		return new Promise(async (resolve, reject) => {
			if (!this.nc) return reject('No connection')
			try {
				if (!this.context.project || this.context.project.type !== 'nats') return
				const nc = await connect({ servers: this.context.project?.transportConfig.url.split(',') || [] })
				const response = await nc.request(name, Buffer.from(JSON.stringify(message)))
				resolve(StringCodec().decode(response.data))
			} catch (error) {
				reject(error)
			}
		})
	}
}
