import { setupAuthRoutes } from '@server/src/routes/socket/auth.js'
import { Strategy as LocalStrategy } from 'passport-local'

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
					usernameField: 'username',
					passwordField: 'password',
					passReqToCallback: true
				},
				async (req: any, username: string, password: string, done: any) => {
					setupAuthRoutes['auth:login']({
						data: { email: username, password },
						callback: ({ success, message }: any) => {
							if (!success) return done(null, false, { message })
							return done(null, true)
						}
					} as any)
				}
			)
		)
	}

	middleware = () => this.passport.authenticate('local', { successRedirect: '/', failureRedirect: '/login' })
}
