import express from 'express'
import type { Request, Response } from 'express'
import { decrypt } from '../../../utils/cryptography.js'
import { temporalKeyManager } from '@shared/store/temporalKey.js'

const router = express.Router()

export function ApiExternalCredentials({ app, server }: { app: any; server: any }) {
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

	router.get('/open', async (req: Request, res: Response) => {
		const { token } = req.query
		// redirect to url with query params and additional headers
		if (!token || typeof token !== 'string') {
			res.status(400).send('Token is required')
			return
		}

		const { uri, uid, headers, queryParams, meta } = JSON.parse(decrypt(token))

		if (!uri || typeof uri !== 'string') {
			res.status(400).send('URL is required')
			return
		}

		let redirectUrl = uri

		// Add query parameters if they exist
		if (queryParams && typeof queryParams === 'object') {
			const urlObj = new URL(redirectUrl)
			for (const [key, value] of Object.entries(queryParams)) {
				urlObj.searchParams.append(key, String(value))
			}
			redirectUrl = urlObj.toString()
		}

		// Set additional headers if they exist
		if (headers && typeof headers === 'object') {
			for (const [key, value] of Object.entries(headers)) {
				res.setHeader(key, String(value))
			}
		}
		req.session.credentials = { uid, meta }
		res.redirect(redirectUrl)
	})

	router.get('/callback', async (req: Request, res: Response) => {
		const { uid, meta } = req.session.credentials
		if (!uid || !meta) {
			res.send('No se encontró el usuario')
			temporalKeyManager.reject({
				key: uid,
				data: { expired: true, message: 'Session expired or not found' }
			})
			return
		}

		temporalKeyManager.resolve({
			key: uid,
			data: req.query,
			meta
		})
		res.send('<script>window.close();</script > ')
	})
	return router
}
