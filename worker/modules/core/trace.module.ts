interface ITraceData {
	data: { [key: string]: number }
	length: number
}

export interface ITrace {
	inputs: ITraceData
	outputs: ITraceData
}

interface ITraceExecute {
	id: string
	type: 'inputs' | 'outputs'
	connectName?: string
	executeTime?: number
}

export class CoreTrace {
	changeNode: Set<string>
	data: Map<string, ITrace>

	dataNode: Map<string, any> = new Map()
	statsNode: Map<string, any> = new Map()

	constructor() {
		this.changeNode = new Set()
		this.data = new Map()
	}

	set({ id, type, connectName, executeTime }: ITraceExecute) {
		this.changeNode.add(id)
		const trace = this.data.get(id)
		if (!trace) {
			this.data.set(id, {
				inputs: { length: 0, data: {} },
				outputs: { length: 0, data: {} }
			})
		}
		const item = this.data.get(id)
		if (!item) return
		if (connectName && !item[type].data[connectName]) {
			item[type].data[connectName] = 0
		}
		if (connectName) item[type].data[connectName]++
		item[type].length++

		// Registrando stats
		if (this.statsNode.has(id) && type === 'outputs') {
			let stats = this.statsNode.get(id)
			if (!stats) {
				stats = {
					executeTime: 0,
					length: 0
				}
			}
			stats.executeTime = stats.executeTime + executeTime
			stats.length++
			this.statsNode.set(id, stats)
		}
	}

	get() {
		const filteredData = new Map([...this.data].filter(([key]) => this.changeNode.has(key)))
		this.changeNode.clear()
		if (filteredData.size === 0) return null
		return Object.fromEntries(filteredData)
	}

	/**
	 * Increments the count of either 'inputs' or 'outputs' for a given trace ID.
	 * If the trace ID does not exist, it initializes the trace with the count set to 1 for the specified type.
	 *
	 * @param id - The unique identifier for the trace.
	 * @param type - The type of count to increment, either 'inputs' or 'outputs'. Defaults to 'inputs'.
	 */
	traceExecute({ id, type, connectName, executeTime }: ITraceExecute) {
		this.set({ id, type, connectName, executeTime })
	}
}
