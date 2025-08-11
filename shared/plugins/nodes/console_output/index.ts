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
				inputs: [{ name: 'input' }],
				outputs: [{ name: 'response' }]
			}
		}

		this.properties = {
			value: {
				name: 'Valor',
				type: 'string',
				value: '{{input.data}}'
			},
			type: {
				name: 'Tipo',
				type: 'options',
				value: 'info',
				options: [
					{ label: 'Info', value: 'info' },
					{ label: 'Warning', value: 'warning' },
					{ label: 'Error', value: 'error' },
					{ label: 'Debug', value: 'debug' }
				]
			},
			showProduction: {
				name: 'Mostrar en producción',
				type: 'switch',
				value: false
			}
		}
	}

	async onExecute({ outputData }: classOnExecuteInterface) {
		if (this.properties.showProduction.value === false && process.env.NODE_ENV === 'production') return
		const value = this.properties.value.value
		switch (this.properties.type.value) {
			case 'info':
				console.info('console', value)
				break
			case 'warning':
				console.warn('console', value)
				break
			case 'error':
				console.error('console', value)
				break
			case 'debug':
				console.debug('console', value)
				break
		}
		outputData('response', { data: this.properties.value.value })
	}
}
