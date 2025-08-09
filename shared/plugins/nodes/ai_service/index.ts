import type {
	IClassNode,
	classOnExecuteInterface,
	classOnCredential,
	classOnUpdateCredentialInterface
} from '@shared/interfaces/class.interface.js'
import type {
	IOptionsProperty,
	IStringProperty,
	ICredentialProperty,
	INumberProperty,
	ICodeProperty,
	IBoxType,
	ISwitchProperty
} from '@shared/interfaces/workflow.properties.interface.js'

// Configuración de proveedores de IA disponibles
const AI_PROVIDERS = [
	{ label: 'OpenAI', value: 'openai' },
	{ label: 'Anthropic (Claude)', value: 'anthropic' },
	{ label: 'Google (Gemini)', value: 'google' },
	{ label: 'Groq', value: 'groq' },
	{ label: 'Together AI', value: 'together' },
	{ label: 'Perplexity', value: 'perplexity' },
	{ label: 'Cohere', value: 'cohere' },
	{ label: 'Mistral AI', value: 'mistral' },
	{ label: 'xAI (Grok)', value: 'xai' }
]

// Configuración de tipos de mensaje
const MESSAGE_ROLES = [
	{ label: 'Sistema', value: 'system' },
	{ label: 'Usuario', value: 'user' },
	{ label: 'Asistente', value: 'assistant' }
]

// Configuración de formatos de respuesta
const RESPONSE_FORMATS = [
	{ label: 'Texto', value: 'text' },
	{ label: 'JSON', value: 'json_object' },
	{ label: 'JSON Schema', value: 'json_schema' }
]

export default class AIService implements IClassNode {
	accessSecrets = true
	dependencies = ['openai']

	info = {
		name: 'AI Service',
		desc: 'Nodo para conectar con servicios de IA como OpenAI, Claude, Gemini, etc.',
		icon: '󱙺',
		group: 'IA',
		color: '#10A37F',
		connectors: {
			inputs: ['input'],
			outputs: ['response', 'error']
		},
		isSingleton: true
	}

	properties = {
		credential: {
			name: 'Credencial',
			type: 'credential' as const,
			options: [],
			value: ''
		} as ICredentialProperty,

		modelInfo: {
			name: 'Modelo seleccionado:',
			type: 'box' as const,
			value: []
		} as IBoxType,

		message: {
			name: 'Mensaje',
			type: 'code' as const,
			lang: 'string',
			value: 'Hola, ¿cómo estás?',
			description: 'Mensaje a enviar a la IA'
		} as ICodeProperty,

		systemPrompt: {
			name: 'Prompt del sistema',
			type: 'code' as const,
			lang: 'string',
			value: 'Eres un asistente útil y amigable.',
			description: 'Instrucciones para el comportamiento de la IA'
		} as ICodeProperty,

		maxTokens: {
			name: 'Tokens máximos',
			type: 'number' as const,
			value: 1000,
			description: 'Número máximo de tokens en la respuesta'
		} as INumberProperty,

		temperature: {
			name: 'Temperatura',
			type: 'number' as const,
			value: 0.7,
			description: 'Creatividad de la respuesta (0.0 - 2.0)'
		} as INumberProperty,

		// Opciones avanzadas
		advancedOptions: {
			name: 'Opciones avanzadas',
			type: 'switch' as const,
			value: false
		} as ISwitchProperty,

		topP: {
			name: 'Top P',
			type: 'number' as const,
			value: 1,
			description: 'Nucleus sampling (0.0 - 1.0)',
			show: false
		} as INumberProperty,

		frequencyPenalty: {
			name: 'Penalización de frecuencia',
			type: 'number' as const,
			value: 0,
			description: 'Penaliza tokens repetidos (-2.0 - 2.0)',
			show: false
		} as INumberProperty,

		presencePenalty: {
			name: 'Penalización de presencia',
			type: 'number' as const,
			value: 0,
			description: 'Penaliza tokens ya utilizados (-2.0 - 2.0)',
			show: false
		} as INumberProperty,

		responseFormat: {
			name: 'Formato de respuesta',
			type: 'options' as const,
			options: RESPONSE_FORMATS,
			value: 'text',
			show: false
		} as IOptionsProperty,

		jsonSchema: {
			name: 'JSON Schema',
			type: 'code' as const,
			lang: 'json',
			value: '{\n  "type": "object",\n  "properties": {\n    "respuesta": {\n      "type": "string"\n    }\n  }\n}',
			description: 'Schema para respuestas JSON estructuradas',
			show: false
		} as ICodeProperty,

		conversationHistory: {
			name: 'Historial de conversación',
			type: 'switch' as const,
			value: false,
			description: 'Mantener contexto entre mensajes',
			show: false
		} as ISwitchProperty,

		seed: {
			name: 'Semilla',
			type: 'number' as const,
			value: 0,
			description: 'Semilla para reproducibilidad (0 = aleatorio)',
			show: false
		} as INumberProperty
	}

