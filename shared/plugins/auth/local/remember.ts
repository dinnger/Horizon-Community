import jwt from 'jsonwebtoken'
import { envs } from '@server/src/config/envs.js'
import { Strategy as BearerStrategy } from 'passport-http-bearer'

function getToken(value: string) {
	try {
		const val = jwt.verify(value, envs.SECURITY_TOKEN || '', { algorithms: ['RS256'] })
		return val
	} catch (err: any) {
		console.error('Error al obtener token:', err.toString)
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
			new BearerStrategy((token, done) => {
				if (!token) return done(null, false)
				const user = getToken(token)
				if (!user) return done(null, false)
				const { userId, hash } = user as any

				return done(null, { userId, hash })
			})
		)
	}

	middleware = () => this.passport.authenticate('bearer')

	response = ({ req, res }: { req: any; res: any }) => {
		const user = req.user as any
		if (!user) return res.status(401).json({ success: false, message: 'No se encontró el usuario' })

		res.status(200).json({ success: true, user: user })
	}
}
