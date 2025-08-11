import type { IClassNode, classOnExecuteInterface, classOnUpdateInterface, infoInterface } from '@shared/interfaces/class.interface.js'
import { getProperties, type IProperty } from './properties.js'

export default class implements IClassNode {
	constructor(
		public info: infoInterface,
		public properties: IProperty
	) {
		this.info = {
			name: 'Response',
			desc: 'Devuelve la respuesta de una llamada webhook',
			icon: '󰌑',
			group: 'Input/Output',
			color: '#F39C12',
			connectors: {
				inputs: [{ name: 'input' }],
				outputs: [{ name: 'response' }, { name: 'error' }]
			}
		}

		this.properties = getProperties()
	}

	async onUpdateProperties({ properties }: classOnUpdateInterface<IProperty>) {
		// Mostrar/ocultar el campo de nombre de archivo según el estado del switch
		properties.nameFile.show = properties.isFile.value === true
	}

	async onExecute({ execute, outputData }: classOnExecuteInterface) {
		let node = execute.getNodeByType('webhook_handler')
		if (!node) node = execute.getNodeByType('integration/crud')
		if (!node) node = execute.getNodeByType('integration/soap')
		if (!node) return outputData('error', { error: 'No se encontró el nodo' })

		try {
			const ifExecute = execute.ifExecute()
			if (!ifExecute) {
				const response = this.properties.response.value
				// logger.info(response)
				// agregar el content type a la respuesta node.meta.res proveniente de express
				const contentType = this.properties.contentType.value
				const headers = this.properties.header.value
				// Omitiendo si es test
				if (!execute.isTest) {
					if (!node.meta || !node.meta.res) return outputData('error', { error: 'No se encontró el nodo' })
					node.meta.res.set('Content-Type', contentType)
					// for (const key of Object.keys(headers)) {
					// 	node.meta.res.set(key, headers[key]);
					// }
					if (this.properties.isFile.value) {
						node.meta.res.set('Content-Disposition', `attachment; filename="${this.properties.nameFile.value}"`)
					}
					node.meta.res.status(Number.parseInt(this.properties.status.value as string)).send(response)
				}
				return outputData('response', {
					statusCode: this.properties.status.value,
					response,
					contentType
				})
			}
		} catch (error) {
			let message = 'Error'
			if (error instanceof Error) message = error.toString()
			outputData('error', { statusCode: 500, error: message })
			// logger.error({ responseTime: this.meta?.accumulativeTime }, message)
			if (node?.meta?.res && message.indexOf('ERR_HTTP_HEADERS_SENT') === -1) node.meta.res.status(500).send('Error en respuesta ')
		}
	}
}
