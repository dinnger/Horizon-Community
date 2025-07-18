import type { IPropertiesType } from '@shared/interfaces/workflow.properties.interface.js'
import type { IClassNode, classOnExecuteInterface, infoInterface } from '@shared/interfaces/class.interface.js'

export default class implements IClassNode {
	constructor(
		public info: infoInterface,
		public properties: IPropertiesType
	) {
		this.info = {
			name: 'Delay',
			desc: 'Show value inside the console',
			icon: '󱫞',
			group: 'Timer',
			color: '#95A5A6',
			connectors: {
				inputs: ['input'],
				outputs: ['response']
			}
		}

		this.properties = {
			delay: {
				name: 'Tiempo de Espera (seg)',
				type: 'number',
				value: 3
			}
		}
	}

	async onExecute({ inputData, outputData }: classOnExecuteInterface) {
		setTimeout(
			() => {
				outputData('response', inputData.data)
			},
			(this.properties.delay.value as number) * 1000
		)
	}
}
