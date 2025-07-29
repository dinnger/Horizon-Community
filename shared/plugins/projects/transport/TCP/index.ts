import type { INumberProperty, IPropertiesType, IStringProperty } from '@shared/interfaces'

export interface IProperty extends IPropertiesType {
	host: IStringProperty
	port: INumberProperty
}

const properties: IProperty = {
	host: {
		name: 'Host',
		type: 'string',
		value: 'localhost'
	},
	port: {
		name: 'Puerto',
		type: 'number',
		value: 8080
	}
}
