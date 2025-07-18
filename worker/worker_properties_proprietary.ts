// dayjs
import dayjs from 'dayjs'

export const proprietaryFunctionsDescriptions = {
	_keys:
		'(value, join?): Devuelve las claves de un objeto separadas por `join`. Si no se proporciona `join`, devuelve un array de las claves.',
	_keysReplace:
		'(value, join, valueReplace): Devuelve las claves de un objeto separadas por `join`, reemplazando el valor definido en `valueReplace` por un numero consecutivo. Si no se define `join` se devuelve un array.',
	_values:
		'(value, join?): Devuelve los valores de un objeto separados por `join`. Si no se proporciona `join`, devuelve un array de los valores.',
	_repeat:
		'(value, count, valueReplace): Devuelve un array de `count` elementos, cada uno con remplaza el valor definido en `valueReplace` por un numero consecutivo. Si no se proporciona `valueReplace`, devuelve `value`.',
	_length: '(value): Devuelve la longitud de un objeto.',
	_randomInt:
		'(min, max): Devuelve un número entero aleatorio entre `min` y `max`.',
	_randomFloat:
		'(min, max, decimals?): Devuelve un número flotante aleatorio entre `min` y `max`. `decimals` es opcional y define el número de decimales que se desean devolver.',
	_randomString:
		'(length): Devuelve una cadena de caracteres aleatoria de longitud `length`.',
	_now: '(format?): Devuelve la fecha actual en formato `format`. `format` es opcional y define el formato de la fecha que se desea devolver. Default es `DD/MM/YYYY HH:mm:ss`.',
	_dayJs: '(): Devuelve la fecha actual en formato `dayjs`.',
	_extract:
		'(value, list): Devuelve un objeto con las clave valor de `list` que están presentes en `value`.',
	_extractValues:
		'(value, list): Devuelve un array con los valores de `list` que están presentes en `value`,'
}

export function proprietaryFunctions() {
	return {
		_keys: (value: object, join?: string) => {
			if (typeof value !== 'object') {
				console.log('[WARN] [_keys] -> El valor no es un objeto')
				return value
			}
			if (join === undefined) return Object.keys(value)
			return Object.keys(value).join(join)
		},
		_keysReplace: (value: object, join?: string, valueReplace?: string) => {
			if (typeof value !== 'object') {
				console.log('[WARN] [_keysReplace] -> El valor no es un objeto')
				return value
			}
			if (join === undefined || valueReplace === undefined) {
				console.log('[WARN] [_keysReplace] -> Faltan parámetros')
				return value
			}

			const arr: Array<string> = []
			for (const [index, key] of Object.entries(Object.keys(value))) {
				const val: string = `${key}${join}`.replace(
					new RegExp(valueReplace, 'g'),
					() => (Number.parseInt(index) + 1).toString()
				)
				arr.push(val)
			}
			return arr
		},
		_values: (value: object, join?: string) => {
			if (typeof value !== 'object') {
				console.log('[WARN] [_values] -> El valor no es un objeto')
				return value
			}
			if (join === undefined) return Object.values(value)
			return Object.values(value).join(join)
		},

		_extract: (value: { [key: string]: any }, list: string[]) => {
			const extracted = list.reduce((acc: { [key: string]: any }, key) => {
				if (key in value) {
					acc[key] = value[key]
				}
				return acc
			}, {})
			return extracted
		},

		_extractValues: (value: { [key: string]: any }, list: string[]) => {
			const extracted = list.map((key) => value[key])
			return extracted
		},
		_repeat: (value: string | number, count: number, valueReplace?: string) => {
			if (typeof value !== 'string' && typeof value !== 'number') {
				console.log('[WARN] [_repeat] -> El valor no es un string o un number')
				return value
			}
			if (typeof value === 'number' && valueReplace) {
				console.log(
					'[WARN] [_repeat] -> El valor no es aplicable a un tipo number'
				)
				return value
			}
			const tempArray: Array<string | number> = []
			let tempValue = value
			for (let i = 0; i < count; i++) {
				if (valueReplace && typeof value === 'string')
					tempValue = value.replace(valueReplace, (i + 1).toString())
				tempArray.push(tempValue)
			}
			return tempArray
		},
		_length: (value: string | number | object) => {
			if (typeof value === 'number') {
				console.log(
					'[WARN] [_length] -> El valor no es aplicable a un tipo number'
				)
				return value
			}
			if (typeof value === 'string') return value.length
			return Object.keys(value).length
		},
		_randomInt: (min: number, max: number) => {
			if (typeof min !== 'number' || typeof max !== 'number') {
				console.log('[WARN] [randomInt] -> Parámetros no válidos')
				return 0
			}
			return Math.floor(Math.random() * (max - min)) + min
		},
		_randomFloat: (min: number, max: number, decimals = 2) => {
			if (
				typeof min !== 'number' ||
				typeof max !== 'number' ||
				typeof decimals !== 'number'
			) {
				console.log('[WARN] [randomFloat] -> Parámetros no válidos')
				return 0
			}
			const random = (Number(Math.random()) * (max - min) + min).toFixed(
				decimals
			)
			// extrae el punto decimal
			const isPoint = random.indexOf('.') >= 0
			const [integer, decimal] = isPoint ? random.split('.') : random.split(',')
			return (
				integer +
				(isPoint ? '.' : ',') +
				decimal.toString().padStart(decimals, '0')
			)
		},
		_randomString: (length: number) => {
			if (typeof length !== 'number') {
				console.log('[WARN] [randomString] -> Faltan parámetros')
				return ''
			}
			const characters =
				'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
			let result = ''
			for (let i = 0; i < length; i++) {
				result += characters.charAt(
					Math.floor(Math.random() * characters.length)
				)
			}
			return result
		},
		_now: (format = 'DD/MM/YYYY HH:mm:ss') => {
			return dayjs().format(format)
		},
		_dayJs: () => {
			return dayjs()
		},
		btoa: (str: string) => {
			return Buffer.from(str).toString('base64')
		},
		atob: (str: string) => {
			return Buffer.from(str, 'base64').toString('binary')
		}
	}
}
