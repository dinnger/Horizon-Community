import type { SocketData } from './index.js'

export const setupSubscribersRoutes = {
	// Emits an event to a specific room
	'subscribe:emit': async ({ io, event, eventData }: { io: any; event: string; eventData: any }) => {
		io.to(event).emit(event, eventData)
	},
	// Joins a specific room
	'subscribe:join': async ({ socket, data, callback }: SocketData) => {
		const { room } = data
		try {
			socket.join(room)
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
			for (const list of rooms) {
				if ((!strict && list.startsWith(room)) || list === room) {
					socket.leave(list)
				}
			}
		} catch (error) {
			console.log('Error al eliminar usuario de la sala:', error)
			callback({ success: false, message: 'Error al eliminar usuario de la sala' })
		}
	}
}
