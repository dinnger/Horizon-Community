import type { IPropertiesType } from './workflow.properties.interface.js'

export interface IClientService {
	openUrl(data: {
		uri: string
		headers: object
		queryParams: object
		meta: any
	}): Promise<any>
}

export type IClientActionResponse =
	| { alert: string; type: 'info' | 'error' | 'warn' }
	| { save: string | object }
	| { error: string }
	| string

export type IClientActionButtonFn = ({
	steps,
	step
}: { steps: IClientStepContent; step: IClientStepType }) => Promise<IClientActionResponse> | string | IClientActionResponse

export type IClientActionButtonObject = {
	label: string
	icon?: string
	isLoading?: boolean
	onActions: IClientActionButtonFn
}

export type IClientActionsButtons = IClientActionButtonObject | string | Array<IClientActionButtonObject>

export type IClientStepButtons = {
	[key: string]: {
		label: string
		icon: string
		description?: string
		select?: boolean
		onActions?: IClientActionButtonFn
	}
}

export type IClientStepType =
	| {
			type: 'buttons'
			label: string
			required?: boolean
			description?: string
			fieldDatabase?: string
			element: IClientStepButtons
			backKey?: string
			onActions?: IClientActionsButtons
			value?: string
	  }
	| {
			type: 'fields'
			label: string
			description?: string
			fieldDatabase?: string
			element: IPropertiesType
			backKey?: string
			onActions?: IClientActionsButtons
	  }

export interface IClientStepContent {
	[key: string]: IClientStepType
}
