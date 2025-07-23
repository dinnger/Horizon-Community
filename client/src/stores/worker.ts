import type { IWorkerInfo } from '@shared/interfaces/worker.interface'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useWorkerStore = defineStore('worker', () => {
	const activeWorkers = ref<IWorkerInfo[]>([])

	return {}
})
