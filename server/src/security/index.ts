import { writeFileSync, existsSync, readFileSync } from 'node:fs'
import { generateKeyPairSync } from 'crypto'

export function initSecurity() {
	if (!existsSync('private.key')) {
		const { privateKey } = generateKeyPairSync('rsa', {
			modulusLength: 2048,
			publicKeyEncoding: { type: 'pkcs1', format: 'pem' },
			privateKeyEncoding: { type: 'pkcs1', format: 'pem' }
		})

		writeFileSync('private.key', privateKey)
		return privateKey
	}
	return readFileSync('private.key').toString()
}
