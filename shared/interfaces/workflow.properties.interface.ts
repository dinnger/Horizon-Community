interface SelectMixedOption {
	label: string
	value: string | number
	disabled?: boolean
	description?: string
}

export interface IBaseProperty {
	name: string
	show?: boolean
	description?: string
	disabled?: boolean
	size?: number
	order?: number
	required?: boolean
}

export interface IActionsProperty {
	actions?: {
		change?: string
		blur?: string
		focus?: string
		keyup?: string
		keydown?: string
	}
}

/**
 * evalProperty
 * Define si la propiedad se evalúa o no
 */
export interface IEvalProperty {
	evaluation?: {
		active?: boolean
		all?: boolean
	}
}

export interface IEventProperty {
	onValidation?: {
		pattern?: string
		hint?: string[]
	}
	onTransform?: 'utils_standard_name' | ((value: any) => any)
}

export interface IStringProperty extends IBaseProperty, IActionsProperty, IEvalProperty, IEventProperty {
	type: 'string'
	value: string
	placeholder?: string
	maxlength?: number
}

export interface IPasswordProperty extends IBaseProperty, IActionsProperty, IEventProperty {
	type: 'password'
	value: string
}

export interface INumberProperty extends IBaseProperty, IActionsProperty, IEventProperty {
	type: 'number'
	value: number
	min?: number
	max?: number
	step?: number
}

export interface ITextareaProperty extends IBaseProperty, IActionsProperty, IEventProperty {
	type: 'textarea'
	value: string
	maxlength?: number
	rows?: number
}

export interface ISwitchProperty extends IBaseProperty, IEventProperty {
	type: 'switch'
	value: boolean
}

export interface ICodeProperty extends IBaseProperty, IActionsProperty, IEventProperty {
	type: 'code'
	lang: 'sql' | 'json' | 'js' | 'string'
	value: string | object
	suggestions?: { label: string; value: any }[]
}

export interface IOptionsProperty extends IBaseProperty {
	type: 'options'
	options: SelectMixedOption[]
	value: SelectMixedOption['value'] | null
}

export interface ISecretProperty extends IBaseProperty, IActionsProperty {
	type: 'secret'
	secretType: 'DATABASE' | 'VARIABLES'
	options: SelectMixedOption[]
	value: string | number
}

export interface ICredentialProperty extends IBaseProperty, IActionsProperty {
	type: 'credential'
	options: SelectMixedOption[]
	value: string | number
}

export interface IBoxType extends IBaseProperty {
	type: 'box'
	value?: {
		label: string
		value: string | number | boolean | object | null | undefined
		isCopy?: boolean
		isWordWrap?: boolean
	}[]
}

export interface IListProperty extends IBaseProperty {
	type: 'list'
	object: {
		[key: string]: propertiesType
	}
	value: IPropertiesType[]
}

export interface IButtonProperty extends IBaseProperty {
	type: 'button'
	value: string
	action: {
		click: string
	}
	buttonClass?: string
}

export type propertiesType =
	| IStringProperty
	| IPasswordProperty
	| INumberProperty
	| ISwitchProperty
	| ICodeProperty
	| IOptionsProperty
	| ISecretProperty
	| ICredentialProperty
	| IBoxType
	| IListProperty
	| ITextareaProperty
	| IButtonProperty

export interface IPropertiesType {
	[key: string]: propertiesType
}

// Definimos una interfaz para las propiedades adicionales
interface ClientElementInfo {
	class?: string
	maxlength?: number
	placeholder?: string
}

export type IClientFieldsType = propertiesType & ClientElementInfo
export type IClientFieldType = Partial<propertiesType & ClientElementInfo>
