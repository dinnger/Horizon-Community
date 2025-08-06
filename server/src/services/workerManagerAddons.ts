import { loadWorkflowFile } from '@shared/utils/utilities.js'
import { decrypt } from '../utils/cryptography.js'
import Storage from '../models/Storage.js'
import Project from '../models/Project.js'
import Workflow from '../models/Workflow.js'

async function getCredentialsById(id: string) {
	const storageData = await Storage.findOne({
		where: { id }
	})

	if (!storageData) throw new Error(`No credentials found for ID: ${id}`)

	const data = JSON.parse(decrypt(storageData.data.toString()))
	const list: { [key: string]: any } = {}
	for (const key of Object.keys(data)) {
		list[`WORKFLOW_${storageData.name.toUpperCase()}_${key.toUpperCase()}`] = data[key]
	}
	return list
}

export async function getProjectByWokflow(workflowId: string) {
	const projectData = await Project.findOne({
		attributes: ['id', 'name', 'description', 'transportType', 'transportConfig'],
		include: [
			{
				model: Workflow,
				as: 'storage',
				attributes: ['id', 'name', 'description', 'data'],
				where: {
					type: 'credential',
					workflowId
				}
			}
		]
	})

	if (!projectData) throw new Error(`No project found for ID: ${id}`)

	return projectData
}

export async function getCreditialsByWorkflow(workflowId: string) {
	const data = loadWorkflowFile(`./data/workflows/${workflowId}/flow.json`)
	if (!data?.credentials) return {}
	let list: { [key: string]: any } = {}
	for (const credential of data.credentials) {
		const listCredentials = await getCredentialsById(credential.id)
		list = { ...list, ...listCredentials }
	}
	return list
}

export async function getProjectsById(id: string) {
	const projectData = await getProjectById(id)
	const list: { [key: string]: any } = {}
	for (const [project, value] of Object.entries(projectData?.transportConfig || {})) {
		list[project] = value
	}
	return list
}
