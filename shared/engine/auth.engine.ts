import path from 'node:path'
import { glob } from 'glob'
import { fileURLToPath, pathToFileURL } from 'node:url'
import bcrypt from 'bcrypt'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const dirPath = path.join(__dirname, '../plugins/auth/')
const files = glob.sync('**/*.js', { cwd: dirPath })

const authList: { [key: string]: any } = {}

for (const file of files) {
	if (file && file.replace(/\\/g, '/').indexOf('/_') > -1) continue
	const type = file
		.replace(/\\/g, '/')
		.toString()
		.replace(`${dirPath.replace(/\\/g, '/')}/`, '')
		.split('/')
		.slice(0, -1)
		.join('/')
	const module = await import(pathToFileURL(path.resolve(dirPath, file)).href)

	try {
		authList[file.indexOf('index.js') === -1 ? `/${file.replace(/\\/, '/').replace(/\.js$/, '')}` : `/${type}`] = module.default
	} catch (error) {
		console.log(`Error al cargar el nodo ${file}`, error)
	}
}

export function getAuthList() {
	return Object.fromEntries(Object.entries(authList).map(([key, value]) => [key, value]))
}

// Simulación de usuarios en memoria
const users = [
	{ id: 1, username: 'admin', password: bcrypt.hashSync('admin123', 10), alias: 'Administrador' },
	{ id: 2, username: 'user', password: bcrypt.hashSync('user123', 10), alias: 'Usuario' }
]

export async function getUserByUsername(username: string) {
	return users.find((u) => u.username === username)
}

export async function validatePassword(password: string, hash: string) {
	return bcrypt.compare(password, hash)
}
