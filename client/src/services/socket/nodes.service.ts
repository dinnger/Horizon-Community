import type { Socket } from 'socket.io-client'
import type { IClassNode } from '@shared/interfaces/class.interface'
import type { INodeCanvas } from '@canvas/interfaz/node.interface'

export function socketNodes(socket: Socket | null) {
	return {
		getNodes(): Promise<Record<string, IClassNode>> {
			return new Promise((resolve, reject) => {
				if (!socket) {
					reject(new Error('Socket not connected'))
					return
				}
				socket.emit('nodes:list', {}, (response: any) => {
					if (response.success && response.nodes) {
						resolve(response.nodes)
					} else {
						reject(new Error(response.message || 'Failed to get nodes'))
					}
				})
			})
		},

		getNodeByType(type: string): Promise<INodeCanvas> {
			return new Promise((resolve, reject) => {
				if (!socket) {
					reject(new Error('Socket not connected'))
					return
				}
				socket.emit('nodes:get', { type }, (response: any) => {
					if (response.success && response.node) {
						resolve(response.node)
					} else {
						reject(new Error(response.message || 'Failed to get node'))
					}
				})
			})
		},

		getNodesByGroup(group?: string): Promise<Record<string, IClassNode>> {
			return new Promise((resolve, reject) => {
				if (!socket) {
					reject(new Error('Socket not connected'))
					return
				}
				socket.emit('nodes:list-by-group', { group }, (response: any) => {
					if (response.success && response.nodes) {
						resolve(response.nodes)
					} else {
						reject(new Error(response.message || 'Failed to get nodes by group'))
					}
				})
			})
		},

		getNodeGroups(): Promise<string[]> {
			return new Promise((resolve, reject) => {
				if (!socket) {
					reject(new Error('Socket not connected'))
					return
				}
				socket.emit('nodes:groups', {}, (response: any) => {
					if (response.success && response.groups) {
						resolve(response.groups)
					} else {
						reject(new Error(response.message || 'Failed to get node groups'))
					}
				})
			})
		},

		searchNodes(query: string): Promise<Record<string, IClassNode>> {
			return new Promise((resolve, reject) => {
				if (!socket) {
					reject(new Error('Socket not connected'))
					return
				}
				socket.emit('nodes:search', { query }, (response: any) => {
					if (response.success && response.nodes) {
						resolve(response.nodes)
					} else {
						reject(new Error(response.message || 'Failed to search nodes'))
					}
				})
			})
		},

		getNodeInfo(type: string): Promise<IClassNode> {
			return new Promise((resolve, reject) => {
				if (!socket) {
					reject(new Error('Socket not connected'))
					return
				}
				socket.emit('nodes:info', { type }, (response: any) => {
					if (response.success && response.node) {
						resolve(response.node)
					} else {
						reject(new Error(response.message || 'Failed to get node info'))
					}
				})
			})
		},

		getNodeStats(): Promise<any> {
			return new Promise((resolve, reject) => {
				if (!socket) {
					reject(new Error('Socket not connected'))
					return
				}
				socket.emit('nodes:stats', {}, (response: any) => {
					if (response.success && response.stats) {
						resolve(response.stats)
					} else {
						reject(new Error(response.message || 'Failed to get node stats'))
					}
				})
			})
		}
	}
}
