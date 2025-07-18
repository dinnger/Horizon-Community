import type { IClassNode, classOnExecuteInterface, infoInterface } from '@shared/interfaces/class.interface.js'
import type {
	IPropertiesType,
	IOptionsProperty,
	IStringProperty,
	ICodeProperty,
	INumberProperty,
	ISwitchProperty
} from '@shared/interfaces/workflow.properties.interface.js'

interface IProperties extends IPropertiesType {
	serverCommand: IStringProperty
	serverArgs: ICodeProperty
	transport: IOptionsProperty
	host: IStringProperty
	port: INumberProperty
	operation: IOptionsProperty
	toolName: IStringProperty
	toolParams: ICodeProperty
	resourceUri: IStringProperty
	timeout: INumberProperty
	autoRestart: ISwitchProperty
	logLevel: IOptionsProperty
}

export default class implements IClassNode<IProperties> {
	// ===============================================
	// Dependencias
	// ===============================================
	// #pk @modelcontextprotocol/sdk
	// #pk child_process
	// ===============================================
	constructor(
		public dependencies: string[],
		public info: infoInterface,
		public properties: IProperties
	) {
		this.dependencies = ['@modelcontextprotocol/sdk', 'child_process']
		this.info = {
			name: 'MCP Server',
			desc: 'Conecta con servidores MCP (Model Context Protocol)',
			icon: '󰀵',
			group: 'Servicios',
			color: '#9B59B6',
			connectors: {
				inputs: ['input'],
				outputs: ['response', 'error']
			},
			isSingleton: false
		}

		this.properties = {
			serverCommand: {
				name: 'Comando del servidor',
				type: 'string',
				value: '',
				description: 'Comando para iniciar el servidor MCP (ej: python, node, etc.)',
				required: true
			},
			serverArgs: {
				name: 'Argumentos del servidor',
				type: 'code',
				lang: 'json',
				value: '[\n  "/path/to/server.py"\n]',
				description: 'Array JSON con los argumentos para el servidor MCP'
			},
			transport: {
				name: 'Tipo de transporte',
				type: 'options',
				options: [
					{
						label: 'Standard Input/Output',
						value: 'stdio'
					},
					{
						label: 'Server-Sent Events',
						value: 'sse'
					}
				],
				value: 'stdio',
				description: 'Método de comunicación con el servidor MCP'
			},
			host: {
				name: 'Host',
				type: 'string',
				value: 'localhost',
				description: 'Host para transporte SSE'
			},
			port: {
				name: 'Puerto',
				type: 'number',
				value: 3000,
				description: 'Puerto para transporte SSE'
			},
			operation: {
				name: 'Operación',
				type: 'options',
				options: [
					{
						label: 'Listar herramientas',
						value: 'list_tools'
					},
					{
						label: 'Llamar herramienta',
						value: 'call_tool'
					},
					{
						label: 'Listar recursos',
						value: 'list_resources'
					},
					{
						label: 'Leer recurso',
						value: 'read_resource'
					},
					{
						label: 'Listar prompts',
						value: 'list_prompts'
					},
					{
						label: 'Obtener prompt',
						value: 'get_prompt'
					}
				],
				value: 'list_tools',
				description: 'Operación a realizar en el servidor MCP'
			},
			toolName: {
				name: 'Nombre de la herramienta',
				type: 'string',
				value: '',
				description: 'Nombre de la herramienta a llamar'
			},
			toolParams: {
				name: 'Parámetros de la herramienta',
				type: 'code',
				lang: 'json',
				value: '{}',
				description: 'Parámetros JSON para la herramienta'
			},
			resourceUri: {
				name: 'URI del recurso',
				type: 'string',
				value: '',
				description: 'URI del recurso a leer'
			},
			timeout: {
				name: 'Timeout (ms)',
				type: 'number',
				value: 30000,
				description: 'Tiempo límite para operaciones en milisegundos'
			},
			autoRestart: {
				name: 'Reinicio automático',
				type: 'switch',
				value: true,
				description: 'Reiniciar automáticamente el servidor si falla'
			},
			logLevel: {
				name: 'Nivel de log',
				type: 'options',
				options: [
					{
						label: 'Error',
						value: 'error'
					},
					{
						label: 'Warn',
						value: 'warn'
					},
					{
						label: 'Info',
						value: 'info'
					},
					{
						label: 'Debug',
						value: 'debug'
					}
				],
				value: 'info',
				description: 'Nivel de logging para el servidor MCP'
			}
		}
	}

	async onCreate() {
		// Mostrar/ocultar campos según el tipo de transporte
		const isSSE = this.properties.transport.value === 'sse'
		this.properties.host.show = isSSE
		this.properties.port.show = isSSE

		// Mostrar/ocultar campos según la operación
		const operation = this.properties.operation.value
		this.properties.toolName.show = operation === 'call_tool'
		this.properties.toolParams.show = operation === 'call_tool'
		this.properties.resourceUri.show = operation === 'read_resource'
	}

	private mcpClient: any = null
	private serverProcess: any = null

