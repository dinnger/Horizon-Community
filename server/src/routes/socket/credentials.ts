import { getNodeCredentials } from '@shared/store/node.store.js'
import type { SocketData } from './index.js'

export const setupCredentialsRoutes = {
	// List all available node classes - requires read permission
	'credentials:list': async ({ callback }: SocketData) => {
		callback({ success: true, credentials: getNodeCredentials() })
	},
	// Get the properties of a node class - requires read permission
	'credentials:get': async ({ callback, data }: SocketData) => {
		const { node } = data as { node: string }
		const nodeInfo = getNodeCredentials(node)
		if (!nodeInfo) return callback({ success: false, message: 'No se encontró la credencial' })
		const credentials = 'credentials' in nodeInfo ? nodeInfo.credentials : undefined
		return callback({ success: true, credentials })
	}
}
