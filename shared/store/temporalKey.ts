const temporal: Map<string, TemporalKey> = new Map()

class TemporalKey {
	key: string
	data: any
	timeout: any = null
	resolve!: (value: any) => void
	reject!: (reason?: any) => void
	promise: Promise<any>

	constructor({ key, data }: { key: string; data?: any }) {
		this.key = key
		this.data = data

		this.promise = new Promise((res, rej) => {
			this.resolve = res
			this.reject = rej
		})

		this.initTimeout()
	}

	initTimeout() {
		this.timeout = setTimeout(
			() => {
				temporal.delete(this.key)
				this.reject({ expired: true, data: this.data })
			},
			1000 * 60 * 60
		) // 1 hour timeout
	}
}

class TemporalKeyManager {
	set({ key, data }: { key: string; data?: any }): Promise<any> {
		const temporalKey = new TemporalKey({ key, data })
		temporal.set(key, temporalKey)
		return temporalKey.promise
	}

	resolve({ key, data, meta }: { key: string; data: any; meta?: any }): void {
		const temporalKey = temporal.get(key)
		if (temporalKey) {
			clearTimeout(temporalKey.timeout)
			temporal.delete(key)
			temporalKey.resolve({ expired: false, data, meta })
		}
	}

	reject({ key, data }: { key: string; data: any }) {
		const temporalKey = temporal.get(key)
		if (temporalKey) {
			clearTimeout(temporalKey.timeout)
			temporal.delete(key)
			temporalKey.reject(data)
		}
	}
}

export const temporalKeyManager = new TemporalKeyManager()
