import type { IPropertiesType } from '@shared/interfaces/workflow.properties.interface.js'
import type { IWorkflow } from '../workflow/index.js'
import type { Worker } from '../../worker.js'
import { setSecret } from '../../../shared/engine/secret.engine.js'
import { setVariable } from '../../../shared/engine/variables.engine.js'

export class VariableModule {
	el: Worker

	constructor(el: Worker) {
		this.el = el
	}

	/**
	 * Initializes environment variables for the workflow.
	 *
	 * This method fetches workflow variables and credential properties from the server and
	 * sets them as environment variables with specific prefixes:
	 * - Workflow variables are prefixed with "WFV_"
	 * - Credential properties are prefixed with "WFC_{CREDENTIAL_NAME}_"
	 *
	 * @param {Object} params - The parameters object
	 * @param {string} params.uidFlow - The unique identifier of the workflow
	 * @returns {Promise<void>} A promise that resolves when initialization is complete
	 */
	async initVariable({ uidFlow }: { uidFlow: string }) {
		// if (projectVariables && typeof projectVariables === 'object') {
		// 	try {
		// 		for (const key of Object.keys(projectVariables.config)) {
		// 			process.env[`PJ_${projectVariables.type.toUpperCase()}_${key.toUpperCase()}`] = String(projectVariables.config[key])
		// 		}
		// 	} catch (error) {}
		// }

		// const variables = await this.el.communicationModule.getEnvironment(uidFlow)
		// if (variables && typeof variables === 'object') {
		// 	try {
		// 		for (const key in variables) {
		// 			process.env[`WFV_${key.toUpperCase()}`] = variables[key]
		// 		}
		// 	} catch (error) {}
		// }

		// Credentials
		for (const value of this.el.nodeModule.dependencies.credentials.values()) {
			const { idNode, type, name, credentials } = value
			const credentialsResult = await this.el.communicationModule.server.getCredentialsFromServer(type)
			if (credentialsResult) {
				const { name, result } = credentialsResult
				for (const key in result) {
					process.env[`WFC_${name.toUpperCase()}_${key.toUpperCase()}`] = result[key]
				}
				// Cambiar el node para en su meta agregar las credenciales que necesitan
				if (value.credentials !== Object.keys(result)) {
					value.credentials = Object.keys(result)
				}
			}
		}
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
	async checkWorkflowEnvironment({ flow }: { flow: IWorkflow }) {
		// Project variables
		if (flow.project) {
			for (const key of Object.keys(flow.project) as Array<keyof typeof flow.project>) {
				const projectSection = flow.project[key]
				if (projectSection && typeof projectSection === 'object') {
					for (const name of Object.keys(projectSection)) {
						const variable = `PJ_${String(key).toUpperCase()}_${name.toUpperCase()}`
						const value = process.env[variable]
						console.log(`\x1b[44m Variable \x1b[0m  ${value ? '\x1b[32m\u2713' : '\x1b[33m\u26a0'} ${variable} \x1b[0m`)
					}
				}
			}
		}
		// Variables
		for (const name of Object.keys(flow.environment || {})) {
			const variable = `WFV_${name.toUpperCase()}`
			const value = process.env[variable]
			console.log(`\x1b[44m Variable \x1b[0m  ${value ? '\x1b[32m\u2713' : '\x1b[33m\u26a0'} ${variable} \x1b[0m`)
			if (value) setVariable({ name, value })
		}
		// Credentials
		for (const value of this.el.nodeModule.dependencies.credentials.values()) {
			const { credentials, name } = value
			// console.log({ value })
			if (!credentials) continue
			for (const field of credentials) {
				const credential = `WFC_${name.toUpperCase()}_${field.toUpperCase()}`
				const value = process.env[credential]
				console.log(`\x1b[44m Variable \x1b[0m  ${value ? '\x1b[32m\u2713' : '\x1b[33m\u26a0'} ${credential} \x1b[0m`)
				if (value) setSecret({ name, value })
			}
		}
	}

	async virtualSecretsAndCredentials(type: string, properties: IPropertiesType) {
		// =========================================================================
		// SECRETOS Y CREDENCIALES
		// =========================================================================
		const propertySecrets = Object.entries(properties).filter(([key, value]) => value && value.type === 'secret')
		// Solicitar credenciales
		const propertyCredentials = Object.entries(properties).filter(([key, value]) => value && value.type === 'credential')
		if (propertyCredentials.length > 0) {
			const credentials = await this.el.communicationModule.server.getCredentialsFromServer(type)
			if (!credentials) return
			for (const [key, value] of propertyCredentials) {
				if ('options' in value) {
					value.options = credentials.map((cred: any) => {
						return {
							label: cred.name.split('-').pop(),
							value: cred.name
						}
					})
				}
			}
		}
		// =========================================================================
	}
}
