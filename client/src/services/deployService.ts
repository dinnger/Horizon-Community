// Servicio para integrar con el sistema de despliegues del servidor
import type { IDeploymentType } from '../../../shared/interfaces/deployment.interface'

// Temporal: función que simula getDeploysClass()
export function getAvailableDeployTypes(): IDeploymentType[] {
	return [
		{
			name: 'docker',
			info: {
				title: 'Docker',
				desc: 'Despliegue usando contenedores Docker',
				icon: '🐳'
			},
			properties: {}
		},
		{
			name: 'kubernetes',
			info: {
				title: 'Kubernetes',
				desc: 'Despliegue en clúster de Kubernetes',
				icon: '☸️'
			},
			properties: {}
		},
		{
			name: 'serverless',
			info: {
				title: 'Serverless',
				desc: 'Despliegue en funciones serverless',
				icon: '⚡'
			},
			properties: {}
		},
		{
			name: 'vm',
			info: {
				title: 'Virtual Machine',
				desc: 'Despliegue en máquina virtual',
				icon: '💻'
			},
			properties: {}
		},
		{
			name: 'static',
			info: {
				title: 'Static Site',
				desc: 'Sitio web estático',
				icon: '📄'
			},
			properties: {}
		}
	]
}

// TODO: Integrar con el servidor
export async function fetchDeployTypes(): Promise<IDeploymentType[]> {
	try {
		// Aquí se haría la llamada al servidor para obtener los tipos desde deploy.store.ts
		// const response = await fetch('/api/deploy-types')
		// return response.json()

		// Por ahora retornamos los tipos estáticos
		return getAvailableDeployTypes()
	} catch (error) {
		console.error('Error fetching deploy types:', error)
		return getAvailableDeployTypes()
	}
}
