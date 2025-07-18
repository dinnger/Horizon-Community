import type { classOnCreateInterface } from '@shared/interfaces'
import type { IProperty } from './properties'

export default function (properties: IProperty, { context }: classOnCreateInterface) {
	// Configuración de seguridad
	properties.securityBasicUser.show = false
	properties.securityBasicPass.show = false
	properties.securityBearerToken.show = false
	properties.securityJWTSecret.show = false

	if (properties.security.value === 'basic') {
		properties.securityBasicUser.show = true
		properties.securityBasicPass.show = true
	}
	if (properties.security.value === 'bearer') {
		properties.securityBearerToken.show = true
	}
	if (properties.security.value === 'jwt') {
		properties.securityJWTSecret.show = true
	}

	// Configuración de opciones avanzadas
	const showAdvanced = properties.advancedOptions.value === true

	// Redirección
	properties.enableRedirect.show = showAdvanced
	properties.redirectUrl.show = showAdvanced && properties.enableRedirect.value === true
	properties.redirectStatusCode.show = showAdvanced && properties.enableRedirect.value === true

	// Proxy
	properties.enableProxy.show = showAdvanced
	properties.proxyUrl.show = showAdvanced && properties.enableProxy.value === true
	properties.proxyPreserveHeaders.show = showAdvanced && properties.enableProxy.value === true

	// CORS
	properties.enableCors.show = showAdvanced
	properties.corsOrigin.show = showAdvanced && properties.enableCors.value === true
	properties.corsMethods.show = showAdvanced && properties.enableCors.value === true
	properties.corsHeaders.show = showAdvanced && properties.enableCors.value === true

	// Respuesta personalizada
	properties.customResponse.show = showAdvanced
	properties.responseStatusCode.show = showAdvanced && properties.customResponse.value === true
	properties.responseContentType.show = showAdvanced && properties.customResponse.value === true
	properties.responseBody.show = showAdvanced && properties.customResponse.value === true

	// Generar URL
	const base = context.properties.basic?.router || ''
	const prefix = `/f_${context.info.uid}/api`

	let endpoint: string = String(properties.endpoint.value).toString() || ''
	if (endpoint[0] === '/') endpoint = endpoint.slice(1)
	const serverUrl =
		context.getEnvironment('serverUrl').slice(-1) !== '/'
			? context.getEnvironment('serverUrl')
			: context.getEnvironment('serverUrl').slice(0, -1)
	const baseUrl =
		context.getEnvironment('baseUrl').slice(-1) !== '/' ? `${context.getEnvironment('baseUrl')}/` : context.getEnvironment('baseUrl')
	const url = `${serverUrl}${prefix}${baseUrl}${endpoint}`
	const urlProd = `( HOST )${base}/${endpoint}`
	properties.url.value = [
		{
			label: 'Desarrollo:',
			value: url,
			isCopy: true
		},
		{
			label: 'Producción:',
			value: urlProd,
			isCopy: true
		}
	]
}
