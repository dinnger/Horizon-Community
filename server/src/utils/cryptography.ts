import crypto from 'crypto'

const algorithm = 'aes-256-cbc'
const secretKey = crypto.createHash('sha256').update(String(process.env.SECURITY_TOKEN)).digest('base64').substr(0, 32)
const iv = crypto.createHash('sha256').update(String(process.env.SECURITY_TOKEN)).digest('base64').substr(0, 16)

/**
 * Encrypts the given text using AES-256-CBC algorithm.
 *
 * @param {string} text - The text to encrypt.
 * @returns {string} - The encrypted text in hexadecimal format.
 */
export function encrypt(text: string): string {
	const cipher = crypto.createCipheriv(algorithm, secretKey, iv)
	let encrypted = cipher.update(text, 'utf8', 'hex')
	encrypted += cipher.final('hex')
	return encrypted
}

/**
 * Decrypts the given encrypted text using AES-256-CBC algorithm.
 *
 * @param {string} encryptedText - The encrypted text in hexadecimal format.
 * @returns {string} - The decrypted text.
 */
export function decrypt(encryptedText: string): string {
	const decipher = crypto.createDecipheriv(algorithm, secretKey, iv)
	let decrypted = decipher.update(encryptedText, 'hex', 'utf8')
	decrypted += decipher.final('utf8')
	return decrypted
}
