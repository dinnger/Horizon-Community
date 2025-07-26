import type { INodeCanvas } from '@canvas/interfaz/node.interface'
import type { INote, INoteCanvas } from '@canvas/interfaz/note.interface'
import type { INodeGroup, INodeGroupCanvas } from '@canvas/interfaz/group.interface'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { IPanelConsole, IPanelTrace, WorkflowData } from '@/types/canvas'

export const useCanvas = defineStore('canvas', () => {
	// Estados para el diálogo de propiedades del nodo
	// Estados para el menú contextual
	// Estados para el menú contextual de conexión
	// Estados para el menú contextual del canvas

	// Referencias reactivas del canvas
	const activeTab = ref<'design' | 'execution'>('design')
	const projectName = ref('Web Application')

	const isExecuting = ref(false)
	const isLoading = ref(true)
	const isError = ref(false)


	const version = ref<{
		value: string
		status: 'draft' | 'published' | 'archived'
	}>({
		value: '0.0.1',
		status: 'draft'
	})
	const changes = ref(false)


	// =============================================================================
	// MÉTODOS DE GRUPOS
	// =============================================================================

	return {
		changes,
		version,
		activeTab,
		// Referencias reactivas
		projectName,
		isExecuting,
		isLoading,
		isError,
	}
})
