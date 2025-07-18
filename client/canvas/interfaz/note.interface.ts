export interface INote {
  id: string
  content: string
  color: string
  position: {
    x: number
    y: number
  }
  size: {
    width: number
    height: number
  }
  createdAt: Date
  updatedAt: Date
}

export interface INoteCanvas extends INote {
  isSelected?: boolean
  isDragging?: boolean
}

export interface INoteColors {
  yellow: string
  blue: string
  green: string
  pink: string
  orange: string
  purple: string
  red: string
  gray: string
}

export const NOTE_COLORS: INoteColors = {
  yellow: '#FEF08A',
  blue: '#BFDBFE', 
  green: '#BBF7D0',
  pink: '#FBCFE8',
  orange: '#FDBA74',
  purple: '#DDD6FE',
  red: '#FCA5A5',
  gray: '#E5E7EB'
}

export const NOTE_DEFAULT_SIZE = {
  width: 200,
  height: 120
}
