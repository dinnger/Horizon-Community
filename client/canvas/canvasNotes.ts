import type { INoteCanvas, INote } from './interfaz/note.interface.js'
import { NOTE_COLORS, NOTE_DEFAULT_SIZE } from './interfaz/note.interface.js'
import { v4 as uuidv4 } from 'uuid'

/**
 * Clase que maneja las notas en el canvas
 */
export class CanvasNotes {
	private notes: Map<string, INoteCanvas> = new Map()
	private selectedNotes: Set<string> = new Set()
	private draggedNote: string | null = null
	private dragOffset = { x: 0, y: 0 }
	private resizingNote: string | null = null
	private resizeDirection: string | null = null
	private resizeStartSize = { width: 0, height: 0 }
	private resizeStartMouse = { x: 0, y: 0 }

	/**
	 * Agrega una nueva nota al canvas
	 */
	addNote(options: {
		content: string
		color: string
		position: { x: number; y: number }
		size?: { width: number; height: number }
	}): string {
		const noteId = uuidv4()
		const now = new Date()

		const note: INoteCanvas = {
			id: noteId,
			content: options.content,
			color: options.color,
			position: options.position,
			size: options.size || NOTE_DEFAULT_SIZE,
			createdAt: now,
			updatedAt: now,
			isSelected: false,
			isDragging: false
		}

		this.notes.set(noteId, note)
		return noteId
	}

	/**
	 * Actualiza una nota existente
	 */
	updateNote(id: string, updates: Partial<Omit<INote, 'id' | 'createdAt'>>): boolean {
		const note = this.notes.get(id)
		if (!note) return false

		Object.assign(note, updates, { updatedAt: new Date() })
		return true
	}

	/**
	 * Elimina una nota
	 */
	deleteNote(id: string): boolean {
		return this.notes.delete(id)
	}

	/**
	 * Obtiene una nota por ID
	 */
	getNote(id: string): INoteCanvas | undefined {
		return this.notes.get(id)
	}

	/**
	 * Obtiene todas las notas
	 */
	getAllNotes(): INoteCanvas[] {
		return Array.from(this.notes.values())
	}

	/**
	 * Obtiene las notas seleccionadas
	 */
	getSelectedNotes(): INoteCanvas[] {
		return Array.from(this.selectedNotes)
			.map((id) => this.notes.get(id))
			.filter(Boolean) as INoteCanvas[]
	}

	/**
	 * Selecciona/deselecciona una nota
	 */
	selectNote(id: string, selected = true): void {
		const note = this.notes.get(id)
		if (!note) return

		note.isSelected = selected
		if (selected) {
			this.selectedNotes.add(id)
		} else {
			this.selectedNotes.delete(id)
		}
	}

	/**
	 * Deselecciona todas las notas
	 */
	clearSelection(): void {
		for (const id of this.selectedNotes) {
			const note = this.notes.get(id)
			if (note) note.isSelected = false
		}
		this.selectedNotes.clear()
	}

	/**
	 * Obtiene la nota en una posición específica
	 */
	getNoteAtPosition(x: number, y: number): INoteCanvas | null {
		for (const note of this.notes.values()) {
			if (
				x >= note.position.x &&
				x <= note.position.x + note.size.width &&
				y >= note.position.y &&
				y <= note.position.y + note.size.height
			) {
				return note
			}
		}
		return null
	}

	/**
	 * Verifica si una posición está sobre un handle de redimensionamiento
	 * Más específico que getNoteAtPosition para evitar conflictos
	 */
	isPositionOnResizeHandle(x: number, y: number): boolean {
		for (const note of this.notes.values()) {
			if (!note.isSelected) continue

			const resizeDirection = this.getResizeDirection(note, x, y)
			if (resizeDirection === 'se') {
				return true
			}
		}
		return false
	}

	/**
	 * Inicia el arrastre de una nota
	 */
	startDrag(id: string, mouseX: number, mouseY: number): boolean {
		const note = this.notes.get(id)
		if (!note) return false

		this.draggedNote = id
		note.isDragging = true
		this.dragOffset.x = mouseX - note.position.x
		this.dragOffset.y = mouseY - note.position.y
		return true
	}

