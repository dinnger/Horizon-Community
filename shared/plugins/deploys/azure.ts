import type { infoInterface } from '@shared/interfaces/index.js'
import type { IPropertiesType } from '../../interfaces/workflow.properties.interface.js'
import type { classDeployInterface } from '@shared/interfaces/deployment.interface.js'

export default class implements classDeployInterface {
	// ===============================================
	// Dependencias
	// ===============================================
	// ===============================================
	constructor(
		public info: infoInterface,
		public properties: IPropertiesType,
		public meta: {
			nodesExecuted?: Set<string>
			executeData?: Map<string, { data: object; meta?: object; time: number }>
		} = {}
	) {
		this.info = {
			name: 'Azure',
			desc: 'Despliega el flujo en una instancia de Azure.',
			icon: '󰠅',
			group: 'Despliegue',
			color: '#0078D4',
			connectors: {
				inputs: [{ name: 'input' }],
				outputs: [{ name: 'output' }]
			}
		}

		this.properties = {
			resourceGroup: {
				name: 'Grupo de Recursos:',
				type: 'string',
				value: 'horizon-prod',
				placeholder: 'Ingresa el nombre del grupo de recursos',
				required: true
			},
			location: {
				name: 'Región:',
				type: 'options',
				options: [
					{ label: 'East US', value: 'eastus' },
					{ label: 'West Europe', value: 'westeurope' },
					{ label: 'Central US', value: 'centralus' },
					{ label: 'South Central US', value: 'southcentralus' }
				],
				value: 'eastus'
			},
			instanceSize: {
				name: 'Tamaño de Instancia:',
				type: 'options',
				options: [
					{ label: 'B1s (1 vCPU, 1 GB RAM)', value: 'Standard_B1s' },
					{ label: 'B2s (2 vCPU, 4 GB RAM)', value: 'Standard_B2s' },
					{ label: 'D2s v3 (2 vCPU, 8 GB RAM)', value: 'Standard_D2s_v3' }
				],
				value: 'Standard_B1s'
			},
			enableHttps: {
				name: 'Habilitar HTTPS:',
				type: 'switch',
				value: true
			},
			customDomain: {
				name: 'Dominio Personalizado:',
				type: 'string',
				value: '',
				placeholder: 'ejemplo.com (opcional)'
			},
			deploymentSlots: {
				name: 'Slots de Despliegue:',
				type: 'number',
				value: 2,
				min: 1,
				max: 5
			},
			environmentVariables: {
				name: 'Variables de Entorno:',
				type: 'textarea',
				value: 'NODE_ENV=production\nPORT=8080',
				rows: 4
			}
		}
	}

	async onExecute({ context }: Parameters<classDeployInterface['onExecute']>[0]) {}
}
