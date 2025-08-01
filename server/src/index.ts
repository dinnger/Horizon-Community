import { envs } from './config/envs.js'
import { Server } from 'socket.io'
import { initDatabase } from './models/index.js'
import { seedDatabase } from './seeders/seed.js'
import { socketRoutes } from './routes/socket/index.js'
import { workerManager } from './services/workerManager.js'
import { deploymentQueueService } from './services/deploy.service.js'
import express from 'express'
import cors from 'cors'

// import authGoogleRouter from './routes/authGoogle.js'
import auth from './routes/api/auth.js'
import external from './routes/api/external.js'
import http from 'node:http'
import https from 'node:https'
import fs from 'node:fs'
import { sessionMiddleware } from './middleware/session.js'
import passport from 'passport'

const app = express()
let PORT = envs.PORT || 3001

let server: http.Server | https.Server
if (envs.SERVER_SSL_MODE) {
	PORT = 443
	const options = {
		key: fs.readFileSync('/etc/letsencrypt/live/dinnger.com/privkey.pem'),
		cert: fs.readFileSync('/etc/letsencrypt/live/dinnger.com/fullchain.pem')
	}
	server = https.createServer(options, app)
} else {
	server = http.createServer(app)
}

const corsOptions = {
	origin: [envs.CLIENT_URL || 'http://localhost:5173'],
	credentials: true
}

const io = new Server(server, {
	cors: corsOptions
})

// Middleware

app.use(cors(corsOptions))
app.use(express.json())
app.use(sessionMiddleware)

// Socket.IO authentication middleware
io.engine.use(sessionMiddleware)

// Setup all socket routes
socketRoutes.init(io)

// Initialize worker manager
workerManager.initWorkerManager({ app, io })

// Health check endpoint
app.get('/health', (req, res) => {
	res.json({ status: 'OK', timestamp: new Date().toISOString() })
})

app.use(passport.initialize())
app.use(passport.session())

// Google Auth endpoint
app.use('/api/auth', auth({ app, server }))

// Node REST routes
app.use('/api/external', external({ app, server }))

// Initialize database and start server
const startServer = async () => {
	try {
		await initDatabase()

		// Initialize deployment queue service
		await deploymentQueueService.init()

		// Seed database if needed
		if (envs.SEED_DATABASE) {
			await seedDatabase()
		}

		server.listen(PORT, () => {
			console.log(`Servidor corriendo en puerto ${PORT}`)
			console.log('Socket.IO listo para conexiones')
		})
	} catch (error) {
		console.error('Error iniciando servidor:', error)
		process.exit(1)
	}
}

startServer()
