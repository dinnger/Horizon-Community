import passport from 'passport'
import express from 'express'
import { getAuthList } from '@shared/engine/auth.engine.js'
import { setupAuthRoutes } from '../socket/auth.js'

const router = express.Router()

export default function ({ app, server }: { app: any; server: any }) {
	passport.serializeUser((user, done) => {
		done(null, user)
	})
	passport.deserializeUser((user: any, done) => {
		done(null, user)
	})

	// List directory auth
	const arr = getAuthList()
	if (Object.keys(arr).length > 0) console.log('🔑 Proveedores de autenticación cargados:')
	for (const dir in arr) {
		const auth = new arr[dir]({ passport })
		console.log('-->', dir)
		const route = []
		if (auth.beforeAuth) auth.beforeAuth({ app, server, passport })
		if (auth.middleware) route.push(auth.middleware())
		if (auth.response) route.push((req: any, res: any) => auth.response({ app, server, req, res }))

		const type: 'get' | 'post' | 'put' | 'delete' = auth.type || 'get'
		router[type](dir, ...route)
	}

	router.post('/logout', async (req: any, res: any, next: any) => {
		if (!req.user) return res.status(403).json('Datos inválidos')
		req.logout((err: any) => {
			if (err) {
				return next(err)
			}
			res.status(200).json('OK')
		})
	})

	router.post('/validate', async (req: any, res: any) => {
		if (!req.user) return res.status(403).json('Datos inválidos')

		// Obtener permisos del usuario
		setupAuthRoutes['auth:check-permission']({
			data: { userId: req.user.userId, hash: req.user.hash },
			callback: ({ success, response }: any) => {
				if (!success) return res.status(403).json('Datos inválidos, intente iniciar sesión nuevamente')
				req.user.name = response.name
				req.user.avatar = response.avatar
				req.user.roleId = response.roleId
				req.user.settings = response.settings
				req.user.permissions = response.permissions
				const { hash, ...user } = req.user
				res.status(200).json(user)
			}
		} as any)
	})
	return router
}
