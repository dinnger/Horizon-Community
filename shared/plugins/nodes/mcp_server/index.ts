import type { IClassNode, classOnExecuteInterface, classOnUpdateInterface } from '@shared/interfaces/class.interface.js'
import type {
	ICodeProperty,
	IListProperty,
	IStringProperty,
	INumberProperty,
	ISwitchProperty
} from '@shared/interfaces/workflow.properties.interface.js'

export default class implements IClassNode {
	public meta: { [key: string]: any } = {}
	dependencies = ['@modelcontextprotocol/sdk', 'zod']
	info = {
		name: 'MCP Server',
		desc: 'Model Context Protocol Server - Expone herramientas y recursos a través de MCP',
		icon: '🔌',
		group: 'MCP',
		color: '#2E86AB',
		connectors: {
			inputs: [{ name: 'init' }, { name: 'stop' }],
			outputs: [{ name: 'ready' }, { name: 'tool_echo' }, { name: 'error' }]
		}
	}

	properties = {
		serverName: {
			type: 'string',
			name: 'Nombre del servidor:',
			value: 'horizon-mcp-server',
			description: 'Nombre identificador del servidor MCP',
			required: true
		} as IStringProperty,

		version: {
			type: 'string',
			name: 'Versión:',
			value: '1.0.0',
			description: 'Versión del servidor MCP'
		} as IStringProperty,

		transport: {
			type: 'options',
			name: 'Tipo de transporte:',
			value: 'stdio',
			options: [{ label: 'Standard I/O', value: 'stdio' }],
			description: 'Método de comunicación con el cliente MCP'
		} as any,

		enableLogging: {
			type: 'switch',
			name: 'Habilitar logging:',
			value: true,
			description: 'Habilitar logs detallados del servidor MCP'
		} as ISwitchProperty,

		tools: {
			type: 'list',
			name: 'Herramientas (Tools):',
			tabLabel: 'name',
			description: 'Lista de herramientas disponibles en el servidor MCP',
			object: {
				name: {
					name: 'Nombre de la herramienta:',
					value: '',
					type: 'string',
					description: 'Nombre único de la herramienta',
					required: true
				} as IStringProperty,

				description: {
					name: 'Descripción:',
					value: '',
					type: 'string',
					description: 'Descripción de qué hace la herramienta'
				} as IStringProperty,

				inputSchema: {
					name: 'Esquema de entrada (JSON Schema):',
					type: 'code',
					lang: 'json',
					value:
						'{\n  "type": "object",\n  "properties": {\n    "input": {\n      "type": "string",\n      "description": "Parámetro de entrada"\n    }\n  },\n  "required": ["input"]\n}',
					autocomplete: 'ajv',
					description: 'Esquema JSON que define los parámetros de entrada de la herramienta'
				} as ICodeProperty,

				outputSchema: {
					name: 'Esquema de salida (JSON Schema):',
					type: 'code',
					lang: 'json',
					value:
						'{\n  "type": "object",\n  "properties": {\n    "result": {\n      "type": "string",\n      "description": "Resultado de la herramienta"\n    }\n  }\n}',
					autocomplete: 'ajv',
					description: 'Esquema JSON que define la estructura de respuesta de la herramienta'
				} as ICodeProperty,

				timeout: {
					name: 'Timeout (ms):',
					value: 30000,
					type: 'number',
					description: 'Tiempo máximo de ejecución en milisegundos',
					min: 1000,
					max: 300000
				} as INumberProperty,

				enabled: {
					type: 'switch',
					name: 'Habilitada:',
					value: true,
					description: 'Si la herramienta está habilitada o no'
				} as ISwitchProperty
			},
			value: [
				{
					name: {
						name: 'Nombre de la herramienta:',
						value: 'echo',
						type: 'string',
						description: 'Nombre único de la herramienta',
						required: true
					},
					description: {
						name: 'Descripción:',
						value: 'Herramienta de ejemplo que hace eco del input',
						type: 'string',
						description: 'Descripción de qué hace la herramienta'
					},
					inputSchema: {
						name: 'Esquema de entrada (JSON Schema):',
						type: 'code',
						lang: 'json',
						value:
							'{\n  "type": "object",\n  "properties": {\n    "message": {\n      "type": "string",\n      "description": "Mensaje a hacer eco"\n    }\n  },\n  "required": ["message"]\n}',
						autocomplete: 'ajv',
						description: 'Esquema JSON que define los parámetros de entrada de la herramienta'
					},
					outputSchema: {
						name: 'Esquema de salida (JSON Schema):',
						type: 'code',
						lang: 'json',
						value:
							'{\n  "type": "object",\n  "properties": {\n    "echo": {\n      "type": "string",\n      "description": "Mensaje de eco"\n    }\n  }\n}',
						autocomplete: 'ajv',
						description: 'Esquema JSON que define la estructura de respuesta de la herramienta'
					},
					timeout: {
						name: 'Timeout (ms):',
						value: 5000,
						type: 'number',
						description: 'Tiempo máximo de ejecución en milisegundos',
						min: 1000,
						max: 300000
					},
					enabled: {
						type: 'switch',
						name: 'Habilitada:',
						value: true,
						description: 'Si la herramienta está habilitada o no'
					}
				}
			]
		} as IListProperty
	}

