export interface INodeGroup {
	id: string
	label: string
	color: string
	nodeIds: string[]
	position: { x: number; y: number }
	size: { width: number; height: number }
	createdAt: string
	updatedAt: string
	isSelected?: boolean
	isDragging?: boolean
}

export interface INodeGroupCanvas extends INodeGroup {
	isSelected: boolean
	isDragging: boolean
}

export const GROUP_COLORS = {
	blue: '#3B82F6',
	green: '#10B981',
	yellow: '#F59E0B',
	red: '#EF4444',
	purple: '#8B5CF6',
	pink: '#EC4899',
	indigo: '#6366F1',
	gray: '#6B7280',
	orange: '#F97316',
	teal: '#14B8A6'
} as const

export const GROUP_DEFAULT_COLOR = GROUP_COLORS.blue
