import express from 'express'
import { createServer } from 'node:http'
import { Server } from 'socket.io'
import cors from 'cors'

import { initDatabase } from './models/index.js'
import { seedDatabase } from './seeders/seed.js'
import { socketAuthMiddleware } from './middleware/socketAuth.js'
import { socketRoutes } from './routes/socket/index.js'
import { envs } from './config/envs.js'
import { nodeRestRoutes } from './routes/nodeRest.js'
import { workerManager } from './services/workerManager.js'
import { deploymentQueueService } from './services/deploymentQueueService.js'

const app = express()
const server = createServer(app)
const io = new Server(server, {
	cors: {
		origin: envs.CLIENT_URL || 'http://localhost:5173',
		methods: ['GET', 'POST']
	}
})

const PORT = envs.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())

// Socket.IO authentication middleware
io.use(socketAuthMiddleware)

// Setup all socket routes
socketRoutes.init(io)

workerManager.setIo(io)

// Health check endpoint
app.get('/health', (req, res) => {
	res.json({ status: 'OK', timestamp: new Date().toISOString() })
})

// Node REST routes
app.use('/api/nodes', nodeRestRoutes)

// Initialize database and start server
const startServer = async () => {
	try {
		await initDatabase()

		// Initialize deployment queue service
		await deploymentQueueService.init(socketRoutes, io)

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
