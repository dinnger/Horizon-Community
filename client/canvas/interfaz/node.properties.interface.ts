interface SelectMixedOption {
	label: string
	value: string | number
	disabled?: boolean
	description?: string
}

interface IBaseProperty {
	name: string
	show?: boolean
	description?: string
	disabled?: boolean
	size?: number
	order?: number
	required?: boolean
}

interface IActionsProperty {
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
interface IEvalProperty {
	evaluation?: {
		active?: boolean
		all?: boolean
	}
}

interface IEventProperty {
	onValidation?: {
		pattern?: string
		hint?: string[]
	}
	onTransform?: 'utils_standard_name' | ((value: any) => any)
}

interface IStringProperty extends IBaseProperty, IActionsProperty, IEvalProperty, IEventProperty {
	type: 'string'
	value: string
	placeholder?: string
	maxlength?: number
}

interface IPasswordProperty extends IBaseProperty, IActionsProperty, IEventProperty {
	type: 'password'
	value: string
}

interface INumberProperty extends IBaseProperty, IActionsProperty, IEventProperty {
	type: 'number'
	value: number
	min?: number
	max?: number
	step?: number
}

interface ITextareaProperty extends IBaseProperty, IActionsProperty, IEventProperty {
	type: 'textarea'
	value: string
	maxlength?: number
	rows?: number
}

interface ISwitchProperty extends IBaseProperty, IEventProperty {
	type: 'switch'
	value: boolean
}

interface ICodeProperty extends IBaseProperty, IActionsProperty, IEventProperty {
	type: 'code'
	lang: 'sql' | 'json' | 'js' | 'string'
	value: string | object
	suggestions?: { label: string; value: any }[]
}

interface IOptionsProperty extends IBaseProperty {
	type: 'options'
	options: SelectMixedOption[]
	value: SelectMixedOption['value'] | null
}

interface ISecretProperty extends IBaseProperty, IActionsProperty {
	type: 'secret'
	secretType: 'DATABASE' | 'VARIABLES'
	options: SelectMixedOption[]
	value: string | number
}

interface ICredentialProperty extends IBaseProperty, IActionsProperty {
	type: 'credential'
	options: SelectMixedOption[]
	value: string | number
}

interface IBoxType extends IBaseProperty {
	type: 'box'
	value?: {
		label: string
		value: string | number | boolean | object | null | undefined
		isCopy?: boolean
		isWordWrap?: boolean
	}[]
}

interface IListProperty extends IBaseProperty {
	type: 'list'
	object: {
		[key: string]: IPropertiesType
	}
	value: INodePropertiesType[]
}

interface IButtonProperty extends IBaseProperty {
	type: 'button'
	value: string
	action: {
		click: string
	}
	buttonClass?: string
}

export type IPropertiesType =
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

export interface INodePropertiesType {
	[key: string]: IPropertiesType
}

interface IPropertiesElementInfo {
	class?: string
	maxlength?: number
	placeholder?: string
}

export type IPropertyFieldsType = IPropertiesType & IPropertiesElementInfo
export type IPropertyFieldType = Partial<IPropertiesType & IPropertiesElementInfo>