	/**
	 * Actualiza la posición durante el arrastre
	 */
	updateDrag(mouseX: number, mouseY: number): boolean {
		if (!this.draggedNote) return false

		const note = this.notes.get(this.draggedNote)
		if (!note) return false

		note.position.x = mouseX - this.dragOffset.x
		note.position.y = mouseY - this.dragOffset.y
		return true
	}

	/**
	 * Finaliza el arrastre
	 */
	endDrag(): boolean {
		if (!this.draggedNote) return false

		const note = this.notes.get(this.draggedNote)
		if (note) {
			note.isDragging = false
		}

		this.draggedNote = null
		this.dragOffset = { x: 0, y: 0 }
		return true
	}

	/**
	 * Obtiene el tipo de cursor para redimensionamiento en una posición
	 * Solo para la esquina inferior derecha
	 */
	getResizeCursor(x: number, y: number): string | null {
		for (const note of this.notes.values()) {
			if (!note.isSelected) continue

			const resizeDirection = this.getResizeDirection(note, x, y)
			if (resizeDirection === 'se') {
				return 'nwse-resize'
			}
		}
		return null
	}

	/**
	 * Obtiene la dirección de redimensionamiento para una nota en una posición
	 * Solo permite redimensionar desde la esquina inferior derecha
	 */
	private getResizeDirection(note: INoteCanvas, x: number, y: number): string | null {
		const handleSize = 12 // Aumentar el área de detección
		const { position, size } = note
		const right = position.x + size.width
		const bottom = position.y + size.height

		// Solo esquina inferior derecha con área más grande para mejor detección
		if (this.isInHandle(x, y, right, bottom, handleSize)) return 'se'

		return null
	}

	/**
	 * Verifica si un punto está dentro de un área de handle
	 */
	private isInHandle(x: number, y: number, handleX: number, handleY: number, handleSize: number): boolean {
		const half = handleSize / 2
		return x >= handleX - half && x <= handleX + half && y >= handleY - half && y <= handleY + half
	}

	/**
	 * Inicia el redimensionamiento de una nota
	 */
	startResize(x: number, y: number): boolean {
		for (const note of this.notes.values()) {
			if (!note.isSelected) continue

			const direction = this.getResizeDirection(note, x, y)
			if (direction) {
				this.resizingNote = note.id
				this.resizeDirection = direction
				this.resizeStartSize = { ...note.size }
				this.resizeStartMouse = { x, y }
				return true
			}
		}
		return false
	}

	/**
	 * Actualiza el redimensionamiento desde la esquina inferior derecha
	 */
	updateResize(mouseX: number, mouseY: number): boolean {
		if (!this.resizingNote || this.resizeDirection !== 'se') return false

		const note = this.notes.get(this.resizingNote)
		if (!note) return false

		const deltaX = mouseX - this.resizeStartMouse.x
		const deltaY = mouseY - this.resizeStartMouse.y

		const minSize = 80
		const maxSize = 500

		// Calcular nuevas dimensiones solo expandiendo hacia abajo y derecha
		const newWidth = Math.max(minSize, Math.min(maxSize, this.resizeStartSize.width + deltaX))
		const newHeight = Math.max(minSize, Math.min(maxSize, this.resizeStartSize.height + deltaY))

		// Aplicar cambios (la posición no cambia al redimensionar desde esquina inferior derecha)
		note.size.width = newWidth
		note.size.height = newHeight

		return true
	}

	/**
	 * Termina el redimensionamiento
	 */
	endResize(): boolean {
		if (!this.resizingNote) return false

		this.resizingNote = null
		this.resizeDirection = null
		this.resizeStartSize = { width: 0, height: 0 }
		this.resizeStartMouse = { x: 0, y: 0 }
		return true
	}

	/**
	 * Verifica si se está redimensionando
	 */
	isResizing(): boolean {
		return this.resizingNote !== null
	}

	/**
	 * Renderiza todas las notas en el canvas
	 */
	render(ctx: CanvasRenderingContext2D, canvasTranslate: { x: number; y: number }, canvasFactor: number): void {
		ctx.save()

		for (const note of this.notes.values()) {
			this.renderNote(ctx, note, canvasTranslate, canvasFactor)
		}

		ctx.restore()
	}

