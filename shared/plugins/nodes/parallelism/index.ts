import type { IPropertiesType } from '@shared/interfaces/workflow.properties.interface.js'
import type { IClassNode, classOnExecuteInterface, infoInterface } from '@shared/interfaces/class.interface.js'

export default class implements IClassNode {
	constructor(
		public info: infoInterface,
		public properties: IPropertiesType,
		public instance: {
			nodesExecuted?: Set<string>
			executeData?: Map<string, { data: object; meta?: object; time: number }>
		} = {}
	) {
		this.info = {
			name: 'Parallelism',
			desc: 'Procesa multiples entradas en paralelo.',
			icon: '󰽜',
			group: 'Procesamiento',
			color: '#F39C12',
			connectors: {
				inputs: ['input'],
				outputs: ['response', 'error']
			},
			isSingleton: true
		}

		this.properties = {
			type: {
				name: 'Tipo de validación de paralelismo:',
				type: 'options',
				options: [
					{
						label: 'Esperar todas las ejecuciones',
						value: 'allParallel'
					},
					{
						label: 'Primer resultado',
						value: 'firstParallel'
					}
				],
				value: 'allParallel'
			}
		}
	}

	async onExecute({ inputData, execute, context, outputData }: classOnExecuteInterface) {
		// Si existen todas las entradas, se procede a ejecutar la salida
		if (this.properties.type.value === 'allParallel') {
			if (!this.instance.nodesExecuted) {
				if (!context.currentNode) {
					return outputData('error', { error: 'No se encontraron nodos' })
				}
				const inputs = execute.getNodesInputs(context.currentNode.id)
				if (!inputs) {
					return outputData('error', { error: 'No se encontraron nodos' })
				}
				this.instance.nodesExecuted = new Set(inputs)
			}

			// Guardando los datos de ejecución debido a que cada hilo tiene sus propios datos
			// Se busca concatenar los datos de los nodos ejecutados
			if (!this.instance.executeData) {
				this.instance.executeData = new Map(execute.getExecuteData())
			}
			for (const key of execute.getExecuteData().keys()) {
				const data = execute.getExecuteData().get(key)
				if (this.instance.executeData.has(key) || !data) continue
				this.instance.executeData.set(key, data)
			}

			// Eliminando el nodo input de la lista de nodos ejecutados
			this.instance.nodesExecuted.delete(inputData.idNode)

			const allInputs = this.instance.nodesExecuted.size === 0

			if (allInputs) {
				execute.setExecuteData(new Map(this.instance.executeData))
				this.instance.executeData.clear()
				this.instance.nodesExecuted = undefined
				outputData('response', { response: 'Ok' })
			}
		} else {
			outputData('response', { response: 'Ok' })
		}
	}
}
