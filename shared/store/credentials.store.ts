import type { IClassNode, newClassInterface } from '../interfaces/class.interface.js'
import { getNodeClass } from './node.store.js'

const credentialsRegistry: { [key: string]: newClassInterface } = {}

for (const [key, value] of Object.entries(getNodeClass() || {})) {
	if (value.credentials && Object.keys(value.credentials).length > 0) {
		credentialsRegistry[key] = value
	}
}

export function getCredentials() {
	return Object.fromEntries(
		Object.entries(credentialsRegistry).map(([key, value]) => [
			key,
			{
				name: value.info.name,
				info: value.info
			}
		])
	)
}

export function getCredentialsProperties(name: string) {
	return credentialsRegistry[name]?.credentials
}

export function getCredentialsActions(name: string) {
	return credentialsRegistry[name]?.credentialsActions
}

export function getCredentialsClass(name: string): IClassNode | undefined {
	return credentialsRegistry[name]?.class
}
