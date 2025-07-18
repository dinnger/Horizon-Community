import type { IPropertiesType } from '../../../interfaces/workflow.properties.interface.js'
import type { IClassNode, classOnExecuteInterface, infoInterface } from '../../../interfaces/class.interface.js'

export default class implements IClassNode {
	constructor(
		public info: infoInterface,
		public properties: IPropertiesType
	) {
		this.info = {
			name: 'Event Manual',
			desc: 'Emit a manual event',
			icon: '󰆍',
			group: 'Integrations',
			color: '#95A5A6',
			connectors: {
				inputs: ['input'],
				outputs: ['response']
			}
		}

		this.properties = {
			delay: {
				name: 'Mostrar en producción',
				type: 'switch',
				value: false
			}
		}
	}

	async onExecute({ inputData, outputData }: classOnExecuteInterface) {
		console.debug(inputData.data)
		outputData('response', inputData.data)
	}
}
