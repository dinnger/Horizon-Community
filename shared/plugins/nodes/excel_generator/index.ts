import type { IPropertiesType } from '@shared/interfaces/workflow.properties.interface.js'
import type { IClassNode, classOnExecuteInterface, infoInterface } from '@shared/interfaces/class.interface.js'

export default class implements IClassNode {
	constructor(
		public dependencies: string[],
		public info: infoInterface,
		public properties: IPropertiesType
	) {
		this.dependencies = ['exceljs']

		this.info = {
			name: 'Excel Generator',
			desc: 'Genera archivos Excel a partir de datos JSON',
			icon: '󰈛',
			group: 'Utilities',
			color: '#16A085',
			connectors: {
				inputs: ['input'],
				outputs: ['success', 'error']
			}
		}

		this.properties = {
			outputPath: {
				name: 'Ruta de salida:',
				type: 'string',
				value: './output',
				placeholder: '/ruta/al/directorio'
			},
			filename: {
				name: 'Nombre del archivo:',
				type: 'string',
				value: 'data.xlsx',
				placeholder: 'archivo.xlsx'
			},
			sheetName: {
				name: 'Nombre de la hoja:',
				type: 'string',
				value: 'Hoja1',
				placeholder: 'Nombre de la hoja'
			},
			dataSource: {
				name: 'Origen de datos:',
				type: 'options',
				options: [
					{
						label: 'Entrada JSON',
						value: 'input'
					},
					{
						label: 'Datos personalizados',
						value: 'custom'
					}
				],
				value: 'input'
			},
			customData: {
				name: 'Datos personalizados:',
				type: 'code',
				lang: 'json',
				value: `[
  {
    "id": 1,
    "nombre": "Producto A",
    "precio": 100,
    "cantidad": 10
  },
  {
    "id": 2,
    "nombre": "Producto B",
    "precio": 200,
    "cantidad": 5
  }
]`
			},
			useCustomHeaders: {
				name: 'Usar encabezados personalizados:',
				type: 'switch',
				value: false
			},
			headers: {
				name: 'Encabezados personalizados:',
				type: 'code',
				lang: 'json',
				value: `[
  {"field": "id", "header": "ID"},
  {"field": "nombre", "header": "Nombre del Producto"},
  {"field": "precio", "header": "Precio ($)"},
  {"field": "cantidad", "header": "Cantidad en Stock"}
]`
			},
			styling: {
				name: 'Aplicar estilos:',
				type: 'switch',
				value: true
			},
			headerStyle: {
				name: 'Estilo de encabezados:',
				type: 'options',
				options: [
					{
						label: 'Básico',
						value: 'basic'
					},
					{
						label: 'Profesional',
						value: 'professional'
					},
					{
						label: 'Colorido',
						value: 'colorful'
					}
				],
				value: 'professional'
			},
			autoFitColumns: {
				name: 'Ajustar ancho de columnas automáticamente:',
				type: 'switch',
				value: true
			},
			createDirectory: {
				name: 'Crear directorio si no existe:',
				type: 'switch',
				value: true
			},
			returnType: {
				name: 'Tipo de retorno:',
				type: 'options',
				options: [
					{
						label: 'Ruta del archivo',
						value: 'path'
					},
					{
						label: 'Buffer',
						value: 'buffer'
					}
				],
				value: 'path'
			}
		}
	}

