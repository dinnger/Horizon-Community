import type { IPropertiesType } from '../../interfaces/workflow.properties.interface.js'
import type { classDeployInterface, classOnExecuteInterface, infoInterface } from '@shared/interfaces/deployment.interface.js'

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
			title: 'Docker',
			desc: 'Despliega el flujo en un contenedor docker.',
			icon: '󰡨'
		}

		this.properties = {
			imageName: {
				name: 'Nombre de la Imagen:',
				type: 'string',
				value: 'horizon-app',
				placeholder: 'Nombre de la imagen Docker',
				required: true
			},
			imageTag: {
				name: 'Tag de la Imagen:',
				type: 'string',
				value: 'latest',
				placeholder: 'v1.0.0 o latest'
			},
			containerPort: {
				name: 'Puerto del Contenedor:',
				type: 'number',
				value: 3000,
				min: 1,
				max: 65535
			},
			hostPort: {
				name: 'Puerto del Host:',
				type: 'number',
				value: 8080,
				min: 1,
				max: 65535
			},
			enableVolumes: {
				name: 'Habilitar Volúmenes:',
				type: 'switch',
				value: false
			},
			volumePath: {
				name: 'Ruta del Volumen:',
				type: 'string',
				value: '/app/data',
				placeholder: 'Ruta dentro del contenedor'
			},
			environmentVars: {
				name: 'Variables de Entorno:',
				type: 'textarea',
				value: 'NODE_ENV=production\nDATABASE_URL=postgresql://...',
				rows: 3
			},
			memoryLimit: {
				name: 'Límite de Memoria (MB):',
				type: 'number',
				value: 512,
				min: 128,
				max: 4096
			},
			restartPolicy: {
				name: 'Política de Reinicio:',
				type: 'options',
				options: [
					{ label: 'No reiniciar', value: 'no' },
					{ label: 'Al fallar', value: 'on-failure' },
					{ label: 'A menos que se detenga', value: 'unless-stopped' },
					{ label: 'Siempre', value: 'always' }
				],
				value: 'unless-stopped'
			}
		}
	}
}