	private mcpServer: any = null
	private isRunning = false

	async onUpdateProperties({ properties, connectors }: classOnUpdateInterface<this['properties']>) {
		const tools = properties.tools.value
		connectors.outputs = [{ name: 'ready' }, { name: 'error' }]

		// Agregar un output por cada herramienta habilitada
		for (let i = 0; i < tools.length; i++) {
			const tool = tools[i]
			const toolName = `tool_${tool.name?.value}` || `tool_${i + 1}`
			const isEnabled = tool.enabled?.value !== false

			if (isEnabled) {
				connectors.outputs.push({ name: String(toolName) })
			}
		}
	}

	async onExecute({ inputData, outputData, dependency, logger }: classOnExecuteInterface): Promise<void> {
		const inputName = inputData.inputName

		try {
			if (inputName === 'init') {
				await this.startMCPServer(outputData, dependency, logger)
			} else if (inputName === 'stop') {
				await this.stopMCPServer(outputData, logger)
			}
		} catch (error) {
			let message = 'Error en MCP Server'
			if (error instanceof Error) message = error.message

			if (this.properties.enableLogging.value) {
				logger.error('MCP Server Error:', error)
			}

			outputData('error', { error: message })
		}
	}

	private async startMCPServer(outputData: classOnExecuteInterface['outputData'], dependency: any, logger: any): Promise<void> {
		if (this.isRunning) {
			outputData('error', { error: 'El servidor MCP ya está ejecutándose' })
			return
		}

		try {
			// Importar SDK de MCP usando la nueva API
			const { McpServer } = await dependency.getRequire('@modelcontextprotocol/sdk/server/mcp.js')
			const { StdioServerTransport } = await dependency.getRequire('@modelcontextprotocol/sdk/server/stdio.js')
			const { z } = await dependency.getRequire('zod')

			// Crear servidor MCP usando la nueva API
			const server = new McpServer({
				name: this.properties.serverName.value,
				version: this.properties.version.value
			})

			// Registrar herramientas usando la nueva API
			const enabledTools = this.getEnabledTools()
			for (const tool of enabledTools) {
				if (this.properties.enableLogging.value) {
					logger.info(`Registrando herramienta: ${tool.name}`)
				}

				// Crear esquema de entrada usando zod
				let inputSchema: any = {}
				try {
					const parsedSchema = JSON.parse(tool.inputSchema)
					// Convertir propiedades JSON Schema a esquemas zod
					if (parsedSchema?.properties) {
						inputSchema = Object.fromEntries(
							Object.entries(parsedSchema.properties).map(([key, value]: [string, any]) => {
								if (value.type === 'string') return [key, z.string().optional()]
								if (value.type === 'number') return [key, z.number().optional()]
								if (value.type === 'boolean') return [key, z.boolean().optional()]
								return [key, z.any().optional()]
							})
						)
					}
				} catch (error) {
					if (this.properties.enableLogging.value) {
						logger.error(`Error parseando esquema de ${tool.name}:`, error)
					}
					inputSchema = { input: z.any().optional() } // fallback
				}

				// Registrar la herramienta
				server.registerTool(
					tool.name,
					{
						title: tool.name,
						description: tool.description,
						inputSchema: inputSchema
					},
					async (args: any) => {
						if (this.properties.enableLogging.value) {
							logger.info(`Ejecutando herramienta: ${tool.name}`, args)
						}

						// Configurar timeout
						const timeout = tool.timeout || 30000
						const timeoutPromise = new Promise((_, reject) => {
							setTimeout(() => reject(new Error('Timeout de herramienta')), timeout)
						})

						// Crear callback para manejar la respuesta
						const executionPromise = new Promise((resolve, reject) => {
							const toolOutputName = `tool_${tool.name}`
							outputData(
								toolOutputName,
								{
									toolName: tool.name,
									arguments: args,
									requestId: `mcp-${Date.now()}`,
									timestamp: new Date().toISOString()
								},
								undefined,
								(response: any) => {
									if (response?.error) {
										reject(new Error(response.error))
									} else {
										resolve(response)
									}
								}
							)
						})

						try {
							// Ejecutar con timeout
							const result = await Promise.race([executionPromise, timeoutPromise])

							if (this.properties.enableLogging.value) {
								logger.info(`Herramienta ${tool.name} ejecutada exitosamente`)
							}

							// Retornar en formato MCP
							return {
								content: [
									{
										type: 'text',
										text: typeof result === 'string' ? result : JSON.stringify(result, null, 2)
									}
								]
							}
						} catch (error) {
							if (this.properties.enableLogging.value) {
								logger.error(`Error ejecutando herramienta ${tool.name}:`, error)
							}

							// Retornar error en formato MCP
							return {
								content: [
									{
										type: 'text',
										text: `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`
									}
								],
								isError: true
							}
						}
					}
				)
			}

			// Configurar transporte - solo stdio por ahora
			const transport = new StdioServerTransport()

			if (this.properties.enableLogging.value) {
				logger.info('MCP Server (Stdio) configurado')
			}

			// Conectar servidor con transporte
			await server.connect(transport)

			this.mcpServer = server
			this.isRunning = true

			if (this.properties.enableLogging.value) {
				logger.info('MCP Server iniciado exitosamente')
			}

			outputData('ready', {
				serverName: this.properties.serverName.value,
				version: this.properties.version.value,
				transport: this.properties.transport.value,
				tools: enabledTools.map((t) => t.name),
				timestamp: new Date().toISOString()
			})
		} catch (error) {
			throw new Error(`Error al iniciar servidor MCP: ${error}`)
		}
	}

