import type { classOnUpdateInterface } from '@shared/interfaces'
import type { IProperty } from './properties'

export default function (properties: IProperty, { context }: classOnUpdateInterface) {
	properties.nameFile.show = false
	properties.header.show = true
	properties.contentType.disabled = false

	if (properties.isFile.value) {
		properties.nameFile.show = true
		properties.header.show = false
		properties.contentType.value = 'application/octet-stream'
		properties.contentType.disabled = true
	}
}
