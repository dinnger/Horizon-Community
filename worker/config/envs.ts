import { config } from 'dotenv'
config()

interface Envs {
	IS_DEV: boolean
	WORKER_CLUSTER: number
	PORT: number
	SERVER_URL: string
	TRACKING_EXECUTE: boolean
}

const { NODE_ENV, WORKER_CLUSTER, PORT, SERVER_URL, TRACKING_EXECUTE } = process.env

if (!NODE_ENV) {
	throw new Error('NODE_ENV no definido')
}

if (!PORT) {
	throw new Error('PORT no definido')
}

export const envs: Envs = {
	IS_DEV: NODE_ENV === 'development',
	WORKER_CLUSTER: WORKER_CLUSTER ? Number.parseInt(WORKER_CLUSTER) : 1,
	PORT: PORT ? Number.parseInt(PORT) : 3000,
	SERVER_URL: SERVER_URL || '',
	TRACKING_EXECUTE: TRACKING_EXECUTE ? TRACKING_EXECUTE === 'true' : false
}
