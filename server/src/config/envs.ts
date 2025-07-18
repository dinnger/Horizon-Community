import { config } from 'dotenv'
config()

interface Envs {
	NODE_ENV: 'development' | 'production'
	IS_DEV: boolean
	IS_WINDOWS: boolean

	DB_PATH: string
	PORT: number
	SERVER_URL: string

	CLIENT_URL: string

	SEED_DATABASE: boolean
	TRACKING_EXECUTE: boolean
	TRACKING_ROUTE: boolean
}

const { VITE_SERVER_URL, DB_PATH, PORT, NODE_ENV, SERVER_URL, CLIENT_URL, SEED_DATABASE, TRACKING_EXECUTE, TRACKING_ROUTE } = process.env

if (!DB_PATH) {
	throw new Error('No se encontró la variable de entorno DB_PATH')
}

if (!PORT) {
	throw new Error('No se encontró la variable de entorno PORT')
}

if (!NODE_ENV) {
	throw new Error('No se encontró la variable de entorno NODE_ENV')
}

if (!SERVER_URL) {
	throw new Error('No se encontró la variable de entorno SERVER_URL')
}

if (!CLIENT_URL) {
	throw new Error('No se encontró la variable de entorno CLIENT_URL')
}

if (!SEED_DATABASE) {
	throw new Error('No se encontró la variable de entorno SEED_DATABASE')
}

if (!VITE_SERVER_URL) {
	throw new Error('No se encontró la variable de entorno VITE_SERVER_URL')
}

export const envs: Envs = {
	IS_DEV: NODE_ENV === 'development',
	IS_WINDOWS: process.platform === 'win32',
	DB_PATH,
	PORT: Number.parseInt(PORT),
	NODE_ENV: NODE_ENV as 'development' | 'production',
	SERVER_URL,
	CLIENT_URL,
	SEED_DATABASE: SEED_DATABASE?.toString().toLowerCase() === 'true',
	TRACKING_EXECUTE: TRACKING_EXECUTE?.toString().toLowerCase() === 'true',
	TRACKING_ROUTE: TRACKING_ROUTE?.toString().toLowerCase() === 'true'
}