	credentials = {
		provider: {
			name: 'Proveedor de IA',
			type: 'options' as const,
			options: AI_PROVIDERS,
			value: 'openai',
			required: true
		} as IOptionsProperty,

		apiKey: {
			name: 'API Key',
			type: 'string' as const,
			value: '',
			required: true,
			description: 'Clave de API del proveedor seleccionado'
		} as IStringProperty,

		baseUrl: {
			name: 'Base URL',
			type: 'string' as const,
			value: '',
			description: 'URL base personalizada (opcional)',
			show: false
		} as IStringProperty,

		model: {
			name: 'Modelo',
			type: 'options' as const,
			options: [],
			value: '',
			required: true,
			description: 'Modelo de IA a utilizar'
		} as IOptionsProperty,

		organization: {
			name: 'Organización',
			type: 'string' as const,
			value: '',
			description: 'ID de organización (solo OpenAI)',
			show: false
		} as IStringProperty,

		project: {
			name: 'Proyecto',
			type: 'string' as const,
			value: '',
			description: 'ID de proyecto (solo OpenAI)',
			show: false
		} as IStringProperty
	}

	private getProviderBaseUrl(provider: string): string {
		const baseUrls: Record<string, string> = {
			openai: 'https://api.openai.com/v1',
			anthropic: 'https://api.anthropic.com',
			google: 'https://generativelanguage.googleapis.com/v1beta',
			groq: 'https://api.groq.com/openai/v1',
			together: 'https://api.together.xyz/v1',
			perplexity: 'https://api.perplexity.ai',
			cohere: 'https://api.cohere.ai/v1',
			mistral: 'https://api.mistral.ai/v1',
			xai: 'https://api.x.ai/v1'
		}

		return baseUrls[provider] || ''
	}

	private async getAIClient(credential: any, dependency: any) {
		const { api_key, provider, base_url, organization, project } = await credential.getCredential(String(this.properties.credential.value))

		const OpenAI = await dependency.getRequire('openai')

		const config: any = {
			apiKey: api_key
		}

		// Configurar URL base según el proveedor
		if (base_url) {
			config.baseURL = base_url
		} else {
			config.baseURL = this.getProviderBaseUrl(provider)
		}

		// Configuraciones específicas de OpenAI
		if (provider === 'openai') {
			if (organization) config.organization = organization
			if (project) config.project = project
		}

		return new OpenAI(config)
	}

	private buildMessages() {
		const messages = []

		// Agregar mensaje del sistema si existe
		if (this.properties.systemPrompt.value) {
			messages.push({
				role: 'system',
				content: String(this.properties.systemPrompt.value)
			})
		}

		// Agregar mensaje del usuario
		messages.push({
			role: 'user',
			content: String(
				typeof this.properties.message.value === 'object' ? JSON.stringify(this.properties.message.value) : this.properties.message.value
			)
		})

		return messages
	}

	private buildRequestParameters(modelName: string) {
		const params: any = {
			model: modelName,
			messages: this.buildMessages(),
			max_tokens: Number.parseInt(this.properties.maxTokens.value.toString()) || 1000,
			temperature: Number.parseFloat(this.properties.temperature.value.toString()) || 0.7
		}

		// Opciones avanzadas
		if (this.properties.advancedOptions.value === true) {
			if (this.properties.topP.value !== 1) {
				params.top_p = Number.parseFloat(this.properties.topP.value.toString())
			}

			if (this.properties.frequencyPenalty.value !== 0) {
				params.frequency_penalty = Number.parseFloat(this.properties.frequencyPenalty.value.toString())
			}

			if (this.properties.presencePenalty.value !== 0) {
				params.presence_penalty = Number.parseFloat(this.properties.presencePenalty.value.toString())
			}

			if (this.properties.seed.value !== 0) {
				params.seed = Number.parseInt(this.properties.seed.value.toString())
			}

			// Formato de respuesta
			if (this.properties.responseFormat.value !== 'text') {
				if (this.properties.responseFormat.value === 'json_object') {
					params.response_format = { type: 'json_object' }
				} else if (this.properties.responseFormat.value === 'json_schema') {
					try {
						const schema = JSON.parse(String(this.properties.jsonSchema.value))
						params.response_format = {
							type: 'json_schema',
							json_schema: {
								name: 'response',
								schema: schema,
								strict: true
							}
						}
					} catch (error) {
						console.warn('JSON Schema inválido, usando formato texto')
					}
				}
			}
		}

		return params
	}

