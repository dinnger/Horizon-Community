import type { IPropertiesType } from '@shared/interfaces/workflow.properties.interface.js'
import type { IClassNode, classOnExecuteInterface, infoInterface } from '@shared/interfaces/class.interface.js'

export default class implements IClassNode {
	constructor(
		public dependencies: string[],
		public info: infoInterface,
		public properties: IPropertiesType
	) {
		this.dependencies = ['nodemailer']

		this.info = {
			name: 'Gmail',
			desc: 'Envía correos electrónicos a través de Gmail',
			icon: '󰊫',
			group: 'Email',
			color: '#D44638',
			connectors: {
				inputs: ['input'],
				outputs: ['success', 'error']
			}
		}

		this.properties = {
			email: {
				name: 'Correo electrónico:',
				type: 'string',
				value: '',
				placeholder: 'tu.correo@gmail.com'
			},
			authType: {
				name: 'Tipo de autenticación:',
				type: 'options',
				options: [
					{
						label: 'Contraseña de aplicación',
						value: 'password'
					},
					{
						label: 'OAuth 2.0',
						value: 'oauth2'
					}
				],
				value: 'password'
			},
			password: {
				name: 'Contraseña de aplicación:',
				type: 'password',
				value: ''
			},
			clientId: {
				name: 'Client ID:',
				type: 'string',
				value: ''
			},
			clientSecret: {
				name: 'Client Secret:',
				type: 'password',
				value: ''
			},
			refreshToken: {
				name: 'Refresh Token:',
				type: 'password',
				value: ''
			},
			from: {
				name: 'Nombre del remitente:',
				type: 'string',
				value: '',
				placeholder: 'Tu Nombre'
			},
			to: {
				name: 'Destinatarios:',
				type: 'string',
				value: '',
				placeholder: 'email1@ejemplo.com, email2@ejemplo.com'
			},
			cc: {
				name: 'CC:',
				type: 'string',
				value: '',
				placeholder: 'email1@ejemplo.com, email2@ejemplo.com'
			},
			bcc: {
				name: 'CCO:',
				type: 'string',
				value: '',
				placeholder: 'email1@ejemplo.com, email2@ejemplo.com'
			},
			subject: {
				name: 'Asunto:',
				type: 'string',
				value: ''
			},
			messageType: {
				name: 'Tipo de mensaje:',
				type: 'options',
				options: [
					{
						label: 'Texto plano',
						value: 'text'
					},
					{
						label: 'HTML',
						value: 'html'
					}
				],
				value: 'text'
			},
			message: {
				name: 'Mensaje:',
				type: 'code',
				lang: 'string',
				value: ''
			},
			attachments: {
				name: 'Incluir adjuntos:',
				type: 'switch',
				value: false
			},
			attachmentsConfig: {
				name: 'Configuración de adjuntos:',
				type: 'code',
				lang: 'json',
				value: `[
  {
    "filename": "documento.pdf",
    "path": "/ruta/al/archivo.pdf"
  }
]`
			}
		}
	}

	async onExecute({ inputData, outputData, dependency }: classOnExecuteInterface) {
		try {
			const nodemailer = await dependency.getRequire('nodemailer')

			// Validar configuración básica
			if (!this.properties.email.value) {
				throw new Error('El correo electrónico no está configurado')
			}

			if (!this.properties.to.value) {
				throw new Error('No se ha especificado ningún destinatario')
			}

			// Configurar transporte según tipo de autenticación
			const transportConfig: any = {
				service: 'gmail'
			}

			if (this.properties.authType.value === 'password') {
				if (!this.properties.password.value) {
					throw new Error('La contraseña de aplicación no está configurada')
				}

				transportConfig.auth = {
					user: this.properties.email.value,
					pass: this.properties.password.value
				}
			} else {
				// OAuth2
				if (!this.properties.clientId.value || !this.properties.clientSecret.value || !this.properties.refreshToken.value) {
					throw new Error('Faltan credenciales OAuth2 (Client ID, Client Secret o Refresh Token)')
				}

				transportConfig.auth = {
					type: 'OAuth2',
					user: this.properties.email.value,
					clientId: this.properties.clientId.value,
					clientSecret: this.properties.clientSecret.value,
					refreshToken: this.properties.refreshToken.value
				}
			}

			const transporter = nodemailer.createTransport(transportConfig)

			// Preparar el mensaje
			let messageBody = String(this.properties.message.value)

			// Reemplazar variables en el mensaje si existen en inputData
			if (inputData?.data) {
				for (const [key, value] of Object.entries(inputData.data)) {
					messageBody = messageBody.toString().replace(new RegExp(`{{${key}}}`, 'g'), String(value))

					// También reemplazar variables en el asunto
					if (this.properties.subject.value) {
						this.properties.subject.value = this.properties.subject.value.toString().replace(new RegExp(`{{${key}}}`, 'g'), String(value))
					}
				}
			}

			// Configurar el objeto de correo
			const mailOptions: any = {
				from: this.properties.from.value ? `${this.properties.from.value} <${this.properties.email.value}>` : this.properties.email.value,
				to: this.properties.to.value,
				subject: this.properties.subject.value || 'Sin asunto',
				[String(this.properties.messageType.value).toString()]: messageBody
			}

			// Añadir CC si está definido
			if (this.properties.cc.value) {
				mailOptions.cc = this.properties.cc.value
			}

			// Añadir BCC si está definido
			if (this.properties.bcc.value) {
				mailOptions.bcc = this.properties.bcc.value
			}

			// Añadir adjuntos si está habilitado
			if (this.properties.attachments.value && this.properties.attachmentsConfig.value) {
				try {
					const attachments = JSON.parse(String(this.properties.attachmentsConfig.value))
					if (Array.isArray(attachments)) {
						mailOptions.attachments = attachments
					}
				} catch (error) {
					throw new Error('Error en la configuración de archivos adjuntos: formato JSON inválido')
				}
			}

			// Enviar el correo
			const info = await transporter.sendMail(mailOptions)

			// Retornar resultado exitoso
			outputData('success', {
				messageId: info.messageId,
				response: info.response,
				accepted: info.accepted,
				rejected: info.rejected
			})
		} catch (error) {
			let message = 'Error al enviar el correo'
			if (error instanceof Error) message = error.message
			outputData('error', { error: message })
		}
	}
}
