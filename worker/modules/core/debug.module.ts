import type { Worker } from '../../worker.js'
import dayjs from 'dayjs'

export class CoreDebug {
	debugData: Map<string, Map<string, object>> = new Map()
	isDebug = false
	el: Worker

	constructor({ el }: { el: Worker }) {
		this.el = el
	}

	send({ uuid, node, destiny, executeTimeString, executeMeta, data, memory }: any) {
		if (!this.isDebug) return
		if (!this.debugData.has(uuid)) this.debugData.set(uuid, new Map())
		const debug = this.debugData.get(uuid)
		if (debug) debug.set(node.name, data)
		this.el.communicationModule.server.sendDebug({
			data: {
				uuid,
				origin: node.name,
				destiny,
				date: dayjs().format('DD/MM/YYYY HH:mm:ss.SSS'),
				time: {
					executeTimeString,
					accumulative: executeMeta.accumulativeTime
				},
				memory
			},
			target: 'getDebug'
		})
	}
}
