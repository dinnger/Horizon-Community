/**
 * Node REST Routes
 *
 * Provides REST API endpoints for node operations with socket authentication validation.
 * These endpoints complement the socket-based node routes with HTTP access.
 */
import express from 'express'
import { ApiExternalNodes } from './external/nodes.js'
import { ApiExternalCredentials } from './external/credentials.js'

const router = express.Router()

export default function ({ app, server }: { app: any; server: any }) {
	router.use('/nodes', ApiExternalNodes({ app, server }))
	router.use('/credentials', ApiExternalCredentials({ app, server }))
	return router
}
