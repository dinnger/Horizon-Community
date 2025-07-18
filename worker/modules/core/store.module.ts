export class CoreGlobalStore {
	store: Map<string, any> = new Map()

	set(key: string, value: any) {
		this.store.set(key, value)
	}
	get(key: string) {
		return this.store.get(key)
	}
	delete(key: string) {
		this.store.delete(key)
	}
}

export class CoreLocalStore {
	store: Map<string, any> = new Map()

	set(key: string, value: any) {
		this.store.set(key, value)
	}
	get(key: string) {
		return this.store.get(key)
	}
	delete(key: string) {
		this.store.delete(key)
	}
}
