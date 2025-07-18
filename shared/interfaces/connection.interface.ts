// shared/interfaces/connection.interface.ts
import type { classOnExecuteInterface } from '@shared/interfaces/class.interface.js'

// Interface for connection modules (e.g., TCP, RabbitMQ)
export interface IConnectionModule {
	connection?(params: Record<string, any>): Promise<void>
	request?(params: Record<string, any>): Promise<void>
	retry?(params: {
		fn: (args?: any) => Promise<void> | void
		error: string
		args?: any
	}): Promise<void>
}

// Constructor signature for connection modules
export interface IConnectionModuleConstructor {
	new (
		args: Pick<classOnExecuteInterface, 'context' | 'outputData'>
	): IConnectionModule
}
