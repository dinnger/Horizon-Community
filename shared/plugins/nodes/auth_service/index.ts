import type { IClassNode, classOnUpdateInterface, classOnExecuteInterface, infoInterface } from '@shared/interfaces/class.interface.js'
import type {
	ICodeProperty,
	IOptionsProperty,
	IPropertiesType,
	ISecretProperty,
	IStringProperty,
	ISwitchProperty
} from '@shared/interfaces/workflow.properties.interface.js'

interface IProperties extends IPropertiesType {
	serviceName: IStringProperty
	authMethod: IOptionsProperty

	// OAuth2
	authUrl: IStringProperty
	tokenUrl: IStringProperty
	clientId: IStringProperty
	clientSecret: IStringProperty
	redirectUri: IStringProperty
	scopes: IStringProperty

	// API Keys & Tokens
	apiKey: IStringProperty
	apiKeyHeaderName: IStringProperty
	apiSecret: IStringProperty
	apiSecretHeaderName: IStringProperty

	// Bearer & Basic Auth
	token: IStringProperty
	username: IStringProperty
	password: IStringProperty

	// Config general
	useSecret: ISwitchProperty
	authSecret: ISecretProperty
	extraParams: ICodeProperty
	extraHeaders: ICodeProperty
	storeToken: ISwitchProperty
	tokenName: IStringProperty
}

export default class AuthServiceNode implements IClassNode {
	constructor(
		public accessSecrets: boolean,
		public dependencies: string[],
		public info: infoInterface,
		public properties: IProperties
	) {
		this.accessSecrets = true
		this.dependencies = ['axios', 'crypto', 'querystring']
		this.info = {
			name: 'Autenticación',
			desc: 'Gestiona la autenticación con cualquier servicio que requiera autenticación',
			icon: '󰌆',
			group: 'Autenticación',
			color: '#4CAF50',
			connectors: {
				inputs: ['input'],
				outputs: ['credentials', 'error']
			}
		}

		this.properties = {
			serviceName: {
				name: 'Nombre del servicio',
				type: 'string',
				value: '',
				description: 'Un nombre descriptivo para este servicio (ej. Spotify, Google Drive, etc.)'
			},
			authMethod: {
				name: 'Método de autenticación',
				type: 'options',
				options: [
					{
						label: 'OAuth 2.0',
						value: 'oauth2'
					},
					{
						label: 'API Key',
						value: 'apikey'
					},
					{
						label: 'Token Bearer',
						value: 'bearer'
					},
					{
						label: 'Basic Auth',
						value: 'basic'
					},
					{
						label: 'Custom Headers',
						value: 'custom'
					}
				],
				value: 'oauth2'
			},
			// OAuth2 properties
			authUrl: {
				name: 'URL de autorización',
				type: 'string',
				value: '',
				show: true,
				description: 'URL para solicitar autorización (ej. https://accounts.google.com/o/oauth2/v2/auth)'
			},
			tokenUrl: {
				name: 'URL de token',
				type: 'string',
				value: '',
				show: true,
				description: 'URL para obtener token (ej. https://oauth2.googleapis.com/token)'
			},
			clientId: {
				name: 'Client ID',
				type: 'string',
				value: '',
				show: true
			},
			clientSecret: {
				name: 'Client Secret',
				type: 'string',
				value: '',
				show: true
			},
			redirectUri: {
				name: 'URI de redirección',
				type: 'string',
				value: '',
				show: true
			},
			scopes: {
				name: 'Permisos (scopes)',
				type: 'string',
				value: '',
				description: 'Separados por espacios',
				show: true
			},
			// API Key properties
			apiKey: {
				name: 'API Key',
				type: 'string',
				value: '',
				show: false
			},
			apiKeyHeaderName: {
				name: 'Nombre del header para API Key',
				type: 'string',
				value: 'X-Api-Key',
				show: false
			},
			apiSecret: {
				name: 'API Secret',
				type: 'string',
				value: '',
				show: false
			},
			apiSecretHeaderName: {
				name: 'Nombre del header para API Secret',
				type: 'string',
				value: 'X-Api-Secret',
				show: false
			},
			// Bearer & Basic properties
			token: {
				name: 'Token',
				type: 'string',
				value: '',
				show: false
			},
			username: {
				name: 'Usuario',
				type: 'string',
				value: '',
				show: false
			},
			password: {
				name: 'Contraseña',
				type: 'string',
				value: '',
				show: false
			},
			// Secret Management
			useSecret: {
				name: 'Usar secretos almacenados',
				type: 'switch',
				value: false
			},
			authSecret: {
				name: 'Secreto de autenticación',
				type: 'secret',
				secretType: 'VARIABLES',
				options: [],
				value: '',
				show: false
			},
			// Configuración adicional
			extraParams: {
				name: 'Parámetros adicionales',
				type: 'code',
				lang: 'json',
				value: '{}',
				show: true
			},
			extraHeaders: {
				name: 'Headers adicionales',
				type: 'code',
				lang: 'json',
				value: '{}',
				show: true
			},
			storeToken: {
				name: 'Almacenar token/credenciales',
				type: 'switch',
				value: true
			},
			tokenName: {
				name: 'Nombre para almacenar',
				type: 'string',
				value: '',
				description: 'Nombre para identificar estas credenciales',
				show: true
			}
		}
	}

