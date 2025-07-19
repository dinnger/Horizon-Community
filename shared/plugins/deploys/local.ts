import fs from 'node:fs'
import type { IPropertiesType } from '../../interfaces/workflow.properties.interface.js'
import type { classDeployInterface, classOnExecuteInterface, infoInterface } from '@shared/interfaces/deployment.interface.js'
import archiver from 'archiver'

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
			title: 'Local',
			desc: 'Despliega el flujo localmente como un servicio.',
			icon: '󰒍'
		}

		this.properties = {
			path: {
				name: 'Ruta:',
				type: 'string',
				value: './'
			},
			isZip: {
				name: 'Comprimir:',
				type: 'switch',
				value: true
			}
		}
	}

	async onExecute({ context }: classOnExecuteInterface) {
		// crear archivo zip a partir de carpeta context.path
		if (this.properties.isZip.value) {
			const chunks: Buffer[] = []
			// Create archiver instance
			const output = fs.createWriteStream(`${this.properties.path.value}/${context.flow}.zip`)
			const archive = archiver('zip', {
				zlib: { level: 9 } // Maximum compression
			})

			// // Handle errors
			// archive.on('error', (err) => {
			// 	reject(err)
			// })

			// Collect data chunks
			archive.on('data', (chunk) => {
				chunks.push(chunk)
			})

			// pipe archive data to the file
			archive.pipe(output)

			// Add directory contents
			archive.directory(context.path, false)

			// Finalize the archive
			archive.finalize()
			return
		}
		// copiar carpeta context.path a context.path
		const destinyPath = `${this.properties.path.value}/${context.flow}`
		if (!fs.existsSync(destinyPath)) {
			fs.mkdirSync(destinyPath, { recursive: true })
		}
		fs.cpSync(context.path, destinyPath, {
			recursive: true,
			force: true
		})
	}
}