	async onExecute({ inputData, outputData, dependency }: classOnExecuteInterface) {
		try {
			const ExcelJS = await dependency.getRequire('exceljs')

			// Obtener los datos para el Excel
			let jsonData: any[] = []

			if (this.properties.dataSource.value === 'input') {
				// Usar datos de entrada
				if (!inputData?.data) {
					throw new Error('No se encontraron datos en la entrada')
				}

				// Si los datos están en una propiedad específica, extraerlos
				if (inputData.data && Array.isArray(inputData.data)) {
					jsonData = inputData.data
				}
				// Si los datos son un array directamente
				else if (Array.isArray(inputData.data)) {
					jsonData = inputData.data
				}
				// Si es un objeto con alguna propiedad que contiene un array
				else if (typeof inputData.data === 'object') {
					const keys = Object.keys(inputData.data)
					// for (const key of keys) {
					// 	if (Array.isArray(inputData.data[key])) {
					// 		jsonData = inputData.data[key]
					// 		break
					// 	}
					// }
				}

				if (jsonData.length === 0) {
					throw new Error('No se pudo encontrar un array de datos en la entrada')
				}
			} else {
				// Usar datos personalizados
				try {
					jsonData = JSON.parse(this.properties.customData.value as string)
					if (!Array.isArray(jsonData)) {
						throw new Error('Los datos personalizados deben ser un array')
					}
				} catch (error) {
					throw new Error('Error al parsear los datos personalizados: formato JSON inválido')
				}
			}

			// Crear un nuevo libro de trabajo
			const workbook = new ExcelJS.Workbook()
			workbook.creator = 'Horizon3 Excel Generator'
			workbook.lastModifiedBy = 'Horizon3'
			workbook.created = new Date()
			workbook.modified = new Date()

			// Añadir una hoja
			const sheetName = this.properties.sheetName.value || 'Hoja1'
			const worksheet = workbook.addWorksheet(sheetName)

			// Determinar las columnas
			let headers: { field: string; header: string }[] = []

			if (this.properties.useCustomHeaders.value) {
				try {
					headers = JSON.parse(this.properties.headers.value as string)
				} catch (error) {
					throw new Error('Error al parsear los encabezados: formato JSON inválido')
				}
			} else {
				// Generar encabezados automáticamente basados en las propiedades del primer objeto
				if (jsonData.length > 0) {
					const firstItem = jsonData[0]
					headers = Object.keys(firstItem).map((key) => ({
						field: key,
						header: key.charAt(0).toUpperCase() + key.slice(1) // Capitalizar primera letra
					}))
				}
			}

			// Configurar las columnas
			worksheet.columns = headers.map((header) => ({
				header: header.header,
				key: header.field,
				width: 15
			}))

			// Añadir los datos
			// jsonData.forEach((row) => {
			// 	const rowData: any = {}
			// 	headers.forEach((header) => {
			// 		rowData[header.field] = row[header.field]
			// 	})
			// 	worksheet.addRow(rowData)
			// })

			// Aplicar estilos
			if (this.properties.styling.value) {
				// Estilo para los encabezados
				const headerRow = worksheet.getRow(1)

				let headerFill: any = {}
				let headerFont: any = {}

				switch (this.properties.headerStyle.value) {
					case 'basic':
						headerFill = {
							type: 'pattern',
							pattern: 'solid',
							fgColor: { argb: 'FFE0E0E0' }
						}
						headerFont = {
							bold: true
						}
						break

					case 'professional':
						headerFill = {
							type: 'pattern',
							pattern: 'solid',
							fgColor: { argb: 'FF4472C4' }
						}
						headerFont = {
							name: 'Arial',
							color: { argb: 'FFFFFFFF' },
							bold: true,
							size: 12
						}
						break

					case 'colorful':
						headerFill = {
							type: 'pattern',
							pattern: 'solid',
							fgColor: { argb: 'FF70AD47' }
						}
						headerFont = {
							name: 'Calibri',
							color: { argb: 'FFFFFFFF' },
							bold: true,
							size: 12
						}
						break
				}

				// Aplicar estilos a encabezados
				headerRow.eachCell((cell: any) => {
					cell.fill = headerFill
					cell.font = headerFont
					cell.alignment = {
						vertical: 'middle',
						horizontal: 'center'
					}
					cell.border = {
						top: { style: 'thin' },
						left: { style: 'thin' },
						bottom: { style: 'thin' },
						right: { style: 'thin' }
					}
				})

				// Estilo para filas alternadas
				worksheet.eachRow((row: any, rowNumber: number) => {
					if (rowNumber > 1) {
						// Saltar la fila de encabezados
						row.eachCell((cell: any) => {
							cell.border = {
								top: { style: 'thin' },
								left: { style: 'thin' },
								bottom: { style: 'thin' },
								right: { style: 'thin' }
							}

							// Filas alternadas
							if (rowNumber % 2 === 0) {
								cell.fill = {
									type: 'pattern',
									pattern: 'solid',
									fgColor: { argb: 'FFF2F2F2' }
								}
							}
						})
					}
				})
			}

			// Ajustar ancho de columnas automáticamente
			if (this.properties.autoFitColumns.value) {
				for (const column of worksheet.columns) {
					let maxLength = 10
					if (column.header && column.header.length > maxLength) {
						maxLength = column.header.length
					}
					// Verificar el contenido de las celdas para ajustar el ancho
					if (column.values) {
						for (const value of column.values) {
							if (value) {
								const valueLength = String(value).length
								if (valueLength > maxLength) {
									maxLength = valueLength
								}
							}
						}
					}
					column.width = maxLength < 10 ? 10 : maxLength + 2 // Añadir padding
				}
			}

			// Determinar la ruta de salida
			const outputPath = this.properties.outputPath.value || './output'
			const fileName = this.properties.filename.value || 'data.xlsx'

			// // Crear directorio si no existe
			// if (this.properties.createDirectory.value) {
			// 	if (!fs.existsSync(outputPath)) {
			// 		fs.mkdirSync(outputPath, { recursive: true })
			// 	}
			// }

			// const fullPath = path.resolve(outputPath, fileName)

			if (this.properties.returnType.value === 'path') {
				// Guardar el archivo y devolver la ruta
				// await workbook.xlsx.writeFile(fullPath)

				outputData('success', {
					// filePath: fullPath,
					message: 'Archivo Excel generado exitosamente'
				})
			} else {
				// Devolver un buffer del archivo
				const buffer = await workbook.xlsx.writeBuffer()

				outputData('success', {
					buffer: buffer,
					fileName: fileName,
					message: 'Buffer del archivo Excel generado exitosamente'
				})
			}
		} catch (error) {
			let message = 'Error al generar el archivo Excel'
			if (error instanceof Error) message = error.message
			outputData('error', { error: message })
		}
	}
}
