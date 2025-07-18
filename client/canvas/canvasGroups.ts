import type { INodeGroupCanvas, INodeGroup } from './interfaz/group.interface.js'
import { GROUP_COLORS, GROUP_DEFAULT_COLOR } from './interfaz/group.interface.js'
import { v4 as uuidv4 } from 'uuid'

const canvasGrid = 20
/**
 * Clase que maneja los grupos de nodos en el canvas
 */
export class CanvasGroups {
	private groups: Map<string, INodeGroupCanvas> = new Map()
	private selectedGroups: Set<string> = new Set()
	private draggedGroup: string | null = null
	private dragOffset = { x: 0, y: 0 }

	/**
	 * Agrega un nuevo grupo al canvas
	 */
	addGroup(options: {
		label: string
		color: string
		nodeIds: string[]
		position: { x: number; y: number }
		size: { width: number; height: number }
	}): string {
		const groupId = uuidv4()
		const now = new Date().toISOString()

		const group: INodeGroupCanvas = {
			id: groupId,
			label: options.label,
			color: options.color,
			nodeIds: [...options.nodeIds],
			position: options.position,
			size: options.size,
			createdAt: now,
			updatedAt: now,
			isSelected: false,
			isDragging: false
		}

		this.groups.set(groupId, group)
		return groupId
	}

	/**
	 * Actualiza un grupo existente
	 */
	updateGroup(id: string, updates: Partial<Omit<INodeGroup, 'id' | 'createdAt'>>): boolean {
		const group = this.groups.get(id)
		if (!group) return false

		Object.assign(group, updates, { updatedAt: new Date().toISOString() })
		return true
	}

	/**
	 * Elimina un grupo
	 */
	deleteGroup(id: string): boolean {
		this.selectedGroups.delete(id)
		return this.groups.delete(id)
	}

	/**
	 * Obtiene un grupo por ID
	 */
	getGroup(id: string): INodeGroupCanvas | undefined {
		return this.groups.get(id)
	}

	/**
	 * Obtiene todos los grupos
	 */
	getAllGroups(): INodeGroupCanvas[] {
		return Array.from(this.groups.values())
	}

	/**
	 * Obtiene los grupos seleccionados
	 */
	getSelectedGroups(): INodeGroupCanvas[] {
		return Array.from(this.selectedGroups)
			.map((id) => this.groups.get(id))
			.filter(Boolean) as INodeGroupCanvas[]
	}

	/**
	 * Selecciona/deselecciona un grupo
	 */
	selectGroup(id: string, selected = true): void {
		const group = this.groups.get(id)
		if (!group) return

		group.isSelected = selected
		if (selected) {
			this.selectedGroups.add(id)
		} else {
			this.selectedGroups.delete(id)
		}
	}

	/**
	 * Deselecciona todos los grupos
	 */
	clearSelection(): void {
		for (const id of this.selectedGroups) {
			const group = this.groups.get(id)
			if (group) group.isSelected = false
		}
		this.selectedGroups.clear()
	}

	/**
	 * Obtiene el grupo en una posición específica
	 */
	getGroupAtPosition(x: number, y: number): INodeGroupCanvas | null {
		for (const group of this.groups.values()) {
			if (
				x >= group.position.x &&
				x <= group.position.x + group.size.width &&
				y >= group.position.y &&
				y <= group.position.y + group.size.height
			) {
				return group
			}
		}
		return null
	}

	/**
	 * Obtiene el grupo que contiene un nodo específico
	 */
	getGroupByNodeId(nodeId: string): INodeGroupCanvas | null {
		for (const group of this.groups.values()) {
			if (group.nodeIds.includes(nodeId)) {
				return group
			}
		}
		return null
	}

	/**
	 * Agrega un nodo a un grupo
	 */
	addNodeToGroup(groupId: string, nodeId: string): boolean {
		const group = this.groups.get(groupId)
		if (!group || group.nodeIds.includes(nodeId)) return false

		group.nodeIds.push(nodeId)
		group.updatedAt = new Date().toISOString()
		return true
	}

