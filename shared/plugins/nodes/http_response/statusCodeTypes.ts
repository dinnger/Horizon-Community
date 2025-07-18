
interface SelectMixedOption {
	label: string
	value: string | number
	disabled?: boolean
	description?: string
}

export const statusCode: SelectMixedOption[] = [
	{
		value: 100,
		label: '100 - Continuar'
	},
	{
		value: 101,
		label: '101 - Cambio de Protocolo'
	},

	{
		value: 200,
		label: '200 - OK'
	},
	{
		value: 201,
		label: '201 - Creado'
	},
	{
		value: 202,
		label: '202 - Aceptado'
	},
	{
		value: 204,
		label: '204 - Sin Contenido'
	},
	{
		value: 206,
		label: '206 - Contenido Parcial'
	},

	{
		value: 300,
		label: '300 - Múltiples Opciones'
	},
	{
		value: 301,
		label: '301 - Movido Permanentemente'
	},
	{
		value: 302,
		label: '302 - Encontrado'
	},
	{
		value: 304,
		label: '304 - No Modificado'
	},
	{
		value: 307,
		label: '307 - Redirección Temporal'
	},
	{
		value: 308,
		label: '308 - Redirección Permanente'
	},

	{
		value: 400,
		label: '400 - Solicitud Incorrecta'
	},
	{
		value: 401,
		label: '401 - No Autorizado'
	},
	{
		value: 403,
		label: '403 - Prohibido'
	},
	{
		value: 404,
		label: '404 - No Encontrado'
	},
	{
		value: 405,
		label: '405 - Método No Permitido'
	},
	{
		value: 409,
		label: '409 - Conflicto'
	},
	{
		value: 410,
		label: '410 - Ya no Disponible'
	},
	{
		value: 429,
		label: '429 - Demasiadas Solicitudes'
	},

	{
		value: 500,
		label: '500 - Error Interno del Servidor'
	},
	{
		value: 501,
		label: '501 - No Implementado'
	},
	{
		value: 503,
		label: '503 - Servicio no Disponible'
	},
	{
		value: 504,
		label: '504 - Tiempo de Espera de la Puerta de Enlace Excedido'
	}
]
