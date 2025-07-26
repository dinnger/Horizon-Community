import type { IWorkflowExecutionContextInterface } from '@shared/interfaces'
import type { INodeCanvasAdd } from '@canvas/interfaz/node.interface.migrated'
import type { IStatsAnimations, IPanelConsole, IPanelTrace, WorkflowData } from '@/types/canvas'
import type { INoteCanvas } from '@canvas/interfaz/note.interface'
import socketService from '@/services/socket'
import { useSettingsStore } from '@/stores'
import { computed, ref, watch } from 'vue'
import { Canvas } from '@canvas/canvas'
import { useCanvasSubscribersComposable } from './useCanvasSubscribers.composable'
import { useDeploymentComposable } from './useDeployment.composable'
import { useCanvasActionsComposable, type IUseCanvasActionsType } from './useCanvasActions.composable'
import { useWorkflowComposable } from './useWorkflow.composable'

export type IUseCanvasType = ReturnType<typeof useCanvasComposable>

export function useCanvasComposable({ workflowId }: { workflowId: string }) {
	const version = ref<{ value: string; status: 'draft' | 'published' | 'archived' }>({ value: '0.0.1', status: 'draft' })
	const changes = ref(false)
	const isExecuting = ref(false)
	const isLoading = ref(false)
	const isError = ref(false)
	const history = ref<WorkflowData[]>([])
	const canvasZoom = ref(1)
	const nodeOrigin = ref<INodeCanvasAdd | null>(null)
	const currentMousePosition = ref<{ x: number; y: number }>({ x: 0, y: 0 })
	// Estado para las trazas de ejecución
	const panelTrace = ref<IPanelTrace[]>([])
	const panelConsole = ref<IPanelConsole[]>([])
	// Estados para el toast de despliegue automático
	const showAutoDeploymentToast = ref(false)
	// Estados para el selector de despliegue
	const selectedDeploymentId = ref<string | null>(null)
	const currentWorkflowInfo = ref<{ id: string; name: string; description?: string } | null>(null)
	const showDeploymentSelector = ref(false)
	const autoDeploymentInfo = ref<{ workflowName: string; deploymentName: string } | null>(null)
	const actions = ref<IUseCanvasActionsType | undefined>()
	const context = ref<Omit<IWorkflowExecutionContextInterface, 'currentNode' | 'getEnvironment' | 'getSecrets'>>()

	const canvasInstance = ref<Canvas | undefined>()

	const settingsStore = useSettingsStore()
	const canvasSubscribersComposable = useCanvasSubscribersComposable()
	const deployComposable = useDeploymentComposable()
	const workflowComposable = useWorkflowComposable({ workflowId })

	// Función para inicializar el canvas cuando el elemento esté listo
	const initializeCanvas = async ({
		workflowId,
		version,
		canvas,
		isLocked = false
	}: { workflowId: string; version?: string; canvas: HTMLCanvasElement; isLocked?: boolean }) => {
		try {
			const flow = await load({ workflowId, version })
			isLoading.value = false

			canvasInstance.value = new Canvas({
				canvas: canvas,
				isLocked,
				theme: settingsStore.currentTheme
			})

			// Inicializar el canvas con los datos cargados
			if (!canvasInstance.value) return

			actions.value = useCanvasActionsComposable({ canvasInstance: canvasInstance.value, currentMousePosition, nodeOrigin })

			if (flow) {
				canvasInstance.value.loadWorkflowData(flow.workflowData)
			} else {
				socketService
					.nodes()
					.getNodeByType('workflow_init')
					.then((node) => {
						if (canvasInstance.value) canvasInstance.value.actionAddNode({ node: { ...node, design: { x: 60, y: 60 } } })
					})
			}

			// Configurar todos los subscribers usando el store dedicado
			watch(
				() => settingsStore.currentTheme,
				() => {
					if (!canvasInstance.value) return
					canvasInstance.value.changeTheme(settingsStore.currentTheme)
				}
			)

			// Configurar todos los subscribers usando el store dedicado
			canvasSubscribersComposable.setupCanvasSubscribers(canvasInstance.value, {
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
		} catch (error) {
			console.error(error)
			isLoading.value = false
			isError.value = true
			return
		}
	}

	/**
	 * Métodos para cargar un workflow desde el servidor
	 */
	const load = async (data: { workflowId: string; version?: string }) => {
		try {
			const dataFlow = await socketService.workflow().getWorkflowsById({
				workflowId: data.workflowId,
				version: data.version
			})

			// Set context
			setContext(dataFlow)

			console.log('canvasStore ', { dataFlow })
			if (dataFlow?.workflowData) {
				version.value.value = dataFlow.version
				version.value.status = 'draft'
				const flowData = dataFlow.workflowData
				if (flowData) {
					return Promise.resolve({
						workflowData: flowData,
						version: flowData.version
					})
				}
			}
			return Promise.resolve(null)
		} catch (error) {
			console.error('Error inicializando canvas:', error)
			return Promise.reject(error)
		}
	}

	const setContext = (data: any) => {
		context.value = {
			project: {
				type: data.project.transportType
			},
			info: {
				name: data.name,
				uid: data.id,
				version: data.version
			},
			properties: data.properties
		}
	}

	const saveCanvas = async ({ workflowId }: { workflowId: string }) => {
		if (!canvasInstance.value) return
		try {
			const saveWorkflow = await workflowComposable.saveWorkflow({ updates: canvasInstance.value.getWorkflowData() })
			if (saveWorkflow && context.value) {
				version.value.value = saveWorkflow.version
				context.value.info.version = saveWorkflow.version
			}
			changes.value = false
			return true
		} catch (error: any) {
			throw new Error(error)
		}
	}

	// const getHistory = (): WorkflowData[] => {
	// 	return Array.from(history.value.values()).reverse()
	// }

	const selectHistory = (selectVersion: string) => {
		if (!canvasInstance.value) return
		const workflow = history.value.find((f) => f.version === selectVersion)
		if (workflow) {
			canvasInstance.value.loadWorkflowData(workflow)
			version.value.value = workflow.version
			version.value.status = selectVersion === history.value[history.value.length - 1].version ? 'draft' : 'archived'
		}
	}

	const updateNotesFromCanvas = () => {
		if (!canvasInstance.value) return
		return canvasInstance.value.getNotes() as INoteCanvas[]
	}

	// Función para manejar la publicación del canvas
	const publish = async ({ workflowId }: { workflowId: string }) => {
		try {
			// Primero guardamos el workflow
			await saveCanvas({ workflowId })

			if (!workflowId) return

			// Validar y preparar la publicación usando el store de deployment
			const validationResult = await deployComposable.validateAndPrepareWorkflowPublication(workflowId)

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

	const getNode = ({ id }: { id: string }) => {
		if (!canvasInstance.value) return
		return canvasInstance.value?.nodes.getNode({ id })
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
			const result = await deployComposable.publishWorkflowToDeployment(deploymentData)
			closeDeploymentSelector()
		} catch (error: any) {
			throw new Error(error)
		}
	}

	// Función para cambiar el estado de bloqueo del canvas
	const setCanvasLocked = (locked: boolean) => {
		if (canvasInstance.value) {
			canvasInstance.value.setLocked(locked)
		}
	}

	// Función para obtener el estado de bloqueo del canvas
	const isCanvasLocked = () => {
		return canvasInstance.value ? canvasInstance.value.isCanvasLocked() : false
	}

	// Función para limpiar las trazas de ejecución del panel
	const clearPanelTrace = () => {
		panelTrace.value = []
	}

	// Función para agregar una nueva traza de ejecución
	const addPanelTrace = (trace: Omit<IPanelTrace, 'id' | 'timestamp'>) => {
		const newTrace: IPanelTrace = {
			id: `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
			timestamp: new Date(),
			...trace
		}
		panelTrace.value.push(newTrace)
	}

	// Función para agregar una nueva traza de ejecución
	const addPanelConsole = (trace: IPanelConsole) => {
		const newTrace: IPanelConsole = {
			id: `console_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
			date: new Date(),
			level: trace.level,
			message: trace.message
		}
		panelConsole.value.push(newTrace)
	}
	// Función para limpiar las trazas de ejecución del panel
	const clearPanelConsole = () => {
		panelConsole.value = []
	}

	const initSubscriptionsExecution = () => {
		console.log('initSubscriptionsExecution', name, workflowId)
		socketService.onWorkflowAnimations(workflowId || '', (event: IStatsAnimations[]) => {
			for (const animation of event) {
				// Agregar a la traza de ejecución para la pantalla de estado
				addPanelTrace({
					nodeId: animation.nodeId,
					connectionName: animation.connectName,
					executeTime: animation.executeTime,
					length: animation.length
				})

				// Aplicar animación al nodo
				const node = canvasInstance.value?.nodes.getNode({ id: animation.nodeId })
				if (!node) continue
				node.addAnimation({
					connectionName: animation.connectName,
					length: animation.length || 0,
					type: 'input'
				})
			}
		})
		socketService.onWorkflowConsole(workflowId || '', (events: IPanelConsole[]) => {
			for (const event of events) {
				addPanelConsole(event)
			}
		})
	}

	const closeSubscriptionsExecution = () => {
		socketService.removeListeners(`/workflow:.*:${workflowId}/`)
	}

	const destroy = () => {
		if (canvasInstance.value) {
			canvasInstance.value.destroy()
		}
	}

	return {
		version,
		context,
		changes,
		currentMousePosition,
		canvasZoom,
		panelConsole,
		panelTrace,

		save: saveCanvas,
		publish,
		getNode,
		initializeCanvas,
		clearPanelTrace,
		initSubscriptionsExecution,
		closeSubscriptionsExecution,
		destroy,

		actions: computed(() => actions.value)
	}
}
