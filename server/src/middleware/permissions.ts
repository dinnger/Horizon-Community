import type { AuthenticatedSocket } from './socketAuth'
// Función helper para aplicar middleware de permisos
export function verifyPermission(socket: Required<AuthenticatedSocket>, event: string, additionalPermissions: (string | RegExp)[] = []) {
	if (additionalPermissions.includes(event)) {
		return true
	}

	if (!socket.user?.role) {
		console.error(`No se encontró el usuario ${socket.userId}`)
		return false
	}

	const permissions = (socket.user.role?.permissions || []).map((permission) => `${permission.module}:${permission.action}`)
	if (permissions.includes(event)) {
		return true
	}

	console.error(`No cumple permisos para ejecutar el método ${event}`)
	return false
}
