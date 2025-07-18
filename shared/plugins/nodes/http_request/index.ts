import type { IPropertiesType } from '@shared/interfaces/workflow.properties.interface.js'
import type { IClassNode, classOnExecuteInterface, infoInterface } from '@shared/interfaces/class.interface.js'

export default class implements IClassNode {
	constructor(
		public dependencies: string[],
		public info: infoInterface,
		public properties: IPropertiesType
	) {
		this.dependencies = ['axios']

		this.info = {
			name: 'Request',
			desc: 'Realiza peticiones REST',
			icon: '󱌑',
			group: 'Input/Output',
			color: '#3498DB',
			connectors: {
				inputs: ['input'],
				outputs: ['response', 'error']
			}
		}

		this.properties = {
			type: {
				name: 'Tipo de llamada:',
				type: 'options',
				options: [
					{
						label: 'GET',
						value: 'get'
					},
					{
						label: 'POST',
						value: 'post'
					},
					{
						label: 'PUT',
						value: 'put'
					},
					{
						label: 'DELETE',
						value: 'delete'
					}
				],
				value: 'get'
			},
			url: {
				name: 'Dirección URL:',
				type: 'string',
				value: ''
			},
			contentType: {
				name: 'Content Type:',
				type: 'string',
				value: 'application/json'
			},
			headers: {
				name: 'Headers',
				type: 'code',
				lang: 'json',
				value: '{\n}'
			},
			body: {
				name: 'Body',
				type: 'code',
				lang: 'json',
				value: '{\n}'
			}
		}
	}

	async onExecute({ outputData, dependency }: classOnExecuteInterface) {
		const axios = (await dependency.getRequire('axios')) as any
		try {
			// console.log(this.properties.headers.value)
			const config = {
				method: this.properties.type.value,
				maxBodyLength: Number.POSITIVE_INFINITY,
				url: this.properties.url.value,
				headers: {
					...(typeof this.properties.headers.value === 'string' && this.properties.headers.value.trim() === ''
						? {}
						: typeof this.properties.headers.value === 'string'
							? JSON.parse(this.properties.headers.value)
							: (this.properties.headers.value ?? {})),
					'Content-Type': this.properties.contentType.value
				},
				data: typeof this.properties.body.value === 'object' ? JSON.stringify(this.properties.body.value) : this.properties.body.value
			}

			axios
				.request(config)
				.then((response: { data: object }) => {
					outputData('response', response.data)
				})
				.catch((error: { toString: () => string }) => {
					outputData('error', {
						error: error.toString().replace('AxiosError:', '')
					})
				})
		} catch (error) {
			let message = 'Error'
			if (error instanceof Error) message = error.message
			outputData('error', { error: message })
		}
	}
}