	/**
	 * Renderiza una nota individual
	 */
	private renderNote(
		ctx: CanvasRenderingContext2D,
		note: INoteCanvas,
		canvasTranslate: { x: number; y: number },
		canvasFactor: number
	): void {
		// Las posiciones de las notas ya están en coordenadas del mundo (como los nodos)
		// No necesitan transformación adicional porque el ctx ya tiene las transformaciones aplicadas
		const x = note.position.x
		const y = note.position.y
		const width = note.size.width
		const height = note.size.height

		// Sombra
		ctx.shadowColor = 'rgba(0, 0, 0, 0.2)'
		ctx.shadowBlur = 5
		ctx.shadowOffsetX = 2
		ctx.shadowOffsetY = 2

		// Fondo de la nota
		ctx.fillStyle = note.color
		ctx.fillRect(x, y, width, height)

		// Borde si está seleccionada
		if (note.isSelected) {
			ctx.strokeStyle = '#3B82F6'
			ctx.lineWidth = 2
			ctx.strokeRect(x, y, width, height)
		}

		// Resetear sombra
		ctx.shadowColor = 'transparent'
		ctx.shadowBlur = 0
		ctx.shadowOffsetX = 0
		ctx.shadowOffsetY = 0

		// Texto con soporte para HTML y estilos
		const padding = 8
		this.renderStyledText(ctx, note.content, x + padding, y + padding, width - padding * 2, height - padding * 2)

		// Dibujar puntos de redimensionamiento si está seleccionada
		if (note.isSelected) {
			this.drawResizeHandles(ctx, x, y, width, height)
		}
	}

	/**
	 * Dibuja el punto de redimensionamiento en la esquina inferior derecha
	 */
	private drawResizeHandles(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number): void {
		const handleSize = 8
		const halfHandle = handleSize / 2

		// Solo esquina inferior derecha (se)
		const handle = { x: x + width, y: y + height }

		ctx.fillStyle = '#3B82F6'
		ctx.strokeStyle = '#FFFFFF'
		ctx.lineWidth = 1

		ctx.fillRect(handle.x - halfHandle, handle.y - halfHandle, handleSize, handleSize)
		ctx.strokeRect(handle.x - halfHandle, handle.y - halfHandle, handleSize, handleSize)
	}

	/**
	 * Divide el texto en líneas que caben en el ancho especificado
	 */
	private wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
		const words = text.split(' ')
		const lines: string[] = []
		let currentLine = ''

		for (const word of words) {
			const testLine = currentLine + (currentLine ? ' ' : '') + word
			const metrics = ctx.measureText(testLine)

			if (metrics.width > maxWidth && currentLine) {
				lines.push(currentLine)
				currentLine = word
			} else {
				currentLine = testLine
			}
		}

		if (currentLine) {
			lines.push(currentLine)
		}

