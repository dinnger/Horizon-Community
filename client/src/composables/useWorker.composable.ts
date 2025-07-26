import type { IWorkerInfo } from '@shared/interfaces/worker.interface'
import { ref } from 'vue'
import { useWorkerStore } from '@/stores/worker'
import socketService from '@/services/socket'

export function useWorkerComposable() {
	const workerStore = useWorkerStore()

	// Función para manejar la ejecución del workflow
	const executeWorkflow = async (data: { workflowId: string; version?: string }) => {
		if (workerStore.isExecuting) return
		console.log('executeWorkflow', data)
		workerStore.isExecuting = true
		try {
			const result = await execute(data)
			console.log('result', result)
		} catch (error) {
			alert('Error inesperado ejecutando workflow')
		} finally {
			workerStore.isExecuting = false
		}
	}

	const execute = async (data: { workflowId: string; version?: string }) => {
		try {
			const workerActive = workerStore.workerInfo?.workflowId === data.workflowId ? workerStore.workerInfo : null

			if (workerActive) workerActive.status = 'stopped'
			// Execute the workflow which will also save to file
			const result = await socketService.executeWorkflow(data.workflowId, 'manual', data.version)

			if (result.success) {
				console.log('Workflow ejecutado exitosamente:', result.worker.executionId)
				if (workerActive) workerActive.status = 'running'
				return {
					success: true,
					executionId: result.worker.executionId,
					version: result.worker.version,
					message: result.worker.message
				}
			}

			console.error('Error ejecutando workflow:', result.message)
			return { success: false, message: result.message }
		} catch (error) {
			console.error('Error en ejecución:', error)
			return { success: false, message: 'Error al ejecutar workflow' }
		}
	}

	const stopWorker = async ({ workerId }: { workerId: string }) => {
		try {
			const result = await socketService.stopWorker({ workerId })
			if (result.success) {
				return result
			}
			return { success: false, message: result.message || 'Error al detener worker' }
		} catch (error) {
			console.error('Error deteniendo worker:', error)
			return { success: false, message: 'Error al detener worker' }
		}
	}

	// Función para inicializar las suscripciones
	const initSubscriptionsWorker = ({ workflowId }: { workflowId: string }) => {
		socketService.onWorkerStatus(workflowId || '', (event: { success: boolean; workers: IWorkerInfo[] }) => {
			if (event.workers?.length > 0) {
				console.warn('worker=====>', event.workers[0])
				workerStore.workerInfo = event.workers[0]
			} else {
				workerStore.workerInfo = null
			}
		})
	}

	const closeSubscriptionsWorker = ({ workflowId }: { workflowId: string }) => {
		socketService.removeListeners(`/worker:.*:${workflowId}/`)
	}

	return {
		executeWorkflow,
		stopWorker,
		initSubscriptionsWorker,
		closeSubscriptionsWorker
	}
}
