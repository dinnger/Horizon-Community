const secrets: { [key: string]: any } = {}
export const secretsValue: { [key: string]: string } = {}

export function setSecret({ name, value }: { name: string; value: any }) {
	secretsValue[name] = value
	if (name && value) {
		const arr = name.split('_')
		let secret = secrets
		for (const [index, key] of Object.entries(arr)) {
			if (!secret[key]) secret[key] = {}
			if (Number(index) === arr.length - 1) {
				secret[key] = value
			} else {
				secret = secret[key]
			}
		}
	}
}

export function listSecrets({
	type,
	subType
}: { type: string; subType?: string }) {
	const list = []
	let data = secrets[type.toUpperCase()]
	if (subType) data = data?.[subType.toUpperCase()]
	if (!data) return []
	for (const key of Object.keys(data)) {
		list.push({
			label: key,
			value: `${type.toUpperCase()}_${subType ? `${subType.toUpperCase()}_` : ''}${key.toUpperCase()}`
		})
	}
	return list
}

export function getSecret({
	type,
	subType,
	name
}: { type: string; subType?: string; name?: string }) {
	let data = secrets[type.toUpperCase()]
	if (subType) data = data?.[subType.toUpperCase()]
	if (name) data = data?.[name.toUpperCase()]
	return data
}
