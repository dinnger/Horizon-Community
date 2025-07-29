import type { AuthenticatedSocket } from '../routes/socket/index.js'

// Función helper para aplicar middleware de permisos
export function verifyPermission(socket: Required<AuthenticatedSocket>, event: string, additionalPermissions: (string | RegExp)[] = []) {
	// Check if the value is directly in the array
	if (additionalPermissions.includes(event)) {
		return true
	}

	// Check if the value matches any of the regex patterns in the array
	for (const item of additionalPermissions) {
		if (item instanceof RegExp && item.test(event)) {
			return true
		}
	}

	if (additionalPermissions.includes(event)) {
		return true
	}

	if (!socket.user?.roleId) {
		console.error(`No se encontró el usuario ${socket.userId}`)
		return false
	}

	const permissions = (socket.user.permissions || []).map((permission) => `${permission.module}:${permission.action}`)
	if (permissions.includes(event)) {
		return true
	}

	console.error(`No cumple permisos para ejecutar el método ${event}`)
	return false
}
