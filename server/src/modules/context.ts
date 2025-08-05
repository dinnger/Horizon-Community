import type { classDependencyInterface, classOnCredential, IClientService, IPropertiesType } from '@shared/interfaces/index.js'
import type { AuthenticatedSocket } from '../routes/socket/index.js'
import { getSecret, listSecrets } from '../../../shared/engine/secret.engine.js'
import { createRequire } from 'node:module'
import { encrypt } from '../utils/cryptography.js'
import paths from 'node:path'
import { temporalKeyManager } from '@shared/store/temporalKey.js'
import { v4 as uuidv4 } from 'uuid'

const require = createRequire(import.meta.url)

function clientContext({ socket }: { socket: Required<AuthenticatedSocket> }): IClientService {
	return {
		openUrl: async (options) => {
			return new Promise((resolve, reject) => {
				const uid = uuidv4()
				// Emitir evento al cliente para abrir URL
				temporalKeyManager
					.set({
						key: uid
					})
					.then((data) => resolve(data))
					.catch((error) => reject(error))

				socket.emit('credential:open-url', { token: encrypt(JSON.stringify({ ...options, uid })) })
			})
		}
	}
}

function dependencyContext(): classDependencyInterface {
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

// ===========================================================================
// Contexto de Credenciales
// ===========================================================================
export function onCredentialModule({
	socket,
	credentials
}: {
	socket: Required<AuthenticatedSocket>
	credentials: IPropertiesType
}): classOnCredential {
	// Crear cliente real que se comunica con el frontend
	const client: IClientService = clientContext({ socket })
	// Dependencia
	const dependency = dependencyContext()

	return { action: '', credentials, client, dependency }
}
