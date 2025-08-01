/**
 * Node Routes
 *
 * Provides socket routes for managing workflow nodes including:
 * - nodes:list - List all available node classes
 * - nodes:get - Get specific node class by type
 * - nodes:list-by-group - Get node classes filtered by group
 * - nodes:groups - Get all available node groups
 * - nodes:search - Search nodes by name, description or type
 * - nodes:info - Get detailed node information by type
 * - nodes:stats - Get node usage statistics
 * - nodes:change-property - Change node property
 *
 * All routes require appropriate permissions as defined in the permission middleware.
 */

import type { SocketData } from './index.js'
import { getNodeInfo } from '@shared/store/node.store.js'

export const setupNodeRoutes = {
	// List all available node classes - requires read permission
	'nodes:list': async ({ socket, data, callback }: SocketData) => {
		try {
			const nodeClasses = getNodeInfo()
			callback({ success: true, nodes: nodeClasses })
		} catch (error) {
			console.error('Error listando nodos:', error)
			callback({ success: false, message: 'Error al cargar nodos' })
		}
	},

	// Get specific node class by type - requires read permission
	'nodes:get': async ({ socket, data, callback }: SocketData) => {
		try {
			const { type } = data

			if (!type) {
				callback({ success: false, message: 'Tipo de nodo requerido' })
				return
			}

			const nodeClasses = getNodeInfo()
			const nodeClass = nodeClasses[type]

			if (!nodeClass) {
				callback({ success: false, message: 'Tipo de nodo no encontrado' })
				return
			}

			callback({ success: true, node: nodeClass })
		} catch (error) {
			console.error('Error obteniendo nodo:', error)
			callback({ success: false, message: 'Error al obtener nodo' })
		}
	},

	// Get node classes by group - requires read permission
	'nodes:list-by-group': async ({ socket, data, callback }: SocketData) => {
		try {
			const { group } = data
			const nodeClasses = getNodeInfo()

			let filteredNodes = nodeClasses
			if (group) {
				filteredNodes = Object.fromEntries(
					Object.entries(nodeClasses).filter(([key, node]) => {
						const nodeGroup = Array.isArray(node.group) ? node.group.join('/') : node.group || ''
						return nodeGroup === group || nodeGroup.startsWith(`${group}/`)
					})
				)
			}

			callback({ success: true, nodes: filteredNodes })
		} catch (error) {
			console.error('Error listando nodos por grupo:', error)
			callback({ success: false, message: 'Error al cargar nodos por grupo' })
		}
	},

	// Get all node groups - requires read permission
	'nodes:groups': async ({ socket, data, callback }: SocketData) => {
		try {
			const nodeClasses = getNodeInfo()
			const groups = new Set<string>()

			for (const node of Object.values(nodeClasses)) {
				const group = Array.isArray(node.group) ? node.group.join('/') : node.group || ''
				if (group) {
					groups.add(group)

					// Add parent groups too
					const parts = group.split('/')
					for (let i = 1; i < parts.length; i++) {
						groups.add(parts.slice(0, i).join('/'))
					}
				}
			}

			callback({ success: true, groups: Array.from(groups).sort() })
		} catch (error) {
			console.error('Error obteniendo grupos de nodos:', error)
			callback({ success: false, message: 'Error al obtener grupos de nodos' })
		}
	},

	// Search nodes by name or description - requires read permission
	'nodes:search': async ({ socket, data, callback }: SocketData) => {
		try {
			const { query } = data

			if (!query || typeof query !== 'string') {
				callback({ success: false, message: 'Consulta de búsqueda requerida' })
				return
			}

			const nodeClasses = getNodeInfo()
			const searchTerm = query.toLowerCase()

			const filteredNodes = Object.fromEntries(
				Object.entries(nodeClasses).filter(([key, node]) => {
					return (
						node.info.name.toLowerCase().includes(searchTerm) ||
						node.info.desc?.toLowerCase().includes(searchTerm) ||
						node.type.toLowerCase().includes(searchTerm) ||
						(Array.isArray(node.group) ? node.group.join('/') : node.group || '').toLowerCase().includes(searchTerm)
					)
				})
			)

			callback({ success: true, nodes: filteredNodes })
		} catch (error) {
			console.error('Error buscando nodos:', error)
			callback({ success: false, message: 'Error al buscar nodos' })
		}
	},

	// Get node info by type - requires read permission
	'nodes:info': async ({ socket, data, callback }: SocketData) => {
		try {
			const { type } = data

			if (!type) {
				callback({ success: false, message: 'Tipo de nodo requerido' })
				return
			}

			const nodeClasses = getNodeInfo()
			const nodeClass = nodeClasses[type]

			if (!nodeClass) {
				callback({ success: false, message: 'Tipo de nodo no encontrado' })
				return
			}

			// Return only info without the class to avoid serialization issues
			const nodeInfo = {
				name: nodeClass.info.name,
				type: nodeClass.type,
				info: nodeClass.info,
				group: nodeClass.group,
				typeDescription: nodeClass.typeDescription,
				dependencies: nodeClass.dependencies,
				properties: nodeClass.properties,
				credentials: nodeClass.credentials
			}

			callback({ success: true, node: nodeInfo })
		} catch (error) {
			console.error('Error obteniendo información del nodo:', error)
			callback({ success: false, message: 'Error al obtener información del nodo' })
		}
	},

	// Get node statistics - requires read permission
	'nodes:stats': async ({ socket, data, callback }: SocketData) => {
		try {
			const nodeClasses = getNodeInfo()
			const totalNodes = Object.keys(nodeClasses).length

			const groupStats = new Map<string, number>()
			for (const node of Object.values(nodeClasses)) {
				const group = Array.isArray(node.group) ? node.group.join('/') : node.group || 'Uncategorized'
				groupStats.set(group, (groupStats.get(group) || 0) + 1)
			}

			const stats = {
				totalNodes,
				groupStats: Object.fromEntries(groupStats),
				mostUsedGroup: [...groupStats.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || 'None'
			}

			callback({ success: true, stats })
		} catch (error) {
			console.error('Error obteniendo estadísticas de nodos:', error)
			callback({ success: false, message: 'Error al obtener estadísticas de nodos' })
		}
	}
}