		return lines
	}

	/**
	 * Exporta las notas para guardar en el workflow
	 */
	exportNotes(): any[] {
		return Array.from(this.notes.values()).map((note) => ({
			id: note.id,
			content: note.content,
			color: note.color,
			position: { ...note.position },
			size: { ...note.size },
			createdAt: note.createdAt instanceof Date ? note.createdAt.toISOString() : note.createdAt,
			updatedAt: note.updatedAt instanceof Date ? note.updatedAt.toISOString() : note.updatedAt
		}))
	}

	/**
	 * Importa notas desde el workflow
	 */
	importNotes(notes: any[]): void {
		this.notes.clear()
		this.selectedNotes.clear()

		for (const note of notes) {
			const canvasNote: INoteCanvas = {
				...note,
				createdAt: typeof note.createdAt === 'string' ? new Date(note.createdAt) : note.createdAt,
				updatedAt: typeof note.updatedAt === 'string' ? new Date(note.updatedAt) : note.updatedAt,
				isSelected: false,
				isDragging: false
			}
			this.notes.set(note.id, canvasNote)
		}
	}

	/**
	 * Limpia todas las notas
	 */
	clear(): void {
		this.notes.clear()
		this.selectedNotes.clear()
		this.draggedNote = null
	}

	/**
	 * Renderiza texto HTML con estilos en el canvas
	 */
	private renderStyledText(
		ctx: CanvasRenderingContext2D,
		htmlContent: string,
		x: number,
		y: number,
		maxWidth: number,
		maxHeight: number
	): void {
		// Crear región de clipping para el texto
		ctx.save()
		ctx.beginPath()
		ctx.rect(x, y, maxWidth, maxHeight)
		ctx.clip()

		// Parsear HTML y renderizar con estilos
		const elements = this.parseHTML(htmlContent)
		let currentY = y
		const lineHeight = 16

		ctx.textAlign = 'left'
		ctx.textBaseline = 'top'

		for (const element of elements) {
			if (currentY + lineHeight > y + maxHeight) break

			// Aplicar estilos según el tipo de elemento
			this.applyElementStyle(ctx, element.tag)

			// Dividir texto en líneas
			const lines = this.wrapText(ctx, element.text, maxWidth)

			for (const line of lines) {
				if (currentY + lineHeight > y + maxHeight) break

				ctx.fillText(line, x, currentY)
				currentY += lineHeight
			}

			// Espacio adicional después de elementos de bloque
			if (['h1', 'h2', 'h3', 'p', 'div'].includes(element.tag)) {
				currentY += 4
			}
		}

		ctx.restore()
	}

	/**
	 * Parsea HTML simple y extrae elementos con sus estilos
	 */
	private parseHTML(html: string): Array<{ tag: string; text: string; styles?: any }> {
		const elements: Array<{ tag: string; text: string; styles?: any }> = []

		// Limpiar HTML de Quill y extraer texto con tags
		const cleanHtml = html
			.replace(/<br\s*\/?>/gi, '\n')
			.replace(/<\/p><p>/gi, '\n\n')
			.replace(/<p[^>]*>/gi, '')
			.replace(/<\/p>/gi, '\n')

		// Detectar headers
		const headerRegex = /<h([1-6])[^>]*>(.*?)<\/h[1-6]>/gi
		let match: RegExpExecArray | null
		let lastIndex = 0

		// biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
		while ((match = headerRegex.exec(cleanHtml))) {
			// Agregar texto antes del header
			if (match.index > lastIndex) {
				const beforeText = cleanHtml
					.slice(lastIndex, match.index)
					.replace(/<[^>]*>/g, '')
					.trim()
				if (beforeText) {
					elements.push({ tag: 'p', text: beforeText })
				}
			}

			// Agregar header
			const headerLevel = match[1]
			const headerText = match[2].replace(/<[^>]*>/g, '').trim()
			if (headerText) {
				elements.push({ tag: `h${headerLevel}`, text: headerText })
			}

			lastIndex = headerRegex.lastIndex
		}

		// Agregar texto restante
		if (lastIndex < cleanHtml.length) {
			const remainingText = cleanHtml
				.slice(lastIndex)
				.replace(/<[^>]*>/g, '')
				.trim()
			if (remainingText) {
				elements.push({ tag: 'p', text: remainingText })
			}
		}

		// Si no hay elementos, agregar todo como párrafo
		if (elements.length === 0) {
			const plainText = html.replace(/<[^>]*>/g, '').trim()
			if (plainText) {
				elements.push({ tag: 'p', text: plainText })
			}
		}

		return elements
	}

	/**
	 * Aplica estilos CSS al contexto del canvas según el tipo de elemento
	 */
	private applyElementStyle(ctx: CanvasRenderingContext2D, tag: string): void {
		ctx.fillStyle = '#374151' // Color base del texto

		switch (tag) {
			case 'h1':
				ctx.font = 'bold 18px Arial'
				ctx.fillStyle = '#1f2937'
				break
			case 'h2':
				ctx.font = 'bold 16px Arial'
				ctx.fillStyle = '#374151'
				break
			case 'h3':
				ctx.font = 'bold 14px Arial'
				ctx.fillStyle = '#4b5563'
				break
			case 'strong':
			case 'b':
				ctx.font = 'bold 12px Arial'
				break
			case 'em':
			case 'i':
				ctx.font = 'italic 12px Arial'
				break
			default:
				ctx.font = '12px Arial'
				break
		}
	}
}