	/**
	 * Remueve un nodo de un grupo
	 */
	removeNodeFromGroup(groupId: string, nodeId: string): boolean {
		const group = this.groups.get(groupId)
		if (!group) return false

		const index = group.nodeIds.indexOf(nodeId)
		if (index === -1) return false

		group.nodeIds.splice(index, 1)
		group.updatedAt = new Date().toISOString()
		return true
	}

	/**
	 * Remueve un nodo de todos los grupos
	 */
	removeNodeFromAllGroups(nodeId: string): void {
		for (const group of this.groups.values()) {
			this.removeNodeFromGroup(group.id, nodeId)
		}
	}

	/**
	 * Inicia el arrastre de un grupo
	 */
	startDrag(id: string, mouseX: number, mouseY: number): boolean {
		const group = this.groups.get(id)
		if (!group) return false

		this.draggedGroup = id
		group.isDragging = true
		this.dragOffset.x = mouseX - group.position.x
		this.dragOffset.y = mouseY - group.position.y
		return true
	}

	/**
	 * Actualiza la posición durante el arrastre
	 */
	updateDrag(mouseX: number, mouseY: number): { deltaX: number; deltaY: number } | null {
		if (!this.draggedGroup) return null

		const group = this.groups.get(this.draggedGroup)
		if (!group) return null

		let newX = mouseX - this.dragOffset.x
		let newY = mouseY - this.dragOffset.y

		// x and y only divisible by 20
		newX = Math.round(newX / canvasGrid) * canvasGrid
		newY = Math.round(newY / canvasGrid) * canvasGrid

		// Calcular el desplazamiento
		const deltaX = newX - group.position.x
		const deltaY = newY - group.position.y

		// Actualizar posición del grupo
		group.position.x = newX
		group.position.y = newY

		// Retornar el desplazamiento para mover los nodos
		return { deltaX, deltaY }
	}

	/**
	 * Finaliza el arrastre
	 */
	endDrag(): boolean {
		if (!this.draggedGroup) return false

		const group = this.groups.get(this.draggedGroup)
		if (group) {
			group.isDragging = false
		}

		this.draggedGroup = null
		this.dragOffset = { x: 0, y: 0 }
		return true
	}

	/**
	 * Verifica si se está arrastrando un grupo
	 */
	isDragging(): boolean {
		return this.draggedGroup !== null
	}

	/**
	 * Obtiene el grupo que se está arrastrando
	 */
	getDraggedGroup(): INodeGroupCanvas | null {
		if (!this.draggedGroup) return null
		return this.groups.get(this.draggedGroup) || null
	}

	/**
	 * Calcula el tamaño y posición de un grupo basado en sus nodos
	 */
	calculateGroupBounds(nodePositions: Array<{ x: number; y: number; width: number; height: number }>): {
		position: { x: number; y: number }
		size: { width: number; height: number }
	} {
		if (nodePositions.length === 0) {
			return {
				position: { x: 0, y: 0 },
				size: { width: 200, height: 150 }
			}
		}

		const padding = 20
		let minX = Number.MAX_VALUE
		let minY = Number.MAX_VALUE
		let maxX = Number.MIN_VALUE
		let maxY = Number.MIN_VALUE

		for (const node of nodePositions) {
			minX = Math.min(minX, node.x)
			minY = Math.min(minY, node.y)
			maxX = Math.max(maxX, node.x + node.width)
			maxY = Math.max(maxY, node.y + node.height)
		}

		return {
			position: {
				x: minX - padding,
				y: minY - padding
			},
			size: {
				width: maxX - minX + padding * 2,
				height: maxY - minY + padding * 2
			}
		}
	}

	/**
	 * Recalcula el tamaño y posición de un grupo basándose en las posiciones actuales de sus nodos
	 */
	recalculateGroupBounds(
		groupId: string,
		getNodePosition: (nodeId: string) => { x: number; y: number; width: number; height: number } | null
	): boolean {
		const group = this.groups.get(groupId)
		if (!group || group.nodeIds.length === 0) return false

		// Obtener posiciones actuales de los nodos del grupo
		const nodePositions: Array<{ x: number; y: number; width: number; height: number }> = []

		for (const nodeId of group.nodeIds) {
			const nodePos = getNodePosition(nodeId)
			if (nodePos) {
				nodePositions.push(nodePos)
			}
		}

		if (nodePositions.length === 0) return false

		// Calcular nuevos límites
		const newBounds = this.calculateGroupBounds(nodePositions)

		// Actualizar posición y tamaño del grupo
		group.position = newBounds.position
		group.size = newBounds.size
		group.updatedAt = new Date().toISOString()

		return true
	}

