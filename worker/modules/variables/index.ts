import type { Worker } from '../../worker.js'
import type { IWorkflowSaveFull } from '@shared/interfaces/standardized.js'
import { setSecret } from '../../../shared/engine/secret.engine.js'

export class VariableModule {
	el: Worker
	variablesValue: Map<string, { name: string; values: { [key: string]: any } }> = new Map()
	projectValue: Map<string, any> = new Map()

	constructor(el: Worker) {
		this.el = el
	}

	/**
	 * Verifies if required environment variables are set for a given workflow.
	 *
	 * This method checks two types of environment variables:
	 * 1. Workflow variables (prefixed with WFV_)
	 * 2. Credential variables (prefixed with WFC_)
	 *
	 * It logs the status of each required variable to the console with color coding:
	 * - Green checkmark (✓) for variables that are set
	 * - Yellow warning (⚠) for variables that are not set
	 *
	 * @param params - Object containing the workflow to verify
	 * @param params.flow - The workflow object to verify variables against
	 * @returns A Promise that resolves when verification is complete
	 */
	async checkWorkflowEnvironment({ flow }: { flow: IWorkflowSaveFull }) {
		// Project variables
		const values: { [key: string]: any } = {}
		if (flow.project) {
			for (const item of flow.project?.transportConfig || []) {
				const variable = `PROJECT_${String(flow.project?.transportType).toUpperCase()}_${item.toUpperCase()}`
				const value = process.env[variable]
				console.debug(`\x1b[44m Variable \x1b[0m  ${value ? '\x1b[32m\u2713 ' : '\x1b[33m\u26a0 '} ${variable} \x1b[0m`)
				this.projectValue.set(item, value)
			}
		}
		// Variables
		for (const credential of flow.credentials || []) {
			const { id, name, items } = credential

			if (!name || !items) continue
			if (this.variablesValue.has(id)) continue

			const values: { [key: string]: any } = {}
			for (const item of items) {
				const variable = `WORKFLOW_${name.toUpperCase()}_${item.toUpperCase()}`
				const value = process.env[variable]
				if (value) values[item] = value
				console.debug(`\x1b[44m Credencial \x1b[0m  ${value ? '\x1b[32m\u2713 ' : '\x1b[33m\u26a0 '} ${variable} \x1b[0m`)
			}
			this.variablesValue.set(id, { name, values })
		}
		// Credentials
		// for (const list of this.el.nodeModule.dependencies.credentials.values()) {
		// 	const { credentials, value } = list
		// 	// console.log({ value })
		// 	if (!credentials) continue
		// 	for (const field of credentials) {
		// 		const credential = `WFC_${value.toUpperCase()}_${field.toUpperCase()}`
		// 		const valueEnv = process.env[credential]
		// 		console.log(`\x1b[44m Variable \x1b[0m  ${value ? '\x1b[32m\u2713' : '\x1b[33m\u26a0'} ${credential} \x1b[0m`)
		// 		if (valueEnv) setSecret({ name: value, value: valueEnv })
		// 	}
		// }
	}
}
