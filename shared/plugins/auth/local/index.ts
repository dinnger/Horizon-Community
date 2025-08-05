import { setupAuthRoutes } from '@server/src/routes/socket/auth.js'
import { Strategy as LocalStrategy } from 'passport-local'
import jwt from 'jsonwebtoken'
import { envs } from '@server/src/config/envs.js'

function generateToken(encript: object) {
	try {
		const hash = jwt.sign(encript, envs.SECURITY_TOKEN || '', { algorithm: 'RS256', expiresIn: '1d' })
		return hash
	} catch (err) {
		console.error('Error al generar token:', err)
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

export default class {
	public type = 'post'
	passport: any

	constructor({ passport }: { passport: any }) {
		this.passport = passport
	}

	beforeAuth = () => {
		this.passport.use(
			new LocalStrategy(
				{
					usernameField: 'email',
					passwordField: 'password',
					passReqToCallback: true
				},
				async (req: any, username: string, password: string, done: any) => {
					await setupAuthRoutes['auth:login']({
						data: { email: username, password },
						callback: ({ success, message, user }: any) => {
							if (!success) return done(null, false, { message })
							return done(null, user)
						}
					} as any)
				}
			)
		)
	}

	middleware = () => this.passport.authenticate('local')

	response = ({ req, res }: { req: any; res: any }) => {
		const user = req.user as any
		if (!user) return res.status(401).json({ success: false, message: 'No se encontró el usuario' })

		const token = req.body.rememberMe ? generateToken({ userId: req.user.userId, hash: req.user.hash }) : undefined
		res.status(200).json({ success: true, user: user, token })
	}
}