	async onExecute({ outputData, dependency, logger, inputData }: classOnExecuteInterface) {
		const { Client } = await dependency.getRequire('@modelcontextprotocol/sdk/client/index.js')
		const { StdioClientTransport } = await dependency.getRequire('@modelcontextprotocol/sdk/client/stdio.js')
		const { SSEClientTransport } = await dependency.getRequire('@modelcontextprotocol/sdk/client/sse.js')
		const { spawn } = await dependency.getRequire('child_process')

		try {
			// Inicializar cliente MCP si no existe
			if (!this.mcpClient) {
				await this.initializeMCPClient(dependency, logger)
			}

			const operation = this.properties.operation.value
			let result: any

			switch (operation) {
				case 'list_tools':
					result = await this.mcpClient.listTools()
					break

				case 'call_tool': {
					if (!this.properties.toolName.value) {
						throw new Error('Nombre de herramienta requerido')
					}

					const toolParams = this.properties.toolParams.value
						? typeof this.properties.toolParams.value === 'string'
							? JSON.parse(this.properties.toolParams.value)
							: this.properties.toolParams.value
						: {}

					result = await this.mcpClient.callTool({
						name: this.properties.toolName.value,
						arguments: toolParams
					})
					break
				}

				case 'list_resources':
					result = await this.mcpClient.listResources()
					break

				case 'read_resource':
					if (!this.properties.resourceUri.value) {
						throw new Error('URI del recurso requerido')
					}

					result = await this.mcpClient.readResource({
						uri: this.properties.resourceUri.value
					})
					break

				case 'list_prompts':
					result = await this.mcpClient.listPrompts()
					break

				case 'get_prompt':
					// Implementar según necesidades específicas
					result = await this.mcpClient.getPrompt({
						name: this.properties.toolName.value || 'default'
					})
					break

				default:
					throw new Error(`Operación no soportada: ${operation}`)
			}

			outputData('response', {
				result,
				operation,
				timestamp: new Date().toISOString()
			})
		} catch (error: any) {
			logger.error('Error en MCP Server:', error)

			// Intentar reiniciar si está habilitado
			if (this.properties.autoRestart.value && this.mcpClient) {
				try {
					await this.cleanup()
					await this.initializeMCPClient(dependency, logger)
					logger.info('Servidor MCP reiniciado exitosamente')
				} catch (restartError) {
					logger.error('Error al reiniciar servidor MCP:', restartError)
				}
			}

			let message = 'Error en servidor MCP: '
			if (error instanceof Error) {
				message += error.message
			} else {
				message += String(error)
			}

			outputData('error', {
				error: message,
				operation: this.properties.operation.value,
				timestamp: new Date().toISOString()
			})
		}
	}

	private async initializeMCPClient(dependency: any, logger: any) {
		const { Client } = await dependency.getRequire('@modelcontextprotocol/sdk/client/index.js')
		const { spawn } = await dependency.getRequire('child_process')

		if (this.properties.transport.value === 'stdio') {
			const { StdioClientTransport } = await dependency.getRequire('@modelcontextprotocol/sdk/client/stdio.js')

			// Parsear argumentos del servidor
			const serverArgs = this.properties.serverArgs.value
				? typeof this.properties.serverArgs.value === 'string'
					? JSON.parse(this.properties.serverArgs.value)
					: this.properties.serverArgs.value
				: []

			// Crear proceso del servidor
			this.serverProcess = spawn(this.properties.serverCommand.value, serverArgs, {
				stdio: ['pipe', 'pipe', 'pipe']
			})

			// Manejar errores del proceso
			this.serverProcess.on('error', (error: any) => {
				logger.error('Error en proceso del servidor MCP:', error)
			})

			this.serverProcess.on('exit', (code: number) => {
				logger.info(`Servidor MCP terminó con código: ${code}`)
			})

			// Crear transporte stdio
			const transport = new StdioClientTransport({
				readable: this.serverProcess.stdout,
				writable: this.serverProcess.stdin
			})

			// Crear cliente
			this.mcpClient = new Client(
				{
					name: 'horizon3-mcp-client',
					version: '1.0.0'
				},
				{
					capabilities: {}
				}
			)

			await this.mcpClient.connect(transport)
		} else if (this.properties.transport.value === 'sse') {
			const { SSEClientTransport } = await dependency.getRequire('@modelcontextprotocol/sdk/client/sse.js')

			const transport = new SSEClientTransport(new URL(`http://${this.properties.host.value}:${this.properties.port.value}/sse`))

			this.mcpClient = new Client(
				{
					name: 'horizon3-mcp-client',
					version: '1.0.0'
				},
				{
					capabilities: {}
				}
			)

			await this.mcpClient.connect(transport)
		}

		logger.info('Cliente MCP inicializado exitosamente')
	}

	private async cleanup() {
		if (this.mcpClient) {
			try {
				await this.mcpClient.close()
			} catch (error) {
				// Ignorar errores de cierre
			}
			this.mcpClient = null
		}

		if (this.serverProcess) {
			try {
				this.serverProcess.kill('SIGTERM')

				// Esperar un poco y forzar si es necesario
				setTimeout(() => {
					if (this.serverProcess && !this.serverProcess.killed) {
						this.serverProcess.kill('SIGKILL')
					}
				}, 5000)
			} catch (error) {
				// Ignorar errores de terminación
			}
			this.serverProcess = null
		}
	}

	async onDestroy() {
		await this.cleanup()
	}
}
