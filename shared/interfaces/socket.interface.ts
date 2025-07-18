import type { Socket } from 'socket.io'

export interface ISocket extends Socket {
	token: string
	session: {
		id: number
		name: string
		alias: string
		workspace?: number
	}
}