	async onUpdateProperties({ context }: classOnUpdateInterface): Promise<void> {
		// Mostrar/ocultar campos según el método de autenticación seleccionado
		this.hideAllAuthFields()

		const authMethod = this.properties.authMethod.value as string

		// Si se usa secretos, mostrar selector de secretos y ocultar campos de credenciales
		if (this.properties.useSecret.value) {
			this.properties.authSecret.show = true

			const secrets = await context.getSecrets('variables')

			if (secrets) {
				this.properties.authSecret.options = secrets
			}
		} else {
			this.properties.authSecret.show = false

			// Mostrar campos según el método de autenticación
			switch (authMethod) {
				case 'oauth2':
					this.properties.authUrl.show = true
					this.properties.tokenUrl.show = true
					this.properties.clientId.show = true
					this.properties.clientSecret.show = true
					this.properties.redirectUri.show = true
					this.properties.scopes.show = true

					// Sugerir URI de redirección si está vacía
					if (!this.properties.redirectUri.value) {
						this.properties.redirectUri.value = `${context.getEnvironment('serverUrl')}/auth/callback`
					}
					break

				case 'apikey':
					this.properties.apiKey.show = true
					this.properties.apiKeyHeaderName.show = true
					this.properties.apiSecret.show = true
					this.properties.apiSecretHeaderName.show = true
					break

				case 'bearer':
					this.properties.token.show = true
					break

				case 'basic':
					this.properties.username.show = true
					this.properties.password.show = true
					break

				case 'custom':
					this.properties.extraHeaders.show = true
					break
			}
		}

		// Configurar nombre sugerido para el token si está vacío
		if (!this.properties.tokenName.value && this.properties.serviceName.value) {
			this.properties.tokenName.value = `${this.properties.serviceName.value.toLowerCase().replace(/\s+/g, '_')}_${authMethod}_token`
		}
	}

