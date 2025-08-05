import type { IWorkflowSaveFull } from '@shared/interfaces/standardized.js'
import { loadWorkflowFile } from '@shared/utils/utilities.js'
import { decrypt } from '../utils/cryptography.js'
import Storage from '../models/Storage.js'

export async function getCreditialsByWorkflow(workflowId: string) {
	const data = loadWorkflowFile(`./data/workflows/${workflowId}/flow.json`)
	if (!data?.credentials) return {}
	let list: { [key: string]: any } = {}
	for (const credential of data.credentials) {
		const [id, ...name] = credential.split('::')
		const listCredentials = await getCredentialsById(id)
		list = { ...list, ...listCredentials }
	}
	return list
}

async function getCredentialsById(id: string) {
	const storageData = await Storage.findOne({
		where: { id }
	})

	if (!storageData) {
		throw new Error(`No credentials found for ID: ${id}`)
	}

	const data = JSON.parse(decrypt(storageData.data.toString()))
	const list: { [key: string]: any } = {}
	for (const key of Object.keys(data)) {
		list[`WORKFLOW_${storageData.name.toUpperCase()}_${key.toUpperCase()}`] = data[key]
	}
	return list
}
