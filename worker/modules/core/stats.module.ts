interface IStatsAnimations {
	nodeId: string
	connectName: string
	executeTime: number
	length?: number
}

type IStatsType = 'animations' | 'console' | 'worker'

type IStatsMap = {
	animations: Map<string, Map<string, IStatsAnimations>>
	console: { date: string; level: string; message: string }[]
	worker: { data: { [key: string]: number }; length: number }[]
}

export class CoreStats {
	dataStats: IStatsMap = {
		animations: new Map(),
		console: [],
		worker: []
	}
	nodeAnimations: Map<string, { length: number }> = new Map()

	animations(data: IStatsAnimations) {
		if (!data.nodeId || !data.connectName) return
		if (!this.dataStats.animations.has(data.nodeId)) {
			this.dataStats.animations.set(data.nodeId, new Map())
		}
		const animation = this.dataStats.animations.get(data.nodeId)
		if (!animation) return

		const animationData = animation.get(data.connectName)
		const nodeIndex = `${data.nodeId}_${data.connectName}`

		if (!animationData) {
			if (!data.length) data.length = (this.nodeAnimations.get(nodeIndex)?.length || 0) + 1
			animation.set(data.connectName, data)
			this.nodeAnimations.set(nodeIndex, { length: data.length })
		} else {
			animationData.executeTime = data.executeTime
			animationData.length = (animationData.length || 0) + 1
			this.nodeAnimations.set(nodeIndex, { length: animationData.length })
		}
	}

	console(data: { date: string; level: string; message: string }) {
		this.dataStats.console.push(data)
	}

	get(type: IStatsType) {
		if (type === 'animations') {
			if (this.dataStats.animations.size === 0) return null
			const animationsArray: IStatsAnimations[] = []
			for (const [nodeId, animationMap] of this.dataStats.animations) {
				for (const [connectName, animation] of animationMap) {
					animationsArray.push(animation)
				}
			}
			// Limpiar datos
			this.dataStats.animations = new Map()
			return animationsArray
		}
		if (type === 'console') {
			if (this.dataStats.console.length === 0) return null
			const consoleArray = [...this.dataStats.console]
			// Limpiar datos
			this.dataStats.console = []
			return consoleArray
		}
		return null
	}
}