	async onExecute({ outputData, dependency }: classOnExecuteInterface) {
		const axios = await dependency.getRequire('axios')
		const querystring = await dependency.getRequire('querystring')
		const crypto = await dependency.getRequire('crypto')

		try {
			// Obtener configuración básica
			const serviceName = this.properties.serviceName.value
			const authMethod = this.properties.authMethod.value as string

			// Obtener credenciales (desde inputs directos o secretos)
			let credentials: any = {}

			if (this.properties.useSecret.value) {
				if (!this.properties.authSecret.value) {
					return outputData('error', {
						error: 'No se especificó el secreto de autenticación'
					})
				}

				const [type, subType, name] = this.properties.authSecret.value.toString().split('_')

				credentials = await dependency.getSecret({ type, subType, name })

				if (!credentials) {
					return outputData('error', {
						error: 'No se encontraron credenciales en el secreto'
					})
				}
			} else {
				// Cargar credenciales según el método de autenticación
				switch (authMethod) {
					case 'oauth2':
						credentials = {
							authUrl: this.properties.authUrl.value,
							tokenUrl: this.properties.tokenUrl.value,
							clientId: this.properties.clientId.value,
							clientSecret: this.properties.clientSecret.value,
							redirectUri: this.properties.redirectUri.value,
							scopes: this.properties.scopes.value
						}
						break

					case 'apikey':
						credentials = {
							apiKey: this.properties.apiKey.value,
							apiKeyHeaderName: this.properties.apiKeyHeaderName.value,
							apiSecret: this.properties.apiSecret.value,
							apiSecretHeaderName: this.properties.apiSecretHeaderName.value
						}
						break

					case 'bearer':
						credentials = {
							token: this.properties.token.value
						}
						break

					case 'basic':
						credentials = {
							username: this.properties.username.value,
							password: this.properties.password.value
						}
						break

					case 'custom':
						credentials = {
							// Para custom, las credenciales se definen en los headers adicionales
						}
						break
				}
			}

			// Extraer parámetros y headers adicionales
			let extraParams = {}
			let extraHeaders = {}

			try {
				const extraParamsValue = this.properties.extraParams.value
				if (typeof extraParamsValue === 'string' && extraParamsValue.trim() !== '') {
					extraParams = JSON.parse(extraParamsValue)
				} else if (typeof extraParamsValue === 'object') {
					extraParams = extraParamsValue
				}

				const extraHeadersValue = this.properties.extraHeaders.value
				if (typeof extraHeadersValue === 'string' && extraHeadersValue.trim() !== '') {
					extraHeaders = JSON.parse(extraHeadersValue)
				} else if (typeof extraHeadersValue === 'object') {
					extraHeaders = extraHeadersValue
				}
			} catch (error) {
				console.error('Error al parsear parámetros o headers adicionales:', error)
			}

			// Generar credenciales y tokens según el método de autenticación
			let authResult: any = {
				serviceName,
				authMethod,
				extraParams,
				extraHeaders
			}

			switch (authMethod) {
				case 'oauth2': {
					// Para OAuth2 generamos la URL de autorización
					if (!credentials.authUrl) {
						return outputData('error', {
							error: 'URL de autorización no especificada'
						})
					}

					const authUrlParams = {
						client_id: credentials.clientId,
						redirect_uri: credentials.redirectUri,
						scope: credentials.scopes,
						response_type: 'code',
						...extraParams
					}

					// Construir URL con parámetros
					const queryString = Object.entries(authUrlParams)
						.filter(([_, value]) => value !== undefined && value !== null && value !== '')
						.map(([key, value]) => {
							return `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`
						})
						.join('&')

					const authUrl = `${credentials.authUrl}?${queryString}`

					authResult = {
						...authResult,
						authUrl,
						tokenUrl: credentials.tokenUrl,
						credentials: {
							clientId: credentials.clientId,
							clientSecret: '[PROTECTED]',
							redirectUri: credentials.redirectUri,
							scopes: credentials.scopes
						},
						message: 'Se requiere autorización del usuario. Utilice la URL de autorización.',
						step: 'authorization'
					}
					break
				}

				case 'apikey': {
					// Para API Key configuramos los headers correspondientes
					const apiKeyHeaders: { [key: string]: string } = {}
					if (credentials.apiKey && credentials.apiKeyHeaderName) {
						apiKeyHeaders[credentials.apiKeyHeaderName] = credentials.apiKey
					}
					if (credentials.apiSecret && credentials.apiSecretHeaderName) {
						apiKeyHeaders[credentials.apiSecretHeaderName] = credentials.apiSecret
					}

					authResult = {
						...authResult,
						credentials: {
							apiKey: credentials.apiKey ? '[PRESENT]' : '[MISSING]',
							apiSecret: credentials.apiSecret ? '[PROTECTED]' : '[MISSING]'
						},
						headers: {
							...apiKeyHeaders,
							...extraHeaders
						},
						message: 'Credenciales API Key listas para usar'
					}
					break
				}

				case 'bearer':
					// Para Bearer token formateamos el header de autorización
					if (!credentials.token) {
						return outputData('error', { error: 'Token no especificado' })
					}

					authResult = {
						...authResult,
						credentials: {
							token: '[PROTECTED]'
						},
						headers: {
							Authorization: `Bearer ${credentials.token}`,
							...extraHeaders
						},
						message: 'Token Bearer listo para usar'
					}
					break

				case 'basic': {
					// Para Basic Auth formateamos el header de autorización con Base64
					if (!credentials.username || !credentials.password) {
						return outputData('error', {
							error: 'Usuario o contraseña no especificados'
						})
					}

					const basicAuthToken = Buffer.from(`${credentials.username}:${credentials.password}`).toString('base64')
					authResult = {
						...authResult,
						credentials: {
							username: credentials.username,
							password: '[PROTECTED]'
						},
						headers: {
							Authorization: `Basic ${basicAuthToken}`,
							...extraHeaders
						},
						message: 'Credenciales Basic Auth listas para usar'
					}
					break
				}

				case 'custom':
					// Para Custom solo usamos los headers adicionales
					authResult = {
						...authResult,
						headers: extraHeaders,
						message: 'Headers personalizados configurados'
					}
					break
			}

			// Añadir información de almacenamiento si está habilitado
			if (this.properties.storeToken.value && this.properties.tokenName.value) {
				authResult.storedAs = this.properties.tokenName.value
			}

			outputData('credentials', authResult)
		} catch (error: any) {
			let message = 'Error en la autenticación: '
			if (error instanceof Error) message += error.message
			else message += String(error)
			outputData('error', { error: message })
		}
	}

	// Métodos auxiliares
	private hideAllAuthFields(): void {
		this.properties.authUrl.show = false
		this.properties.tokenUrl.show = false
		this.properties.clientId.show = false
		this.properties.clientSecret.show = false
		this.properties.redirectUri.show = false
		this.properties.scopes.show = false
		this.properties.apiKey.show = false
		this.properties.apiKeyHeaderName.show = false
		this.properties.apiSecret.show = false
		this.properties.apiSecretHeaderName.show = false
		this.properties.token.show = false
		this.properties.username.show = false
		this.properties.password.show = false
	}
}
