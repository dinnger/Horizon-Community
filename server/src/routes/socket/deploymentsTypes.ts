import { getDeploysClass } from '@shared/engine/deploy.engine.js'
import type { SocketData } from './index.js'

export const setupDeploymentTypesRoutes = {
	'deployment-types:list': async ({ socket, data, callback }: SocketData) => {
		try {
			const deploys = getDeploysClass()
			const result = Object.entries(deploys).map(([key, value]) => {
				return {
					name: value.name,
					info: value.info,
					properties: { ...value.properties }
				}
			})

			callback({ success: true, types: result })
		} catch (error) {
			callback({ success: false, message: 'Error al cargar tipos de despliegue' })
		}
	}
}
