/**
 * Node REST Routes
 *
 * Provides REST API endpoints for node operations with socket authentication validation.
 * These endpoints complement the socket-based node routes with HTTP access.
 */
import express from 'express'
import { getNodeOnUpdateProperties } from '@shared/store/node.store.js'

const router = express.Router()

export default function ({ app, server }: { app: any; server: any }) {
	/**
	 * Get node onCreate script as JavaScript directly
	 * Validates that the socketId is from an active, authenticated connection
	 * Returns the script as JavaScript content-type for direct import()
	 *
	 * @route GET /:socketId/:nodeType
	 * @param {string} socketId - The socket ID to validate
	 * @param {string} nodeType - The type of node to get onCreate script for
	 * @returns {string} JavaScript code for the onCreate script
	 */
	router.get('/nodes/properties/:nodeType', (req: any, res: any) => {
		try {
			const { nodeType } = req.params
			const { userId } = req.session

			// Validate nodeType parameter
			if (!nodeType) {
				return res.status(400).json({
					success: false,
					message: 'nodeType es requerido'
				})
			}

			// Get the onCreate script for the node type
			const onCreateScript = getNodeOnUpdateProperties(nodeType)

			if (!onCreateScript) {
				return res.status(404).json({
					success: false,
					message: `No se encontró script onCreate para el tipo de nodo: ${nodeType}`
				})
			}

			// Set JavaScript content type and return script directly
			res.setHeader('Content-Type', 'application/javascript; charset=utf-8')
			res.setHeader('Access-Control-Allow-Origin', '*')
			res.setHeader('Access-Control-Allow-Methods', 'GET')
			res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

			// Add a comment header for debugging
			const scriptWithHeader = `// Node onCreate script for: ${nodeType}
// User ID: ${userId}
// Generated: ${new Date().toISOString()}

${onCreateScript}`

			return res.send(scriptWithHeader)
		} catch (error) {
			console.error('Error getting node onCreate script:', error)
			// Even for errors, return as JavaScript with error handling
			res.setHeader('Content-Type', 'application/javascript; charset=utf-8')
			return res.status(500).send(`
// Error loading onCreate script
console.error('Error interno del servidor al cargar el script onCreate');
export default function() {
	throw new Error('Error interno del servidor al cargar el script onCreate');
};
`)
		}
	})
	return router
}
