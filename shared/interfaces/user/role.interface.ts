import type { StatusType } from '../status.interface'

interface IRoleBase {
	id: string
	name: string
	description: string
	level: number // Nivel jerárquico del rol (0 = superadmin, 1 = admin, 2 = manager, etc.)
	status: StatusType
}

export interface IRoleServer extends IRoleBase {
	createdAt: Date
	updatedAt: Date
}

export interface IRole extends IRoleBase {}
