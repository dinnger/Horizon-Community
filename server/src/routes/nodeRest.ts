/**
 * Node REST Routes
 *
 * Provides REST API endpoints for node operations with socket authentication validation.
 * These endpoints complement the socket-based node routes with HTTP access.
 */

import { Router } from 'express'
import { getNodeOnCreate } from '@shared/store/node.store.js'
import { getAuthenticatedUsers } from '../middleware/socketAuth.js'

const router = Router()

/**
 * Middleware to validate socket authentication
 * @param {any} req - Express request object
 * @param {any} res - Express response object
 * @param {Function} next - Express next function
 */
const validateSocketAuth = (req: any, res: any, next: any) => {
	const { socketId } = req.params

	if (!socketId) {
		return res.status(400).json({
			success: false,
			message: 'socketId es requerido'
		})
	}

	const authenticatedUsers = getAuthenticatedUsers()
	const userId = authenticatedUsers.get(socketId)

	if (!userId) {
		return res.status(401).json({
			success: false,
			message: 'Socket no autenticado o inactivo'
		})
	}

	// Attach userId to request for use in route handlers
	req.userId = userId
	next()
}

/**
 * Validate socket and node type access
 * Returns validation status without the actual script
 *
 * @route GET /:socketId/:nodeType/validate
 * @param {string} socketId - The socket ID to validate
 * @param {string} nodeType - The type of node to validate access for
 * @returns {object} Success response with validation status
 */
router.get('/:socketId/:nodeType/validate', validateSocketAuth, (req: any, res: any) => {
	try {
		const { socketId, nodeType } = req.params
		const { userId } = req

		// Validate nodeType parameter
		if (!nodeType) {
			return res.status(400).json({
				success: false,
				message: 'nodeType es requerido'
			})
		}

		// Check if the onCreate script exists for the node type
		const onCreateScript = getNodeOnCreate(nodeType)

		if (!onCreateScript) {
			return res.status(404).json({
				success: false,
				message: `No se encontró script onCreate para el tipo de nodo: ${nodeType}`
			})
		}

		// Return validation success (without the script)
		return res.json({
			success: true,
			socketId,
			nodeType,
			userId,
			message: 'Acceso validado correctamente',
			scriptExists: true
		})
	} catch (error) {
		console.error('Error validating node access:', error)
		return res.status(500).json({
			success: false,
			message: 'Error interno del servidor'
		})
	}
})

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
router.get('/:socketId/:nodeType', validateSocketAuth, (req: any, res: any) => {
	try {
		const { socketId, nodeType } = req.params
		const { userId } = req

		// Validate nodeType parameter
		if (!nodeType) {
			return res.status(400).json({
				success: false,
				message: 'nodeType es requerido'
			})
		}

		// Get the onCreate script for the node type
		const onCreateScript = getNodeOnCreate(nodeType)

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
// Socket ID: ${socketId}
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

/**
 * Get general information about available nodes for an authenticated socket
 *
 * @route GET /:socketId/info
 * @param {string} socketId - The socket ID to validate
 * @returns {object} Success response with available node types
 */
router.get('/:socketId/info', validateSocketAuth, (req: any, res: any) => {
	try {
		const { socketId } = req.params
		const { userId } = req

		// Get available node types (without onCreate scripts)
		const authenticatedUsers = getAuthenticatedUsers()
		const availableNodeTypes = ['ejemplo/nodo1', 'ejemplo/nodo2'] // This could be dynamically loaded

		return res.json({
			success: true,
			socketId,
			userId,
			message: 'Información de nodos disponible',
			availableEndpoints: {
				'GET /:socketId/info': 'Obtener información general de nodos disponibles',
				'GET /:socketId/:nodeType': 'Obtener script onCreate de un tipo de nodo específico'
			},
			note: 'Solo los sockets autenticados y activos pueden acceder a estos endpoints'
		})
	} catch (error) {
		console.error('Error getting node info:', error)
		return res.status(500).json({
			success: false,
			message: 'Error interno del servidor'
		})
	}
})

export { router as nodeRestRoutes }
