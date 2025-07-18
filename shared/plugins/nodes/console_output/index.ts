import type { IPropertiesType } from '@shared/interfaces/workflow.properties.interface.js'
import type { IClassNode, classOnExecuteInterface, infoInterface } from '@shared/interfaces/class.interface.js'

export default class implements IClassNode {
	constructor(
		public info: infoInterface,
		public properties: IPropertiesType
	) {
		this.info = {
			name: 'Console',
			desc: 'Show value inside the console',
			icon: '󰆍',
			group: 'Utilities',
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
		console.debug('[console]', inputData.data)
		outputData('response', inputData.data)
	}
}
