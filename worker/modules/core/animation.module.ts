import type { Worker } from '../../worker.js'
import type { IAnimationConfig, INodeExecutionTrace, INodeWorker } from '@shared/interfaces/standardized.js'

/**
 * Módulo para manejar las animaciones de ejecución de nodos
 */
export class CoreAnimation {
	private el: Worker
	private executionQueue: INodeExecutionTrace[] = []
	private sendInterval: NodeJS.Timeout | null = null
	private config: IAnimationConfig

	constructor(el: Worker) {
		this.el = el
		this.config = {
			duration: 60,
			circleSize: 5,
			sendInterval: 2000
		}
		this.startSendingAnimations()
	}

	/**
	 * Registra una ejecución de nodo para ser enviada como animación
	 */
	registerExecution({
		uuid,
		node,
		connectorName,
		destinationNodeIds,
		executeTime,
		accumulativeTime,
		memory,
		outputData
	}: {
		uuid: string
		node: INodeWorker
		connectorName: string
		destinationNodeIds: string[]
		executeTime: number
		accumulativeTime: number
		memory: string
		outputData: any
	}) {
		const trace: INodeExecutionTrace = {
			uuid,
			nodeId: node.id,
			nodeName: node.info.name,
			nodeType: node.type,
			connectorName,
			destinationNodeIds,
			executeTime,
			accumulativeTime: accumulativeTime,
			memory,
			timestamp: Date.now(),
			outputData
		}

		this.executionQueue.push(trace)
	}

	/**
	 * Inicia el proceso de envío de animaciones cada 2 segundos
	 */
	private startSendingAnimations() {
		if (this.sendInterval) {
			clearInterval(this.sendInterval)
		}

		this.sendInterval = setInterval(() => {
			this.sendAnimations()
		}, this.config.sendInterval)
	}

	/**
	 * Envía las animaciones acumuladas al cliente
	 */
	private async sendAnimations() {
		if (this.executionQueue.length === 0) return

		// Crear una copia de la cola y limpiarla
		const animationsToSend = [...this.executionQueue]
		this.executionQueue = []

		try {
			// Enviar las animaciones como un lote
			await this.el.communicationModule.server.requestFromServer('worker:animations', {
				animations: animationsToSend,
				timestamp: new Date().toISOString()
			})
		} catch (error) {
			console.warn('Failed to send animations to server:', error)
			// Reencolar las animaciones fallidas
			this.executionQueue.unshift(...animationsToSend)
		}
	}

	/**
	 * Configura los parámetros de animación
	 */
	setConfig(config: Partial<IAnimationConfig>) {
		this.config = { ...this.config, ...config }

		// Reiniciar el intervalo si cambió
		if (config.sendInterval) {
			this.startSendingAnimations()
		}
	}

	/**
	 * Detiene el envío de animaciones
	 */
	stop() {
		if (this.sendInterval) {
			clearInterval(this.sendInterval)
			this.sendInterval = null
		}
		this.executionQueue = []
	}

	/**
	 * Destructor - limpia recursos cuando el worker se destruye
	 */
	destroy() {
		this.stop()
	}

	/**
	 * Obtiene la configuración actual
	 */
	getConfig(): IAnimationConfig {
		return { ...this.config }
	}

	/**
	 * Obtiene el número de animaciones pendientes de envío
	 */
	getPendingAnimationsCount(): number {
		return this.executionQueue.length
	}
}
