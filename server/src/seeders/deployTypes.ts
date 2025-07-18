import { DeployType } from '../models/index.js'

export const seedDeployTypes = async () => {
	try {
		console.log('Seeding deploy types...')

		const deployTypes = [
			{
				name: 'docker',
				title: 'Docker Container',
				description: 'Deploy using Docker containers for consistent and portable deployments',
				icon: 'docker',
				properties: {
					defaultPort: 3000,
					healthCheck: true,
					autoRestart: true,
					resourceLimits: {
						memory: '512m',
						cpu: '0.5'
					}
				}
			},
			{
				name: 'kubernetes',
				title: 'Kubernetes',
				description: 'Deploy to Kubernetes cluster with scaling and orchestration capabilities',
				icon: 'kubernetes',
				properties: {
					replicas: 3,
					namespace: 'default',
					loadBalancer: true,
					autoScaling: {
						enabled: true,
						minReplicas: 1,
						maxReplicas: 10
					}
				}
			},
			{
				name: 'vm',
				title: 'Virtual Machine',
				description: 'Deploy to virtual machines with full OS control',
				icon: 'server',
				properties: {
					os: 'ubuntu-20.04',
					specs: {
						cpu: 2,
						memory: '4GB',
						storage: '50GB'
					},
					backup: true
				}
			},
			{
				name: 'serverless',
				title: 'Serverless Function',
				description: 'Deploy as serverless functions for event-driven architectures',
				icon: 'function',
				properties: {
					runtime: 'nodejs18',
					timeout: 30,
					memory: 256,
					triggers: ['http', 'schedule']
				}
			},
			{
				name: 'static',
				title: 'Static Site',
				description: 'Deploy static websites and SPAs to CDN networks',
				icon: 'globe',
				properties: {
					buildCommand: 'npm run build',
					publishDirectory: 'dist',
					redirects: true,
					caching: {
						enabled: true,
						duration: '1d'
					}
				}
			}
		]

		for (const deployTypeData of deployTypes) {
			const [deployType, created] = await DeployType.findOrCreate({
				where: { name: deployTypeData.name },
				defaults: deployTypeData
			})

			if (created) {
				console.log(`✅ Created deploy type: ${deployType.title}`)
			} else {
				console.log(`ℹ️  Deploy type already exists: ${deployType.title}`)
			}
		}

		console.log('Deploy types seeding completed!')
	} catch (error) {
		console.error('Error seeding deploy types:', error)
		throw error
	}
}
