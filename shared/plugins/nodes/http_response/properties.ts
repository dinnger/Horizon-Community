import type {
	ICodeProperty,
	IOptionsProperty,
	IPropertiesType,
	IStringProperty,
	ISwitchProperty
} from '@shared/interfaces/workflow.properties.interface'
import { mime } from './mimeTypes.js'
import { statusCode } from './statusCodeTypes.js'

export interface IProperty extends IPropertiesType {
	contentType: IOptionsProperty
	status: IOptionsProperty
	isFile: ISwitchProperty
	nameFile: IStringProperty
	response: ICodeProperty
	header: ICodeProperty
}

export const getProperties = (): IProperty => {
	return {
		// propiedadad content type
		contentType: {
			name: 'Content Type',
			type: 'options',
			description: 'Tipo de contenido de la respuesta',
			value: 'application/json',
			options: mime,
			size: 2,
			disabled: false
		},
		status: {
			name: 'Código:',
			type: 'options',
			value: 200,
			options: statusCode,
			size: 1
		},
		isFile: {
			name: 'Es Archivo:',
			type: 'switch',
			value: false,
			size: 1
		},
		nameFile: {
			name: 'Nombre Archivo (con extensión):',
			type: 'string',
			value: '',
			size: 4,
			show: false
		},
		response: {
			name: 'Respuesta',
			type: 'code',
			lang: 'json',
			value: '{\n}'
		},
		header: {
			name: 'Headers',
			type: 'code',
			lang: 'json',
			value: '{\n}',
			show: true
		}
	}
}
