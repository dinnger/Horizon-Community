export interface INodePropertiesType {
	name: string
	type:
		| 'string'
		| 'number'
		| 'boolean'
		| 'select'
		| 'multiSelect'
		| 'text'
		| 'json'
		| 'code'
		| 'collection'
		| 'fixedCollection'
		| 'dateTime'
		| 'credentials'
		| 'password'
	default?: any
	required?: boolean
	displayName?: string
	description?: string
	placeholder?: string
	options?: Array<{
		name: string
		value: any
		description?: string
	}>
	typeOptions?: {
		[key: string]: any
	}
	displayOptions?: {
		show?: {
			[key: string]: any[]
		}
		hide?: {
			[key: string]: any[]
		}
	}
	extractValue?: {
		type: 'regex'
		regex: string
	}
	routing?: {
		send?: {
			type: string
			property: string
		}
		output?: {
			type: string
			property: string
		}
	}
}

export interface INodeConnectors {
	inputs?: { name: string; nextNodeTag?: string | string[] }[] | Record<string, any>
	outputs: { name: string; nextNodeTag?: string | string[] }[] | Record<string, any>
	callbacks?: { name: string; nextNodeTag?: string | string[] }[] | Record<string, any>
}

export interface INodeProperties {
	[key: string]: INodePropertiesType
}
