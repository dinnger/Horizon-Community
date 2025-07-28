import { envs } from './config/envs.js'
import { Server } from 'socket.io'
import { initDatabase } from './models/index.js'
import { seedDatabase } from './seeders/seed.js'
import { socketAuthMiddleware } from './middleware/socketAuth.js'
import { socketRoutes } from './routes/socket/index.js'
import { nodeRestRoutes } from './routes/nodeRest.js'
import { workerManager } from './services/workerManager.js'
import { deploymentQueueService } from './services/deploy.service.js'
import express from 'express'
import cors from 'cors'
import session from 'express-session'
// import authGoogleRouter from './routes/authGoogle.js'
import auth from './routes/api/auth.js'
import http from 'node:http'
import https from 'node:https'
import fs from 'node:fs'
import passport from 'passport'

const app = express()
let PORT = envs.PORT || 3001

let server: http.Server | https.Server
if (process.env.SSL_MODE === 'true') {
	PORT = 443
	const options = {
		key: fs.readFileSync('/etc/letsencrypt/live/dinnger.com/privkey.pem'),
		cert: fs.readFileSync('/etc/letsencrypt/live/dinnger.com/fullchain.pem')
	}
	server = https.createServer(options, app)
} else {
	server = http.createServer(app)
}

const io = new Server(server, {
	cors: {
		origin: envs.CLIENT_URL || 'http://localhost:5173',
		methods: ['GET', 'POST']
	}
})

// Middleware
app.use(cors())
app.use(express.json())
app.use(session({ secret: envs.SECURITY_TOKEN || Math.random().toString(36).slice(2), resave: false, saveUninitialized: true }))

// Socket.IO authentication middleware
io.use(socketAuthMiddleware)

// Setup all socket routes
socketRoutes.init(io)

// Initialize worker manager
workerManager.initWorkerManager({ app, io })

// Health check endpoint
app.get('/health', (req, res) => {
	res.json({ status: 'OK', timestamp: new Date().toISOString() })
})

// Google Auth endpoint
app.use('/auth', auth({ app, server }))

// Node REST routes
app.use('/api/nodes', nodeRestRoutes)

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
