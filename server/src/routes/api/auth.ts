import Ajv from 'ajv'
import express from 'express'
import { envs } from '../../config/envs.js'
import { getAuthList } from '@shared/store/auth.store.js'
import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'

const router = express.Router()

function validToken(req: Request) {
	const ajv = new Ajv()
	const schema = {
		type: 'object',
		properties: {
			token: { type: 'string' }
		},
		required: ['token']
	}
	const valid = ajv.validate(schema, req.body)
	if (!valid) return false
	return true
}

function validPassword(valid: string, origen: string) {
	const bcrypt = require('bcrypt')
	return bcrypt.compareSync(valid, origen)
}

function generateToken(encript: object) {
	try {
		const jwt = require('jsonwebtoken')
		const hash = jwt.sign(encript, envs.SECURITY_TOKEN, { expiresIn: '1d' })
		return hash
	} catch {
		return null
	}
}

function getToken(value: string) {
	try {
		const jwt = require('jsonwebtoken')
		const val = jwt.verify(value, envs.SECURITY_TOKEN)
		return val
	} catch {
		return null
	}
}

export default function ({ app, server }: { app: any; server: any }) {
	app.use(passport.initialize())
	app.use(passport.session())

	passport.serializeUser((user, done) => {
		done(null, user)
	})
	passport.deserializeUser((user: any, done) => {
		done(null, user)
	})

	// List directory auth
	const arr = getAuthList()
	for (const dir in arr) {
		const auth = new arr[dir]({ passport })
		console.log('------>', auth.type, dir)
		const route = []
		if (auth.beforeAuth) auth.beforeAuth({ app, server, passport })
		if (auth.middleware) route.push(auth.middleware())
		if (auth.response) route.push((req: any, res: any) => auth.response({ app, server, req, res, generateToken }))

		const type: 'get' | 'post' | 'put' | 'delete' = auth.type || 'get'
		router[type](dir, ...route)
	}

	// router.use('/google', routerGoogle({ app, appInstance, generateToken }))

	router.post('/validate', async (req: any, res: any) => {
		if (!validToken(req)) return res.status(403).json('Datos inválidos')
		const token = await getToken(req.body.token)
		if (!token || !token.alias) return res.status(403).json('Datos inválidos')
		const data = {
			id: token.id,
			alias: token.alias
		}

		res.status(200).json({
			id: token.id,
			alias: token.alias,
			token: generateToken(data)
		})
	})
	return router
}
