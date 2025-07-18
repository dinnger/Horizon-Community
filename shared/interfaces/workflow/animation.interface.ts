/**
 * Interfaces para el sistema de animaciones de nodos
 */

export interface IAnimationPoint {
	x: number
	y: number
}

export interface IAnimationExecution {
	/** ID único de la animación */
	id: string
	/** ID del nodo origen */
	nodeId: string
	/** Nombre del conector de salida */
	outputName: string
	/** ID del nodo destino */
	destinationNodeId: string
	/** Nombre del conector de entrada */
	inputName: string
	/** Puntos que forman el path de la animación */
	pointers: IAnimationPoint[]
	/** Gradiente de color para la animación */
	colorGradient?: any
	/** Tiempo restante de la animación (en frames) */
	time: number
	/** Timestamp de cuando se ejecutó el nodo */
	timestamp: number
	/** UUID de la ejecución del workflow */
	executionUuid: string
}

export interface INodeExecutionTrace {
	/** UUID de la ejecución */
	uuid: string
	/** ID del nodo ejecutado */
	nodeId: string
	/** Nombre del nodo ejecutado */
	nodeName: string
	/** Tipo del nodo ejecutado */
	nodeType: string
	/** Nombre del conector de salida */
	connectorName: string
	/** IDs de los nodos destino */
	destinationNodeIds: string[]
	/** Tiempo de ejecución en ms */
	executeTime: number
	/** Tiempo acumulativo en ms */
	accumulativeTime: number
	/** Uso de memoria en MB (como string con decimales) */
	memory: string
	/** Timestamp de la ejecución */
	timestamp: number
	/** Datos de salida del nodo */
	outputData: any
}

export interface IAnimationConfig {
	/** Duración de la animación en frames (default: 60) */
	duration: number
	/** Tamaño del círculo de animación (default: 5) */
	circleSize: number
	/** Intervalo de envío de animaciones en ms (default: 2000) */
	sendInterval: number
}

export interface IAnimationMessage {
	type: 'node-execution'
	data: INodeExecutionTrace
}