	async onExecute({ outputData, dependency, credential }: classOnExecuteInterface) {
		try {
			// Obtener cliente de IA
			const aiClient = await this.getAIClient(credential, dependency)

			// Obtener información del modelo desde la credencial
			const credentialData = await credential.getCredential(String(this.properties.credential.value))
			const modelName = credentialData.model

			if (!modelName) {
				throw new Error('No se ha seleccionado un modelo en la credencial')
			}

			// Construir parámetros de la petición
			const requestParams = this.buildRequestParameters(modelName)

			// Realizar petición a la IA
			const completion = await aiClient.chat.completions.create(requestParams)

			// Extraer respuesta
			const response = completion.choices[0]?.message?.content || ''

			// Preparar datos de salida
			const outputResult = {
				response: response,
				model: modelName,
				provider: credentialData.provider,
				usage: completion.usage || {},
				finish_reason: completion.choices[0]?.finish_reason || 'unknown',
				metadata: {
					request_params: requestParams,
					completion_id: completion.id,
					created: completion.created
				}
			}

			outputData('response', outputResult)
		} catch (error: any) {
			const message = error?.message || 'Error desconocido'
			outputData('error', { error: `Error en AI Service: ${message}` })
		}
	}

	async onUpdateCredential({ properties, context }: classOnUpdateCredentialInterface) {
		function getModelsForProvider(provider: string): Array<{ label: string; value: string }> {
			const models: Record<string, Array<{ label: string; value: string }>> = {
				openai: [
					{ label: 'GPT-4o', value: 'gpt-4o' },
					{ label: 'GPT-4o mini', value: 'gpt-4o-mini' },
					{ label: 'GPT-4 Turbo', value: 'gpt-4-turbo' },
					{ label: 'GPT-4', value: 'gpt-4' },
					{ label: 'GPT-3.5 Turbo', value: 'gpt-3.5-turbo' },
					{ label: 'GPT-3.5 Turbo 16k', value: 'gpt-3.5-turbo-16k' }
				],
				anthropic: [
					{ label: 'Claude 3.5 Sonnet', value: 'claude-3-5-sonnet-20241022' },
					{ label: 'Claude 3.5 Haiku', value: 'claude-3-5-haiku-20241022' },
					{ label: 'Claude 3 Opus', value: 'claude-3-opus-20240229' },
					{ label: 'Claude 3 Sonnet', value: 'claude-3-sonnet-20240229' },
					{ label: 'Claude 3 Haiku', value: 'claude-3-haiku-20240307' }
				],
				google: [
					{ label: 'Gemini 1.5 Pro', value: 'gemini-1.5-pro' },
					{ label: 'Gemini 2.5 Flash', value: 'gemini-2.5-flash' },
					{ label: 'Gemini 1.0 Pro', value: 'gemini-1.0-pro' },
					{ label: 'Gemini Pro Vision', value: 'gemini-pro-vision' }
				],
				groq: [
					{ label: 'Llama 3.1 405B', value: 'llama-3.1-405b-reasoning' },
					{ label: 'Llama 3.1 70B', value: 'llama-3.1-70b-versatile' },
					{ label: 'Llama 3.1 8B', value: 'llama-3.1-8b-instant' },
					{ label: 'Mixtral 8x7B', value: 'mixtral-8x7b-32768' },
					{ label: 'Gemma 2 9B', value: 'gemma2-9b-it' }
				],
				together: [
					{ label: 'Llama 3.1 405B Instruct', value: 'meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo' },
					{ label: 'Llama 3.1 70B Instruct', value: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo' },
					{ label: 'Llama 3.1 8B Instruct', value: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo' },
					{ label: 'Qwen 2.5 72B Instruct', value: 'Qwen/Qwen2.5-72B-Instruct-Turbo' }
				],
				perplexity: [
					{ label: 'Sonar Small Chat', value: 'llama-3.1-sonar-small-128k-chat' },
					{ label: 'Sonar Large Chat', value: 'llama-3.1-sonar-large-128k-chat' },
					{ label: 'Sonar Huge Chat', value: 'llama-3.1-sonar-huge-128k-online' }
				],
				cohere: [
					{ label: 'Command R+', value: 'command-r-plus' },
					{ label: 'Command R', value: 'command-r' },
					{ label: 'Command', value: 'command' },
					{ label: 'Command Light', value: 'command-light' }
				],
				mistral: [
					{ label: 'Mistral Large', value: 'mistral-large-latest' },
					{ label: 'Mistral Medium', value: 'mistral-medium-latest' },
					{ label: 'Mistral Small', value: 'mistral-small-latest' },
					{ label: 'Mistral 7B', value: 'open-mistral-7b' }
				],
				xai: [
					{ label: 'Grok Beta', value: 'grok-beta' },
					{ label: 'Grok 2', value: 'grok-2' },
					{ label: 'Grok 2 Mini', value: 'grok-2-mini' }
				]
			}

			return models[provider] || []
		}

		function getProviderBaseUrl(provider: string): string {
			const baseUrls: Record<string, string> = {
				openai: 'https://api.openai.com/v1',
				anthropic: 'https://api.anthropic.com',
				google: 'https://generativelanguage.googleapis.com/v1beta',
				groq: 'https://api.groq.com/openai/v1',
				together: 'https://api.together.xyz/v1',
				perplexity: 'https://api.perplexity.ai',
				cohere: 'https://api.cohere.ai/v1',
				mistral: 'https://api.mistral.ai/v1',
				xai: 'https://api.x.ai/v1'
			}

			return baseUrls[provider] || ''
		}
		// Actualizar modelos disponibles según el proveedor seleccionado
		const provider = String(properties.provider.value)
		const models = getModelsForProvider(provider)

		// Verificar que properties.model es de tipo IOptionsProperty
		if (properties.model.type === 'options') {
			;(properties.model as IOptionsProperty).options = models
			if (models.length > 0 && !properties.model.value) {
				properties.model.value = models[0].value
			}
		}

		// Mostrar/ocultar campos según el proveedor
		properties.baseUrl.show = provider !== 'openai'
		properties.organization.show = provider === 'openai'
		properties.project.show = provider === 'openai'

		// Establecer URL base por defecto si no está definida
		if (!properties.baseUrl.value) {
			properties.baseUrl.value = getProviderBaseUrl(provider)
		}
	}

	async onCredential({ credentials, client }: classOnCredential) {
		const { provider, apiKey, baseUrl, model, organization, project } = credentials as any

		// Validar campos requeridos
		if (!provider.value || !apiKey.value || !model.value) {
			throw new Error('Faltan campos obligatorios: proveedor, API key y modelo')
		}

		// Estos datos se guardarán y se utilizarán en el onExecute
		return {
			status: true,
			data: {
				provider: provider.value,
				api_key: apiKey.value,
				base_url: baseUrl.value || this.getProviderBaseUrl(provider.value),
				model: model.value,
				organization: organization.value || '',
				project: project.value || ''
			}
		}
	}

	async onUpdateProperties({ properties, context }: any) {
		// Mostrar/ocultar opciones avanzadas
		const showAdvanced = properties.advancedOptions.value === true

		properties.topP.show = showAdvanced
		properties.frequencyPenalty.show = showAdvanced
		properties.presencePenalty.show = showAdvanced
		properties.responseFormat.show = showAdvanced
		properties.jsonSchema.show = showAdvanced && properties.responseFormat.value === 'json_schema'
		properties.conversationHistory.show = showAdvanced
		properties.seed.show = showAdvanced

		// Actualizar información del modelo seleccionado
		if (properties.credential.value) {
			try {
				// Obtener información de la credencial desde el contexto
				const credentialInfo = context.getCredentialInfo ? context.getCredentialInfo(properties.credential.value) : null

				if (credentialInfo?.model && credentialInfo.provider) {
					const providerLabel = AI_PROVIDERS.find((p) => p.value === credentialInfo.provider)?.label || credentialInfo.provider
					properties.modelInfo.value = [
						{
							label: 'Proveedor:',
							value: providerLabel,
							isCopy: false
						},
						{
							label: 'Modelo:',
							value: credentialInfo.model,
							isCopy: true
						}
					]
				} else {
					properties.modelInfo.value = [
						{
							label: 'Estado:',
							value: 'Credencial configurada - modelo disponible',
							isCopy: false
						}
					]
				}
			} catch (error) {
				properties.modelInfo.value = [
					{
						label: 'Error:',
						value: 'No se pudo obtener información del modelo',
						isCopy: false
					}
				]
			}
		} else {
			properties.modelInfo.value = [
				{
					label: 'Estado:',
					value: 'Selecciona una credencial para ver el modelo',
					isCopy: false
				}
			]
		}
	}
}
