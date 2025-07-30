import type {
	IBoxType,
	ICodeProperty,
	INumberProperty,
	IOptionsProperty,
	IPropertiesType,
	IStringProperty,
	ISwitchProperty
} from '@shared/interfaces'

export interface IProperty extends IPropertiesType {
	url: IBoxType
	endpoint: IStringProperty
	type: IOptionsProperty
	timeout: INumberProperty
	security: IOptionsProperty
	securityBasicUser: IStringProperty
	securityBasicPass: IStringProperty
	securityBearerToken: IStringProperty
	securityJWTSecret: IStringProperty
	// Opciones avanzadas
	advancedOptions: ISwitchProperty
	// Opciones de redirección
	enableRedirect: ISwitchProperty
	redirectUrl: IStringProperty
	redirectStatusCode: IOptionsProperty
	// Opciones de proxy
	enableProxy: ISwitchProperty
	proxyUrl: IStringProperty
	proxyPreserveHeaders: ISwitchProperty
	// Opciones CORS
	enableCors: ISwitchProperty
	corsOrigin: IStringProperty
	corsMethods: IStringProperty
	corsHeaders: IStringProperty
	// Respuesta personalizada
	customResponse: ISwitchProperty
	responseStatusCode: INumberProperty
	responseContentType: IOptionsProperty
	responseBody: ICodeProperty
}

export const getProperties = (): IProperty => {
	return {
		url: {
			name: 'URL asignada:',
			type: 'box'
		},
		endpoint: {
			name: 'Endpoint:',
			type: 'string',
			value: '/'
		},
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
					label: 'PATCH',
					value: 'patch'
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
		timeout: {
			name: 'Tiempo de espera (seg):',
			type: 'number',
			value: 50
		},
		security: {
			name: 'Seguridad:',
			type: 'options',
			options: [
				{
					label: 'Ninguna',
					value: 'null'
				},
				{
					label: 'Básico',
					value: 'basic'
				},
				{
					label: 'JWT Bearer',
					value: 'jwt'
				},
				{
					label: 'Bearer Token',
					value: 'bearer'
				}
			],
			value: 'null'
		},
		securityBasicUser: {
			name: 'Usuario',
			type: 'string',
			value: '',
			show: false
		},
		securityBasicPass: {
			name: 'Contraseña',
			type: 'string',
			value: '',
			show: false
		},
		securityBearerToken: {
			name: 'Token',
			type: 'string',
			value: '',
			show: false
		},
		securityJWTSecret: {
			name: 'Secreto',
			type: 'string',
			value: '',
			show: false
		},
		// Opciones avanzadas
		advancedOptions: {
			name: 'Opciones avanzadas',
			type: 'switch',
			value: false
		},
		// Opciones de redirección
		enableRedirect: {
			name: 'Habilitar redirección',
			type: 'switch',
			value: false,
			show: false
		},
		redirectUrl: {
			name: 'URL de redirección',
			type: 'string',
			value: '',
			description: 'URL a la que se redireccionará',
			show: false
		},
		redirectStatusCode: {
			name: 'Código de estado',
			type: 'options',
			options: [
				{
					label: '301 - Movido permanentemente',
					value: 301
				},
				{
					label: '302 - Encontrado (redirección temporal)',
					value: 302
				},
				{
					label: '303 - Ver otro',
					value: 303
				},
				{
					label: '307 - Redirección temporal',
					value: 307
				},
				{
					label: '308 - Redirección permanente',
					value: 308
				}
			],
			value: 302,
			show: false
		},
		// Opciones de proxy
		enableProxy: {
			name: 'Habilitar proxy',
			type: 'switch',
			value: false,
			show: false
		},
		proxyUrl: {
			name: 'URL de destino del proxy',
			type: 'string',
			value: '',
			description: 'URL a la que se reenviarán las peticiones',
			show: false
		},
		proxyPreserveHeaders: {
			name: 'Preservar cabeceras',
			type: 'switch',
			value: true,
			show: false
		},
		// Opciones CORS
		enableCors: {
			name: 'Habilitar CORS',
			type: 'switch',
			value: false,
			show: false
		},
		corsOrigin: {
			name: 'Access-Control-Allow-Origin',
			type: 'string',
			value: '*',
			show: false
		},
		corsMethods: {
			name: 'Access-Control-Allow-Methods',
			type: 'string',
			value: 'GET,POST,PUT,DELETE,OPTIONS',
			show: false
		},
		corsHeaders: {
			name: 'Access-Control-Allow-Headers',
			type: 'string',
			value: 'Content-Type,Authorization',
			show: false
		},
		// Respuesta personalizada
		customResponse: {
			name: 'Habilitar respuesta personalizada',
			type: 'switch',
			value: false,
			show: false
		},
		responseStatusCode: {
			name: 'Código de estado',
			type: 'number',
			value: 200,
			show: false
		},
		responseContentType: {
			name: 'Content-Type',
			type: 'options',
			options: [
				{
					label: 'application/json',
					value: 'application/json'
				},
				{
					label: 'text/html',
					value: 'text/html'
				},
				{
					label: 'text/plain',
					value: 'text/plain'
				},
				{
					label: 'application/xml',
					value: 'application/xml'
				}
			],
			value: 'application/json',
			show: false
		},
		responseBody: {
			name: 'Cuerpo de respuesta',
			type: 'code',
			lang: 'json',
			value: '{\n  "success": true\n}',
			show: false
		}
	}
}
