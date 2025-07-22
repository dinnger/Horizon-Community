import type { INodeCanvas, INodeConnections, INodeCanvasAdd } from '@canvas/interfaz/node.interface'
import type { INote, INoteCanvas } from '@canvas/interfaz/note.interface'
import type { INodeGroup, INodeGroupCanvas } from '@canvas/interfaz/group.interface'
import { Canvas } from '@canvas/canvas'
import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { useWorkflowsStore } from '@/stores/workflows'
import { useDeploymentStore } from './deployment'
import { useSettingsStore } from './settings'
import socketService from '@/services/socket'
import { useNodesLibraryStore } from './nodesLibrary'
import { useCanvasSubscribers } from './canvasSubscribers'
import type { Point } from '@canvas/canvasConnector'

type WorkflowData = {
	nodes: { [key: string]: INodeCanvas }
	connections: INodeConnections[]
	notes?: INote[]
	groups?: INodeGroup[]
	version: string
	timestamp: number
}

export const useCanvas = defineStore('canvas', () => {
	const workflowsStore = useWorkflowsStore()
	const deploymentStore = useDeploymentStore()
	const settingsStore = useSettingsStore()
	const workflowStore = useWorkflowsStore()
	const nodesStore = useNodesLibraryStore()
	const canvasSubscribers = useCanvasSubscribers()

	let canvasInstance: Canvas

	const showNodePropertiesDialog = ref(false)
	// Estados para el diálogo de propiedades del nodo
	const selectedNodeForEdit = ref<INodeCanvas | null>(null)
	const showContextMenu = ref(false)
	// Estados para el menú contextual
	const selectedNodesForContext = ref<INodeCanvas[]>([])
	// Estados para el menú contextual de conexión
	const showConnectionContextMenu = ref(false)
	const selectedConnectionForContext = ref<{
		id: string
		nodeOrigin: INodeCanvas
		nodeDestiny: INodeCanvas
		input: string
		output: string
	} | null>(null)
	// Estados para el menú contextual del canvas
	const showCanvasContextMenu = ref(false)
	const canvasContextPosition = ref({ x: 0, y: 0 })
	const showNoteContextMenu = ref(false)
	const selectedNoteForContext = ref<INoteCanvas | null>(null)
	const noteContextPosition = ref({ x: 0, y: 0 })
	const showNotePropertiesDialog = ref(false)
	const selectedNoteForEdit = ref<INoteCanvas | null>(null)

	// Referencias reactivas del canvas
	const canvasZoom = ref(1)
	const nodeOrigin = ref<INodeCanvasAdd | null>(null)
	const projectName = ref('Web Application')
	const nextNodePosition = ref({ x: 100, y: 100 })
	const currentMousePosition = ref({ x: 0, y: 0 })
	const isExecuting = ref(false)
	const isLoading = ref(true)
	const isError = ref(false)
	// Estados para el selector de versiones
	const showVersionSelector = ref(false)
	const availableVersions = ref<any[]>([])
	const selectedVersion = ref<string | null>(null)
	// Estados para el selector de despliegue
	const showDeploymentSelector = ref(false)
	const selectedDeploymentId = ref<string | null>(null)
	const currentWorkflowInfo = ref<{ id: string; name: string; description?: string } | null>(null)
	// Estados para el toast de despliegue automático
	const showAutoDeploymentToast = ref(false)
	const autoDeploymentInfo = ref<{ workflowName: string; deploymentName: string } | null>(null)
	const canvasContextCanvasPosition = ref({ x: 0, y: 0 })
	// Estados para el modal de propiedades de nota
	const noteDialogPosition = ref({ x: 0, y: 0 })
	// Estados para el administrador de notas
	const showNotesManager = ref(false)
	const allNotes = ref<INoteCanvas[]>([])
	// Estados para el menú contextual de grupos
	const showGroupContextMenu = ref(false)
	const selectedGroupForContext = ref<INodeGroupCanvas | null>(null)
	// Estados para el modal de propiedades de grupo
	const showGroupPropertiesDialog = ref(false)
	const selectedGroupForEdit = ref<INodeGroupCanvas | null>(null)
	const selectedNodeIdsForGroup = ref<string[]>([])
	const isEditingGroup = ref(false)

	const history = ref<WorkflowData[]>([])
	const workflowId = ref<string>('')
	const flow = ref<{ workflowData: WorkflowData; version: string }>()
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
	const getCanvasInstance = computed(() => {
		return canvasInstance
	})

	const load = async (data: { flow: string }) => {
		try {
			workflowId.value = data.flow
			const dataFlow: { workflowData: WorkflowData; version: string } = await workflowsStore.getWorkflowById(workflowId.value, true)
			console.log('canvas store ', { dataFlow })
			if (dataFlow?.workflowData) {
				version.value.value = dataFlow.version
				version.value.status = 'draft'
				const flowData = dataFlow.workflowData
				if (flowData) {
					flow.value = {
						workflowData: flowData,
						version: flowData.version
					}
					return Promise.resolve(flow.value)
				}
			}
			return Promise.resolve()
		} catch (error) {
			console.error('Error inicializando canvas:', error)
			return Promise.reject(error)
		}
	}

	const initCanvas = async (data: { canvasInstance: Canvas }) => {
		try {
			canvasInstance = data.canvasInstance
			if (flow.value) {
				canvasInstance.loadWorkflowData(flow.value.workflowData)
			} else {
				socketService.getNodeByType('workflow_init').then((node) => {
					canvasInstance.actionAddNode({ node: { ...node, design: { x: 60, y: 60 } } })
				})
			}
			// Los subscribers ahora se manejan en el store dedicado
		} catch (error) {
			console.error('Error inicializando canvas:', error)
		}
	}

	const save = async () => {
		if (!canvasInstance) return
		try {
			await workflowsStore.updateWorkflow(workflowId.value, canvasInstance.getWorkflowData())
			changes.value = false
		} catch (error) {}
	}

	const execute = async (selectedVersion?: string) => {
		if (!canvasInstance) return

		try {
			// First save the current workflow (only if no specific version is selected)
			if (!selectedVersion) {
				await save()
			}

			// Execute the workflow which will also save to file
			const result = await socketService.executeWorkflow(workflowId.value, 'manual', selectedVersion)

			if (result.success) {
				console.log('Workflow ejecutado exitosamente:', result.executionId)
				return {
					success: true,
					executionId: result.executionId,
					version: result.version,
					message: result.message
				}
			}

			console.error('Error ejecutando workflow:', result.message)
			return { success: false, message: result.message }
		} catch (error) {
			console.error('Error en ejecución:', error)
			return { success: false, message: 'Error al ejecutar workflow' }
		}
	}

	const getVersions = async () => {
		try {
			const result = await workflowsStore.getWorkflowVersion(workflowId.value)
			return result
		} catch (error) {
			console.error('Error obteniendo versiones:', error)
			return { success: false, message: 'Error al obtener versiones' }
		}
	}

	const getHistory = (): WorkflowData[] => {
		return Array.from(history.value.values()).reverse()
	}

	const selectHistory = (selectVersion: string) => {
		if (!canvasInstance) return
		const workflow = history.value.find((f) => f.version === selectVersion)
		if (workflow) {
			canvasInstance.loadWorkflowData(workflow)
			version.value.value = workflow.version
			version.value.status = selectVersion === history.value[history.value.length - 1].version ? 'draft' : 'archived'
		}
	}

	const clearHistory = () => {
		history.value = []
		localStorage.removeItem(`workflow_${workflowId.value}`)
	}

	// =============================================================================
	// MÉTODOS DE GRUPOS
	// =============================================================================

	const updateNotesFromCanvas = () => {
		if (!canvasInstance) return
		allNotes.value = canvasInstance.getNotes() as INoteCanvas[]
	}

	// Función para manejar la ejecución del workflow
	const handleExecuteWorkflow = async (version?: string) => {
		if (isExecuting.value) return

		isExecuting.value = true

		try {
			const startTime = Date.now()
			const result = await execute(version)
			console.log('result', result)
		} catch (error) {
			alert('Error inesperado ejecutando workflow')
		} finally {
			isExecuting.value = false
		}
	}

	// Función para mostrar el selector de versiones
	const handleExecuteWithVersionSelection = async () => {
		try {
			const versionsResult = await getVersions()

			if (versionsResult?.success) {
				availableVersions.value = versionsResult.versions
				showVersionSelector.value = true
			} else {
				alert(`Error obteniendo versiones: ${versionsResult?.message || 'Error desconocido'}`)
			}
		} catch (error) {
			console.error('Error obteniendo versiones:', error)
			alert('Error obteniendo versiones del workflow')
		}
	}

	// Función para cerrar el selector de versiones
	const closeVersionSelector = () => {
		showVersionSelector.value = false
		selectedVersion.value = null
	}

	// Función para ejecutar la versión seleccionada
	const executeSelectedVersion = async () => {
		if (!selectedVersion.value) {
			alert('Por favor selecciona una versión')
			return
		}

		closeVersionSelector()
		await handleExecuteWorkflow(selectedVersion.value)
	}

	// Función para manejar el guardado del canvas

	// Función para manejar la publicación del canvas
	const publish = async (workflowId: string) => {
		try {
			// Primero guardamos el workflow
			await save()

			if (!workflowId) return

			// Validar y preparar la publicación usando el store de deployment
			const validationResult = await deploymentStore.validateAndPrepareWorkflowPublication(workflowId)

			if (validationResult.type === 'automatic' && validationResult.autoDeployment) {
				// Despliegue automático
				const { workflowInfo, autoDeployment } = validationResult

				// Mostrar toast de despliegue automático
				autoDeploymentInfo.value = {
					workflowName: workflowInfo.name,
					deploymentName: autoDeployment.deploymentName
				}
				showAutoDeploymentToast.value = true

				// Usar el despliegue asignado al proyecto automáticamente
				const deploymentData = {
					workflowId,
					deploymentId: autoDeployment.deploymentId,
					priority: 3, // Prioridad normal por defecto
					description: `Despliegue automático de ${workflowInfo.name} desde proyecto ${autoDeployment.projectName}`,
					scheduledAt: undefined // Inmediato
				}

				// Ocultar el toast después de un momento
				setTimeout(() => {
					showAutoDeploymentToast.value = false
					autoDeploymentInfo.value = null
				}, 4000)

				await handleDeploymentPublish(deploymentData)
			} else {
				// Despliegue manual
				currentWorkflowInfo.value = validationResult.workflowInfo
				showDeploymentSelector.value = true
			}
		} catch (error: any) {
			throw new Error(error)
		}
	}

	// Función para cerrar el selector de despliegue
	const closeDeploymentSelector = () => {
		showDeploymentSelector.value = false
		selectedDeploymentId.value = null
		currentWorkflowInfo.value = null
	}

	// Función para manejar la publicación en el despliegue seleccionado
	const handleDeploymentPublish = async (deploymentData: {
		workflowId: string
		deploymentId: string
		priority: number
		description: string
		scheduledAt?: Date
	}) => {
		try {
			const result = await deploymentStore.publishWorkflowToDeployment(deploymentData)
			closeDeploymentSelector()
		} catch (error: any) {
			throw new Error(error)
		}
	}

	// Función para inicializar el canvas cuando el elemento esté listo
	const initializeCanvas = ({ canvas, isLocked = false }: { canvas: HTMLCanvasElement; isLocked?: boolean }) => {
		canvasInstance = new Canvas({
			canvas: canvas,
			isLocked,
			theme: settingsStore.currentTheme
		})

		initCanvas({ canvasInstance })

		// Configurar todos los subscribers usando el store dedicado
		canvasSubscribers.setupCanvasSubscribers(canvasInstance, {
			onNodeAdded: (e: INodeCanvasAdd) => {
				nodeOrigin.value = e
			},
			onMouseMove: (e: { x: number; y: number }) => {
				currentMousePosition.value = { x: e.x, y: e.y }
			},
			onZoomChange: (e: { zoom: number }) => {
				canvasZoom.value = e.zoom
			},
			onChanges: () => {
				changes.value = true
			}
		})

		// Inicializar las notas
		updateNotesFromCanvas()
	}

	// Función para cargar el workflow
	const loadWorkflow = async (workflowId: string) => {
		try {
			await load({ flow: workflowId })

			isLoading.value = false

			watch(
				() => settingsStore.currentTheme,
				() => {
					if (!canvasInstance) return
					canvasInstance.changeTheme(settingsStore.currentTheme)
				}
			)
		} catch (error) {
			console.error(error)
			isLoading.value = false
			isError.value = true
		}
	}

	// Función para cambiar el estado de bloqueo del canvas
	const setCanvasLocked = (locked: boolean) => {
		if (canvasInstance) {
			canvasInstance.setLocked(locked)
		}
	}

	// Función para obtener el estado de bloqueo del canvas
	const isCanvasLocked = () => {
		return canvasInstance ? canvasInstance.isCanvasLocked() : false
	}

	return {
		getCanvasInstance,
		changes,
		version,
		nodeOrigin,

		showNodePropertiesDialog,
		selectedNodeForEdit,
		showContextMenu,
		canvasContextPosition,
		selectedNodesForContext,
		showConnectionContextMenu,
		showCanvasContextMenu,
		showNoteContextMenu,
		selectedConnectionForContext,
		selectedNoteForContext,
		noteContextPosition,
		showNotePropertiesDialog,
		selectedNoteForEdit,
		currentMousePosition,
		nextNodePosition,
		canvasContextCanvasPosition,
		// Referencias reactivas
		canvasZoom,
		projectName,
		isExecuting,
		isLoading,
		isError,
		// Estados del selector de versiones
		showVersionSelector,
		availableVersions,
		selectedVersion,
		noteDialogPosition,
		showNotesManager,
		allNotes,
		showGroupContextMenu,
		selectedGroupForContext,
		showGroupPropertiesDialog,
		selectedGroupForEdit,
		selectedNodeIdsForGroup,
		isEditingGroup,
		// Estados del selector de despliegue
		showDeploymentSelector,
		selectedDeploymentId,
		currentWorkflowInfo,
		showAutoDeploymentToast,
		autoDeploymentInfo,

		loadWorkflow,
		save,
		publish,
		execute,
		getHistory,
		selectHistory,
		clearHistory,

		handleExecuteWorkflow,
		handleExecuteWithVersionSelection,
		closeVersionSelector,
		executeSelectedVersion,
		initializeCanvas,
		setCanvasLocked,
		isCanvasLocked
	}
})
