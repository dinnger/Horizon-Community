import { getSecret, listSecrets } from '../../../shared/store/secret.store.js'
import { createRequire } from 'node:module'
import paths from 'node:path'
const require = createRequire(import.meta.url)

export function CoreDependencies(module: 'create' | 'execute') {
	return {
		getRequire: async (name: string) => Promise.resolve(require(name)),
		getModule: async ({ path, name }: { path: string; name: string }) => {
			// actual path
			if (path.startsWith('/')) path = path.slice(1)
			const pathModule = paths.join(
				__dirname,
				'../../../shared/plugins/nodes/',
				`/${path}`,
				`/${name.replace('.ts', '').replace('.js', '')}.js`
			)
			// Convert path to file URL for dynamic import
			const fileUrlModule = `file://${pathModule.replace(/\\/g, '/')}`
			const importedModule = await import(fileUrlModule)
			return Promise.resolve(importedModule.default)
		},
		getSecret: ({ type, subType, name }: { type: string; subType?: string; name?: string }) =>
			Promise.resolve(getSecret({ type, subType, name })),
		listSecrets: ({ type, subType }: { type: string; subType?: string }) => Promise.resolve(listSecrets({ type, subType }))
	}
}
