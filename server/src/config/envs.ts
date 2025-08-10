import { config } from 'dotenv'
import { initSecurity } from '../security/index.js'
config()

interface Envs {
	NODE_ENV: 'development' | 'production'
	IS_DEV: boolean
	IS_WINDOWS: boolean

	DB_PATH: string
	DB_SYNC_FORCE: boolean

	PORT: number
	SERVER_URL: string
	SERVER_SSL_MODE: boolean

	CLIENT_URL: string

	SEED_DATABASE: boolean
	TRACKING_EXECUTE: boolean
	TRACKING_ROUTE: boolean

	GOOGLE_CLIENT_ID?: string
	GOOGLE_CLIENT_SECRET?: string
	GOOGLE_CALLBACK_URL?: string

	SECURITY_TOKEN?: string
}

const {
	VITE_SERVER_URL,
	VITE_GOOGLE_LOGIN,
	PORT,
	NODE_ENV,
	SERVER_URL,
	SERVER_SSL_MODE,
	DB_PATH,
	DB_SYNC_FORCE,
	CLIENT_URL,
	SEED_DATABASE,
	TRACKING_EXECUTE,
	TRACKING_ROUTE,
	GOOGLE_CLIENT_ID,
	GOOGLE_CLIENT_SECRET,
	GOOGLE_CALLBACK_URL
} = process.env

const SECURITY_TOKEN = initSecurity()

if (!DB_PATH) throw new Error('No se encontró la variable de entorno DB_PATH')
if (!PORT) throw new Error('No se encontró la variable de entorno PORT')
if (!NODE_ENV) throw new Error('No se encontró la variable de entorno NODE_ENV')
if (!SERVER_URL) throw new Error('No se encontró la variable de entorno SERVER_URL')
if (!SERVER_SSL_MODE) throw new Error('No se encontró la variable de entorno SERVER_SSL_MODE')
if (!CLIENT_URL) throw new Error('No se encontró la variable de entorno CLIENT_URL')
if (!SEED_DATABASE) throw new Error('No se encontró la variable de entorno SEED_DATABASE')
if (!VITE_SERVER_URL) throw new Error('No se encontró la variable de entorno VITE_SERVER_URL')
if (!VITE_GOOGLE_LOGIN) throw new Error('No se encontró la variable de entorno VITE_GOOGLE_LOGIN')
if (!GOOGLE_CLIENT_ID && (GOOGLE_CLIENT_SECRET || GOOGLE_CALLBACK_URL))
	throw new Error('No se encontró la variable de entorno GOOGLE_CLIENT_ID')
if (GOOGLE_CLIENT_ID && !GOOGLE_CLIENT_SECRET) throw new Error('No se encontró la variable de entorno GOOGLE_CLIENT_SECRET')
if (GOOGLE_CLIENT_ID && !GOOGLE_CALLBACK_URL) throw new Error('No se encontró la variable de entorno GOOGLE_CALLBACK_URL')

export const envs: Envs = {
	IS_DEV: NODE_ENV === 'development',
	IS_WINDOWS: process.platform === 'win32',
	PORT: Number.parseInt(PORT),
	NODE_ENV: NODE_ENV as 'development' | 'production',
	SERVER_URL,
	SERVER_SSL_MODE: SERVER_SSL_MODE?.toString().toLowerCase() === 'true',
	DB_PATH,
	DB_SYNC_FORCE: DB_SYNC_FORCE?.toString().toLowerCase() === 'true',
	CLIENT_URL,
	SEED_DATABASE: SEED_DATABASE?.toString().toLowerCase() === 'true',
	TRACKING_EXECUTE: TRACKING_EXECUTE?.toString().toLowerCase() === 'true',
	TRACKING_ROUTE: TRACKING_ROUTE?.toString().toLowerCase() === 'true',
	GOOGLE_CLIENT_ID,
	GOOGLE_CLIENT_SECRET,
	GOOGLE_CALLBACK_URL,
	SECURITY_TOKEN
}
