import session from 'express-session'
import { envs } from '../config/envs.js'

export const sessionMiddleware = session({
	secret: envs.SECURITY_TOKEN || Math.random().toString(36).slice(2),
	resave: false,
	saveUninitialized: false
})

export const sessionWrap = (expressMiddlweare: any) => (socket: any, next: any) => {
	expressMiddlweare(socket.request, {}, next)
}
