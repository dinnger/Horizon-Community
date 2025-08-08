import type { classOnExecuteInterface } from '@shared/interfaces'
import type { IConnectionModule } from '@shared/interfaces/connection.interface.js'
import { v4 as uuid } from 'uuid'
import { connect, NatsConnection, StringCodec, Subscription } from 'nats'

export default class implements IConnectionModule {
	outputData: classOnExecuteInterface['outputData']
	context: classOnExecuteInterface['context']
	nc: NatsConnection | null = null

	constructor({ outputData, context }: classOnExecuteInterface) {
		this.outputData = outputData
		this.context = context
	}
	// ======================================================================
	// CONNECTION
	// ======================================================================
	async connection(items: { name: { value: any }; validationSchema: { value: any } }[]) {
		if (!this.context.project || this.context.project.type !== 'nats') return
		try {
			if (!this.nc) this.nc = await connect({ servers: this.context.project?.transportConfig.url.split(',') || [] })

			// Subscribers
			for (const item of items) {
				const sub = this.nc.subscribe(item.name.value)
				this.printMsgs(sub)
			}

			// wait for the client to close here.
			await this.nc.closed().then((err) => {
				let m = `connection to ${this.nc?.getServer()} closed`
				if (err) {
					m = `${m} with an error: ${err.message}`
				}
				console.log(m)
			})
		} catch (error: any) {
			console.error(error.toString())
		}
	}

	private async printMsgs(s: Subscription) {
		const subj = s.getSubject()
		const sc = StringCodec()

		console.log(`listening for ${subj}`)
		const c = 13 - subj.length
		const pad = ''.padEnd(c)
		for await (const m of s) {
			console.log(`[${subj}]${pad} #${s.getProcessed()} - ${m.subject} ${m.data ? ` ${sc.decode(m.data)}` : ''}`)
			if (m.respond(sc.encode(new Date().toISOString()))) {
				console.info(`[time] handled #${s.getProcessed()}`)
			} else {
				console.log(`[time] #${s.getProcessed()} ignored - no reply subject`)
			}
		}
	}
}
