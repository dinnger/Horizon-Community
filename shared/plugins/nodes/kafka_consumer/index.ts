import type { IClassNode, classOnCreateInterface, classOnExecuteInterface, infoInterface } from '@shared/interfaces/class.interface.js'
import type { IPropertiesType } from '@shared/interfaces/workflow.properties.interface.js'

export default class implements IClassNode {
	// ===============================================
	// Dependencias
	// ===============================================
	// #pk kafkajs
	// ===============================================
	constructor(
		public info: infoInterface,
		public properties: IPropertiesType
	) {
		this.info = {
			name: 'Kafka Consumer',
			desc: 'Consume mensajes de un tópico de Kafka',
			icon: '󱀏',
			group: 'Kafka',
			color: '#3498DB',
			isTrigger: true,
			connectors: {
				inputs: ['init', 'add', 'next', 'finish'],
				outputs: ['response', 'finish', 'error']
			}
		}

		this.properties = {
			topic: {
				name: 'Tópico:',
				value: '',
				type: 'string',
				size: 2
			},
			groupId: {
				name: 'Id Grupo:',
				value: '',
				type: 'string',
				size: 1
			},
			autoCommit: {
				name: 'Auto Commit:',
				value: true,
				description: 'Habilitar commit automático, si es falso se debe hacer manualmente mediante la entrada "next"',
				type: 'switch',
				size: 1
			},
			brokers: {
				name: 'Brokers:',
				description: 'Urls de conexión',
				type: 'list',
				object: {
					broker: {
						name: 'Broker:',
						type: 'string',
						value: ''
					}
				},
				value: []
			},
			config: {
				name: 'Configuración:',
				type: 'code',
				lang: 'json',
				value: JSON.stringify(
					{
						clientId: 'my-app',
						sasl: {
							username: '',
							password: '',
							mechanism: 'scram-sha-512'
						},
						ssl: {
							rejectUnauthorized: false
						}
					},
					null,
					' '
				)
			}
		}
	}

	async onCreate({ context }: classOnCreateInterface) {
		this.info.connectors.inputs = []
		this.info.connectors.inputs.push('init')
		if (this.properties.autoCommit.value) this.info.connectors.inputs.push('next')
	}

	async onExecute({ inputData, outputData, context, dependency }: classOnExecuteInterface) {
		const convertJson = (value: string) => {
			try {
				return JSON.parse(value)
			} catch (error) {
				return value
			}
		}
		try {
			// Si se llama a next se debe hacer commit manual
			if (inputData.inputName === 'next') {
				// const next = context.getValue({ obj: 'next' })
				// if (!next)
				// 	return outputData('error', {
				// 		error: 'No se ha definido la función "next"'
				// 	})
				// next()
				return
			}
			const { Kafka } = await dependency.getRequire('kafkajs')
			const config = {
				...(this.properties.config.value as object),
				brokers: (this.properties.brokers.value as { broker: { value: string } }[]).map((m) => m.broker.value)
			}
			const kafka = new Kafka(config)
			const consumer = kafka.consumer({
				groupId: this.properties.groupId.value
			})
			// Consuming
			await consumer.connect()
			await consumer.subscribe({
				topic: this.properties.topic.value,
				fromBeginning: true
			})

			// await consumer.run({
			//   autoCommit: false,
			//   eachMessage: async ({ topic, partition, message, heartbeat }) => {
			//     outputData('response', {
			//       partition,
			//       offset: message.offset,
			//       value: convertJson(message.value.toString())
			//     })
			//     consumer.pause([{ topic, partitions: [partition] }])
			//     setTimeout(() => {
			//       console.log('resume'); consumer.resume([{ topic }])
			//     }, 500)
			//   }
			// })
			const autoCommit = this.properties.autoCommit.value
			await consumer.run({
				autoCommit,
				eachBatchAutoResolve: autoCommit,
				eachBatch: async ({ commitOffsetsIfNecessary, batch, partition, resolveOffset, heartbeat, isRunning, isStale }: any) => {
					for (const message of batch.messages) {
						if (!isRunning() || isStale()) break
						outputData('response', {
							partition,
							offset: message.offset,
							value: convertJson(message.value.toString())
						})

						if (!autoCommit) {
							// await new Promise((resolve) => {
							// 	context.setValue({
							// 		obj: 'next',
							// 		value: async () => {
							// 			resolve(true)
							// 		}
							// 	})
							// })
							await resolveOffset(message.offset)
							await commitOffsetsIfNecessary(message.offset)
							await heartbeat()
						}
					}
				}
			})
		} catch (error) {
			let message = 'Error'
			if (error instanceof Error) message = error.toString()
			outputData('error', { error })
		}
	}
}
