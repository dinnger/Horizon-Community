import type { IClassNode, classOnExecuteInterface, infoInterface } from '@shared/interfaces/class.interface.js'
import type { IPropertiesType } from '@shared/interfaces/workflow.properties.interface.js'

export default class implements IClassNode {
	private server: any
	private connections: any[] = []

	constructor(
		public info: infoInterface,
		public properties: IPropertiesType,
		public meta: { [key: string]: any } = {}
	) {
		this.info = {
			name: 'Message Response',
			desc: 'Response to messages',
			icon: '󱧍',
			group: 'Project',
			color: '#3498DB',
			isSingleton: true,
			connectors: {
				inputs: ['response', 'rollback'],
				outputs: []
			}
		}

		this.properties = {
			response: {
				name: 'Respuesta:',
				value: JSON.stringify({ status: 'OK' }, null, ' '),
				type: 'code',
				lang: 'json',
				description: 'Datos a enviar como respuesta al cliente (opcional)',
				size: 4
			}
		}
	}

	async onExecute({ execute, outputData }: classOnExecuteInterface): Promise<void> {
		try {
			const node = execute.getNodeByType('project/connection/message')
			if (!node || !node.meta) {
				return outputData('error', { error: 'No se encontró el nodo' })
			}
			if (this.properties.response.value) {
				let response: any = this.properties.response.value
				if (typeof response === 'object') {
					const { uid, name } = node.meta
					response = JSON.stringify({ type: 'response', name, uid, response })
				}
				node.meta.socket.response(response)
				outputData('response', JSON.parse(String(response)))
			}
		} catch (error) {
			let message = 'Error'
			if (error instanceof Error) message = error.toString()
			outputData('error', { error: message })
		}
	}

	// Método para detener el servidor y cerrar todas las conexiones
	onDestroy(): void {
		if (this.server) {
			// Cerrar todas las conexiones abiertas
			for (const socket of this.connections) {
				socket.destroy()
			}
			this.connections = []

			// Cerrar el servidor
			this.server.close()
			this.server = null
		}
	}
}
