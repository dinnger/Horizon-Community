import type { SocketData } from './index.js'

export const setupSubscribersRoutes = {
	// Emits an event to a specific room
	'subscribe:emit': async ({ io, data }: { io: any; data: { event: string; eventData: any } }) => {
		const { event, eventData } = data
		io.to(event).emit(event, eventData)
	},

	// Joins a specific room
	'subscribe:join': async ({ socket, data, callback, eventRouter }: SocketData) => {
		const { room } = data
		try {
			socket.join(room)
			const [domain, action, ...args] = room.split(':')

			// Emit general subscription event
			if (domain === 'worker' && action === 'status' && args.length > 0) {
				eventRouter('workers:by-workflow', { workflowId: args[0] }, ({ success, workers }) => {
					if (success) {
						callback({ success, workers })
					} else {
						callback({ success: false })
					}
					return
				})
			}

			callback({ success: true, message: `Suscrito a eventos de ${room}` })
		} catch (error) {
			console.error('Error al suscribirse a eventos', room, error)
			callback({ success: false, message: 'Error al suscribirse a eventos de animaciones' })
		}
	},

	// Leaves a specific room
	'subscribe:close': async ({ socket, data, callback }: SocketData) => {
		try {
			const { room, strict = false } = data
			const rooms = socket.rooms

			// Check if room is a regex pattern
			const isRegex = room.startsWith('/') && room.endsWith('/')
			let roomPattern: RegExp | null = null

			if (isRegex) {
				try {
					// Extract regex pattern without the surrounding slashes
					const regexString = room.slice(1, -1)
					roomPattern = new RegExp(regexString)
				} catch (regexError) {
					console.error('Invalid regex pattern:', room, regexError)
					callback({ success: false, message: 'Patrón regex inválido' })
					return
				}
			}

			const leaves = []

			for (const list of rooms) {
				let shouldLeave = false

				if (roomPattern) {
					// Use regex matching
					shouldLeave = roomPattern.test(list)
				} else if (strict) {
					// Exact match
					shouldLeave = list === room
				} else {
					// Starts with match
					shouldLeave = list.startsWith(room)
				}

				if (shouldLeave) {
					leaves.push(list)
					socket.leave(list)
				}
			}

			// const [domain, action, ...args] = room.split(':')
			callback({ success: true, list: leaves })
		} catch (error) {
			console.log('Error al eliminar usuario de la sala:', error)
			callback({ success: false, message: 'Error al eliminar usuario de la sala' })
		}
	}
}
