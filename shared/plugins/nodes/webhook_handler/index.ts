import type { Request as ExpressRequest, Response, NextFunction } from 'express'
import type { FileArray } from 'express-fileupload'

interface Request extends ExpressRequest {
	files?: FileArray | null
}
import type { IClassNode, classOnCreateInterface, classOnExecuteInterface, infoInterface } from '../../../interfaces/class.interface.js'
import { type IProperty, getProperties } from './properties.js'

export default class implements IClassNode<IProperty> {
	// ===============================================
	// Dependencias
	// ===============================================
	// #pk jsonwebtoken
	// #pk axios
	// ===============================================
	constructor(
		public dependencies: string[],
		public info: infoInterface,
		public properties: IProperty
	) {
		this.dependencies = ['jsonwebtoken', 'axios']
		this.info = {
			name: 'Webhook',
			desc: 'Call webhook',
			icon: '󰘯',
			group: 'Triggers',
			color: '#3498DB',
			isTrigger: true,
			connectors: {
				inputs: ['input'],
				outputs: ['response', 'error']
			}
		}

		this.properties = getProperties()
	}

	async onExecute({ app, context, execute, logger, environment, dependency, outputData }: classOnExecuteInterface) {
		const jwt = await dependency.getRequire('jsonwebtoken')
		const axios = await dependency.getRequire('axios')

		try {
			// Se define el prefixo de la ruta (Si es subFlow se utiliza el id del padre)
			let base: string
			let prefix: string
			if (environment.isSubFlow) {
				base = environment.subFlowBase
				prefix = `/api/f_${environment.subFlowParent}`
			} else {
				base = context.properties?.basic?.router || ''
				prefix = `/f_${context.info.uid}/api`
			}
			const timeout = Number.parseInt(String(this.properties.timeout.value)) || 50
			const baseUrl = environment.baseUrl.slice(-1) !== '/' ? `${environment.baseUrl}/` : environment.baseUrl.slice(0, -1)
			const endpointValue: string = (this.properties.endpoint.value as string) || ''
			const endpoint = endpointValue[0] === '/' ? endpointValue.slice(1) : endpointValue
			const url = `${environment.isDev ? prefix : base}${baseUrl}${endpoint}`
			console.log('WEBHOOK:', this.properties.type.value, url)

			app[this.properties.type.value as keyof typeof app](url, async (req: Request, res: Response, next: NextFunction) => {
				// Configurar CORS si está habilitado
				if (this.properties.advancedOptions.value === true && this.properties.enableCors.value === true) {
					res.header('Access-Control-Allow-Origin', this.properties.corsOrigin.value as string)
					res.header('Access-Control-Allow-Methods', this.properties.corsMethods.value as string)
					res.header('Access-Control-Allow-Headers', this.properties.corsHeaders.value as string)

					// Responder inmediatamente a las solicitudes OPTIONS (preflight)
					if (req.method === 'OPTIONS') {
						res.sendStatus(200)
						return
					}
				}

				// Manejar redirección si está habilitada
				if (
					this.properties.advancedOptions.value === true &&
					this.properties.enableRedirect.value === true &&
					this.properties.redirectUrl.value
				) {
					const redirectUrl = this.properties.redirectUrl.value as string
					const statusCode = this.properties.redirectStatusCode.value as number
					console.log(`Redirigiendo a: ${redirectUrl} con código: ${statusCode}`)
					res.redirect(statusCode, redirectUrl)
					return
				}

				// Respuesta personalizada si está habilitada
				if (this.properties.advancedOptions.value === true && this.properties.customResponse.value === true) {
					const statusCode = this.properties.responseStatusCode.value as number
					const contentType = this.properties.responseContentType.value as string
					let responseBody = this.properties.responseBody.value

					// Si es JSON y está como string, intentar parsear
					if (contentType === 'application/json' && typeof responseBody === 'string') {
						try {
							responseBody = JSON.parse(responseBody)
						} catch (e) {
							// Si no se puede parsear, dejarlo como está
						}
					}

					res.status(statusCode).contentType(contentType).send(responseBody)
					return
				}

				// Preparar datos de la petición
				const data = {
					headers: { ...req.headers },
					params: { ...req.params },
					query: { ...req.query },
					body: { ...req.body },
					files: req.files,
					method: req.method,
					endpoint: req.path,
					time: Date.now(),
					security: {}
				}

				// Proxy si está habilitado
				if (
					this.properties.advancedOptions.value === true &&
					this.properties.enableProxy.value === true &&
					this.properties.proxyUrl.value
				) {
					try {
						const targetUrl = `${this.properties.proxyUrl.value}${req.path}`
						console.log(`Proxy: ${req.method} ${targetUrl}`)

						let headers: { [key: string]: any } = {}
						if (this.properties.proxyPreserveHeaders.value === true) {
							headers = { ...req.headers }
							// Eliminar headers que pueden causar problemas
							if ('host' in headers) headers.host = undefined
						}

						const proxyResponse = await axios({
							method: req.method.toLowerCase(),
							url: targetUrl,
							headers,
							data: req.body,
							params: req.query
						})

						// Enviar respuesta del proxy
						res.status(proxyResponse.status)
						for (const header in proxyResponse.headers) {
							res.header(header, proxyResponse.headers[header])
						}
						res.send(proxyResponse.data)

						// También enviar los datos al flujo de trabajo
						outputData(
							'response',
							{
								...data,
								proxyResponse: {
									status: proxyResponse.status,
									headers: proxyResponse.headers,
									data: proxyResponse.data
								}
							},
							{ req, res }
						)

						return
					} catch (error: any) {
						return outputData(
							'error',
							{
								error: `Error de proxy: ${error.message}`,
								originalError: error.response?.data || error.message
							},
							{ req, res }
						)
					}
				}

				// Validar Seguridad
				if (this.properties.security.value === 'jwt') {
					// Validación de autenticación
					if (!data.headers?.authorization) {
						logger.error(
							{
								responseTime: timeout * 1000,
								responseCode: 506
							},
							'Solicitud Timed Out'
						)
						return outputData(
							'error',
							{
								error: 'Autenticación fallida',
								responseTime: timeout * 1000,
								responseCode: 506
							},
							{ req, res }
						)
					}

					jwt.verify(
						data.headers.authorization.split(' ')[1],
						this.properties.securityJWTSecret.value as string,
						(err: Error | null, decoded: object | undefined) => {
							if (err) return outputData('error', { error: err.toString() }, { req, res })
							data.security = decoded as object
							outputData('response', data, { req, res })
						}
					)
				} else {
					// res.send('ok')
					outputData('response', data, { req, res })
					if (context.info.disabled) next()
				}

				// Timeout
				res.setTimeout(timeout * 1000, () => {
					execute.stop()
					logger.error(
						{
							responseTime: timeout * 1000,
							responseCode: 506
						},
						'Solicitud Timed Out'
					)
					res.status(506).send('Excedido el tiempo de respuesta')
				})
			})
		} catch (error) {
			console.log('🚀 ~ onExecute ~ error:', error)
			let message = 'Error'
			if (error instanceof Error) message = error.message
			outputData('error', { error: message })
		}
	}
}
