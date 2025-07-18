import type { IClassNode } from '@shared/interfaces/class.interface.js'

export function CoreCredential(this: IClassNode) {
	return {
		getCredential: (name: string) => {
			const result: { [key: string]: string } = {}
			for (const key of this.meta?.credentials || []) {
				const credential = `WFC_${name.toUpperCase()}_${key.toUpperCase()}`
				if (process.env[credential]) result[key] = process.env[credential]
			}
			return result
		}
	}
}
