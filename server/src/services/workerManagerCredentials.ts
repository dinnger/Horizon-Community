import Storage from '../models/Storage.js'
import { decrypt } from '../utils/cryptography.js'

export async function getCredentialsById(id: string) {
	const storageData = await Storage.findOne({
		where: { id }
	})

	if (!storageData) {
		throw new Error(`No credentials found for ID: ${id}`)
	}

	// get Data and
	try {
		const data = JSON.parse(decrypt(storageData.data))
		const list: { name: string; value: any }[] = []
		for (const key of Object.keys(data)) {
			list.push({ name: `${storageData.name}_${key}`, value: data[key] })
		}
		return list
	} catch (error: any) {
		throw new Error(error)
	}
}