	private async stopMCPServer(outputData: classOnExecuteInterface['outputData'], logger: any): Promise<void> {
		if (!this.isRunning || !this.mcpServer) {
			outputData('error', { error: 'El servidor MCP no está ejecutándose' })
			return
		}

		try {
			// Cerrar el servidor MCP
			await this.mcpServer.close()

			this.isRunning = false
			this.mcpServer = null

			if (this.properties.enableLogging.value) {
				logger.info('MCP Server detenido')
			}

			outputData('ready', {
				status: 'stopped',
				timestamp: new Date().toISOString()
			})
		} catch (error) {
			throw new Error(`Error al detener servidor MCP: ${error}`)
		}
	}

	private getEnabledTools(): any[] {
		return this.properties.tools.value
			.filter((tool) => tool.enabled?.value !== false)
			.map((tool) => ({
				name: tool.name?.value || '',
				description: tool.description?.value || '',
				inputSchema: String(tool.inputSchema?.value || '{}'),
				timeout: tool.timeout?.value || 30000
			}))
	}

	private findTool(toolName: string): any {
		return this.properties.tools.value.find((tool) => tool.name?.value === toolName)
	}

	onDestroy(): void {
		if (this.isRunning && this.mcpServer) {
			if (this.mcpServer.close) {
				this.mcpServer.close().catch(() => {
					// Ignore errors during cleanup
				})
			}
			this.isRunning = false
			this.mcpServer = null
		}
	}
}