	/**
	 * Recalcula todos los grupos que contienen un nodo específico
	 */
	recalculateGroupsContainingNode(
		nodeId: string,
		getNodePosition: (nodeId: string) => { x: number; y: number; width: number; height: number } | null
	): void {
		for (const group of this.groups.values()) {
			if (group.nodeIds.includes(nodeId)) {
				this.recalculateGroupBounds(group.id, getNodePosition)
			}
		}
	}

	/**
	 * Renderiza todos los grupos en el canvas
	 */
	render(ctx: CanvasRenderingContext2D): void {
		ctx.save()

		// Renderizar grupos en orden (los seleccionados al final)
		const unselectedGroups = Array.from(this.groups.values()).filter((g) => !g.isSelected)
		const selectedGroups = Array.from(this.groups.values()).filter((g) => g.isSelected)

		for (const group of [...unselectedGroups, ...selectedGroups]) {
			this.renderGroup(ctx, group)
		}

		ctx.restore()
	}

	/**
	 * Renderiza un grupo individual
	 */
	private renderGroup(ctx: CanvasRenderingContext2D, group: INodeGroupCanvas): void {
		const x = group.position.x
		const y = group.position.y
		const width = group.size.width
		const height = group.size.height

		// Fondo del grupo con transparencia
		ctx.fillStyle = `${group.color}20` // 20 = ~12% opacity
		ctx.fillRect(x, y, width, height)

		// Borde del grupo
		ctx.strokeStyle = group.color
		ctx.lineWidth = group.isSelected ? 3 : 2
		if (group.isSelected) {
			ctx.setLineDash([5, 5])
		} else {
			ctx.setLineDash([])
		}
		ctx.strokeRect(x, y, width, height)

		// Etiqueta del grupo
		if (group.label) {
			const labelPadding = 8
			const labelHeight = 24

			// Fondo de la etiqueta
			ctx.fillStyle = group.color
			ctx.fillRect(x, y - labelHeight, width, labelHeight)

			// Texto de la etiqueta
			ctx.fillStyle = '#FFFFFF'
			ctx.font = 'bold 12px Arial'
			ctx.textAlign = 'center'
			ctx.textBaseline = 'middle'
			ctx.fillText(group.label, x + width / 2, y - labelHeight / 2)
		}

		// Resetear estilos
		ctx.setLineDash([])
		ctx.textAlign = 'left'
		ctx.textBaseline = 'top'
	}

	/**
	 * Exporta los grupos para guardar en el workflow
	 */
	exportGroups(): any[] {
		return Array.from(this.groups.values()).map((group) => ({
			id: group.id,
			label: group.label,
			color: group.color,
			nodeIds: [...group.nodeIds],
			position: { ...group.position },
			size: { ...group.size },
			createdAt: group.createdAt,
			updatedAt: group.updatedAt
		}))
	}

	/**
	 * Importa grupos desde el workflow
	 */
	importGroups(groups: any[]): void {
		this.groups.clear()
		this.selectedGroups.clear()

		for (const group of groups) {
			const canvasGroup: INodeGroupCanvas = {
				...group,
				createdAt: typeof group.createdAt === 'string' ? new Date(group.createdAt) : group.createdAt,
				updatedAt: typeof group.updatedAt === 'string' ? new Date(group.updatedAt) : group.updatedAt,
				isSelected: false,
				isDragging: false
			}
			this.groups.set(group.id, canvasGroup)
		}
	}

	/**
	 * Limpia todos los grupos
	 */
	clear(): void {
		this.groups.clear()
		this.selectedGroups.clear()
		this.draggedGroup = null
	}
}
