import type { IWorkerInfo } from '@shared/interfaces/worker.interface'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useWorkerStore = defineStore('worker', () => {
	// Estados del worker
	const workerInfo = ref<IWorkerInfo | null>(null)
	const isExecuting = ref(false)

	return { workerInfo, isExecuting }
})
