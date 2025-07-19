import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import type { INodeCanvas, INodeCanvasAdd } from '@canvas/interfaz/node.interface'
import type { INodeGroupCanvas } from '@canvas/interfaz/group.interface'
import type { INoteCanvas } from '@canvas/interfaz/note.interface'
import type { Point } from '@canvas/canvasConnector'
import { Canvas } from '@canvas/canvas.ts'
import {
	useSettingsStore,
	useNodesLibraryStore,
	useCanvas,
	useDebugConsoleStore,
	useWorkflowsStore,
	useProjectsStore,
	useDeploymentStore
} from '@/stores'
import socketService from '@/services/socket'
import { toast } from 'vue-sonner'

export function useCanvasController() {
	const workflowStore = useWorkflowsStore()
	const proyectStore = useProjectsStore()
	const deploymentStore = useDeploymentStore()
	const settingsStore = useSettingsStore()
	const nodesStore = useNodesLibraryStore()
	const canvasStore = useCanvas()
	const debugStore = useDebugConsoleStore()
	const router = useRouter()

	// Referencias reactivas del canvas
	const canvasPos = ref('0x, 0y')
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

	// Estados para el diálogo de propiedades del nodo
	const showNodePropertiesDialog = ref(false)
	const selectedNodeForEdit = ref<INodeCanvas | null>(null)

	// Estados para el menú contextual
	const showContextMenu = ref(false)
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
	const canvasContextCanvasPosition = ref({ x: 0, y: 0 })

	// Estados para el menú contextual de notas
	const showNoteContextMenu = ref(false)
	const selectedNoteForContext = ref<INoteCanvas | null>(null)
	const noteContextPosition = ref({ x: 0, y: 0 })

	// Estados para el modal de propiedades de nota
	const showNotePropertiesDialog = ref(false)
	const selectedNoteForEdit = ref<INoteCanvas | null>(null)
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

	let canvasInstance: Canvas | null = null

	// Función para manejar la selección de un nodo desde el panel
	const handleNodeSelection = (selectedNode: INodeCanvas) => {
		if (!canvasInstance || !nodeOrigin.value) return

		// Usar la posición del mouse si está disponible, sino usar la posición por defecto
		const positionX = currentMousePosition.value.x || nextNodePosition.value.x
		const positionY = currentMousePosition.value.y || nextNodePosition.value.y

		// Crear una copia del nodo con nueva posición
		const nodeToAdd: INodeCanvas = {
			...JSON.parse(JSON.stringify(selectedNode)),
			design: {
				x: positionX,
				y: positionY
			}
		}

		// Añadir el nodo
		debugStore.addLog('info', `Agregando nodo "${selectedNode.info.name}" al canvas`, 'Canvas')
		console.log('nodeOrigin', nodeOrigin.value)
		const connectorOriginName =
			typeof nodeOrigin.value.connection === 'string' ? nodeOrigin.value.connection : nodeOrigin.value.connection.name || ''
		const nodeId = canvasInstance.actionAddNode({
			origin: {
				idNode: nodeOrigin.value.node.id as string,
				connectorOriginName
			},
			node: nodeToAdd
		})
		debugStore.addLog('debug', `Nodo ${selectedNode.info.name} añadido con ID: ${nodeId}`, 'Canvas')
	}

	// Función para manejar el cierre del panel
	const onPanelClose = () => {
		console.log('Panel de nodos cerrado')
	}

	// Funciones para el diálogo de propiedades del nodo
	const closeNodePropertiesDialog = () => {
		showNodePropertiesDialog.value = false
		selectedNodeForEdit.value = null
	}

	const handleNodePropertiesSave = (updatedNode: INodeCanvas) => {
		if (!canvasInstance || !updatedNode.id) return
		canvasInstance.actionUpdateNodeProperties({ id: updatedNode.id, properties: updatedNode.properties })
	}

	// Funciones para el menú contextual
	const closeContextMenu = () => {
		showContextMenu.value = false
		selectedNodesForContext.value = []
	}

	const handleNodesDelete = (nodes: INodeCanvas[]) => {
		if (!canvasInstance || nodes.length === 0) return

		// Confirmar eliminación si hay múltiples nodos
		const confirmMessage =
			nodes.length === 1
				? `¿Estás seguro de que quieres eliminar el nodo "${nodes[0].info.name}"?`
				: `¿Estás seguro de que quieres eliminar ${nodes.length} nodos?`

		if (confirm(confirmMessage)) {
			const nodeIds = nodes.map((n) => n.id).filter((id): id is string => id !== undefined)
			canvasInstance.actionDeleteNodes({ ids: nodeIds })
			console.log(
				'Nodos eliminados:',
				nodes.map((n) => n.info.name)
			)
		}
	}

	const handleNodeDuplicate = (node: INodeCanvas) => {
		if (!canvasInstance) return

		// Crear una copia del nodo con nueva posición (offset para evitar superposición)
		const duplicatedNode: INodeCanvas = {
			...JSON.parse(JSON.stringify(node)),
			id: undefined, // Se generará un nuevo ID
			info: {
				...node.info,
				name: `${node.info.name} (Copia)`
			},
			design: {
				x: node.design.x + 50,
				y: node.design.y + 50
			}
		}

		// Añadir el nodo duplicado
		const nodeId = canvasInstance.actionAddNode({
			node: duplicatedNode
		})

		console.log(`Nodo ${node.info.name} duplicado con ID: ${nodeId}`)
	}

	const handleNodeRename = (node: INodeCanvas, newName: string) => {
		if (!canvasInstance || !node.id) return

		// Actualizar el nombre usando el método del canvas
		canvasInstance.actionUpdateNodeName({ id: node.id, newName })
		console.log(`Nombre cambiado de "${node.info.name}" a "${newName}"`)
	}

	// Funciones para el menú contextual de conexión
	const closeConnectionContextMenu = () => {
		showConnectionContextMenu.value = false
		selectedConnectionForContext.value = null
	}

	const handleConnectionDelete = (connectionId: string) => {
		if (!canvasInstance) return

		// Confirmar eliminación de la conexión
		const confirmMessage = '¿Estás seguro de que quieres eliminar esta conexión?'

		if (confirm(confirmMessage)) {
			canvasInstance.actionDeleteConnectionById({ id: connectionId })
			console.log('Conexión eliminada:', connectionId)
		}
	}

	// Funciones para el menú contextual del canvas
	const closeCanvasContextMenu = () => {
		showCanvasContextMenu.value = false
	}

	const handleCreateNote = (noteData: { content: string; color: string; position: { x: number; y: number } }) => {
		if (!canvasInstance) return

		const noteId = canvasInstance.actionAddNote({
			content: noteData.content,
			color: noteData.color,
			position: canvasContextCanvasPosition.value
		})

		console.log('Nota creada con ID:', noteId)
		updateNotesFromCanvas()
		closeCanvasContextMenu()
	}

	// Funciones para el modal de propiedades de nota
	const closeNotePropertiesDialog = () => {
		showNotePropertiesDialog.value = false
		selectedNoteForEdit.value = null
	}

	const handleAddNoteRequest = (data: { position: { x: number; y: number } }) => {
		noteDialogPosition.value = data.position
		selectedNoteForEdit.value = null
		showNotePropertiesDialog.value = true
		closeCanvasContextMenu()
	}

	const handleEditNoteRequest = (note: INoteCanvas) => {
		selectedNoteForEdit.value = note
		showNotePropertiesDialog.value = true
		closeNoteContextMenu()
	}

	const handleNoteSave = (noteData: {
		id?: string
		content: string
		color: string
		size: { width: number; height: number }
		position?: { x: number; y: number }
	}) => {
		if (!canvasInstance) return

		if (noteData.id) {
			// Actualizar nota existente
			const success = canvasInstance.actionUpdateNote(noteData.id, {
				content: noteData.content,
				color: noteData.color,
				size: noteData.size
			})

			if (success) {
				console.log('Nota actualizada:', noteData.id)
				updateNotesFromCanvas()
			}
		} else {
			// Crear nueva nota
			const noteId = canvasInstance.actionAddNote({
				content: noteData.content,
				color: noteData.color,
				position: noteData.position || canvasContextCanvasPosition.value,
				size: noteData.size
			})

			console.log('Nota creada con ID:', noteId)
			updateNotesFromCanvas()
		}

		closeNotePropertiesDialog()
	}

	// Funciones para el menú contextual de notas
	const closeNoteContextMenu = () => {
		showNoteContextMenu.value = false
		selectedNoteForContext.value = null
	}

	const handleNoteDelete = (noteId: string) => {
		if (!canvasInstance) return

		const success = canvasInstance.actionDeleteNote(noteId)
		if (success) {
			console.log('Nota eliminada:', noteId)
			updateNotesFromCanvas()
		}
		closeNoteContextMenu()
	}

	// Funciones para el administrador de notas
	const closeNotesManager = () => {
		showNotesManager.value = false
	}

	const handleNotesManagerSelectNote = (note: INoteCanvas) => {
		console.log('Nota seleccionada desde el administrador:', note)
		closeNotesManager()
	}

	const handleNotesManagerEditNote = (note: INoteCanvas) => {
		selectedNoteForContext.value = note
		noteContextPosition.value = { x: window.innerWidth / 2, y: window.innerHeight / 2 }
		showNoteContextMenu.value = true
		closeNotesManager()
	}

	const handleNotesManagerDeleteNote = (noteId: string) => {
		if (!canvasInstance) return

		const success = canvasInstance.actionDeleteNote(noteId)
		if (success) {
			console.log('Nota eliminada desde el administrador:', noteId)
			updateNotesFromCanvas()
		}
	}

	const updateNotesFromCanvas = () => {
		if (!canvasInstance) return
		allNotes.value = canvasInstance.getNotes() as INoteCanvas[]
	}

	// Funciones para el manejo de grupos
	const handleCreateGroupRequest = (nodeIds: string[]) => {
		selectedNodeIdsForGroup.value = nodeIds
		isEditingGroup.value = false
		selectedGroupForEdit.value = null
		showGroupPropertiesDialog.value = true
		closeContextMenu()
	}

	const closeGroupContextMenu = () => {
		showGroupContextMenu.value = false
		selectedGroupForContext.value = null
	}

	const handleEditGroupRequest = (group: INodeGroupCanvas) => {
		selectedGroupForEdit.value = group
		selectedNodeIdsForGroup.value = []
		isEditingGroup.value = true
		showGroupPropertiesDialog.value = true
		closeGroupContextMenu()
	}

	const handleUngroupRequest = (group: INodeGroupCanvas) => {
		if (!canvasInstance) return

		const success = canvasInstance.actionUngroup(group.id)
		if (success) {
			console.log('Grupo desagrupado:', group.id)
		}
		closeGroupContextMenu()
	}

	const handleDeleteGroupRequest = (group: INodeGroupCanvas) => {
		if (!canvasInstance) return

		if (confirm(`¿Estás seguro de que quieres eliminar el grupo "${group.label}"?`)) {
			const success = canvasInstance.actionDeleteGroup(group.id)
			if (success) {
				console.log('Grupo eliminado:', group.id)
			}
		}
		closeGroupContextMenu()
	}

	const closeGroupPropertiesDialog = () => {
		showGroupPropertiesDialog.value = false
		selectedGroupForEdit.value = null
		selectedNodeIdsForGroup.value = []
		isEditingGroup.value = false
	}

	const handleGroupPropertiesSave = (data: { label: string; color: string; nodeIds?: string[]; groupId?: string }) => {
		if (!canvasInstance) return

		if (isEditingGroup.value && data.groupId) {
			// Editar grupo existente
			const success = canvasInstance.actionUpdateGroup(data.groupId, {
				label: data.label,
				color: data.color
			})
			if (success) {
				console.log('Grupo actualizado:', data.groupId, data)
			}
		} else if (data.nodeIds && data.nodeIds.length > 0) {
			// Crear nuevo grupo
			const groupId = canvasInstance.actionCreateGroup({
				label: data.label,
				color: data.color,
				nodeIds: data.nodeIds
			})
			if (groupId) {
				console.log('Nuevo grupo creado:', groupId, data)
			}
		}

		closeGroupPropertiesDialog()
	}

	// Función para manejar la ejecución del workflow
	const handleExecuteWorkflow = async (version?: string) => {
		if (isExecuting.value) return

		isExecuting.value = true

		// Log de inicio de ejecución
		debugStore.addLog('info', `Iniciando ejecución del workflow${version ? ` versión ${version}` : ''}`, 'Canvas')

		try {
			const startTime = Date.now()
			const result = await canvasStore.execute(version)
			const executionTime = Date.now() - startTime

			if (result?.success) {
				debugStore.addLog('info', `Workflow ejecutado exitosamente en ${executionTime}ms`, 'Execution Engine')

				// Simular datos de debug para el nodo ejecutado
				debugStore.setDebugInfo({
					nodeId: 'workflow_execution',
					nodeName: 'Workflow Principal',
					executionTime,
					inputData: { version: version || 'latest' },
					outputData: result
				})

				if (result.message) {
					alert(result.message)
				}
			} else {
				debugStore.addLog('error', `Error ejecutando workflow: ${result?.message}`, 'Execution Engine')
				alert(`Error ejecutando workflow: ${result?.message || 'Error desconocido'}`)
			}
		} catch (error) {
			debugStore.addLog('error', `Error inesperado ejecutando workflow: ${error}`, 'Execution Engine', { error })
			alert('Error inesperado ejecutando workflow')
		} finally {
			isExecuting.value = false
		}
	}

	// Función para mostrar el selector de versiones
	const handleExecuteWithVersionSelection = async () => {
		try {
			const versionsResult = await canvasStore.getVersions()

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
	const handleSave = async () => {
		try {
			debugStore.addLog('info', 'Iniciando guardado del workflow', 'Canvas')
			const startTime = Date.now()

			await canvasStore.save()
			const saveTime = Date.now() - startTime

			debugStore.addLog('info', `Workflow guardado exitosamente en ${saveTime}ms`, 'Canvas')

			toast.success('Workflow guardado exitosamente')
		} catch (error) {
			debugStore.addLog('error', `Error al guardar el workflow: ${error}`, 'Canvas', { error })
		}
	}

	// Función para manejar la publicación del canvas
	const handlePublish = async () => {
		try {
			debugStore.addLog('info', 'Iniciando publicación del workflow', 'Canvas')

			// Primero guardamos el workflow
			await canvasStore.save()

			// Obtener el workflow actual
			const workflowId = router.currentRoute.value.params.id as string
			if (!workflowId) {
				debugStore.addLog('error', 'No se pudo obtener el ID del workflow', 'Canvas')
				return
			}

			// Validar y preparar la publicación usando el store de deployment
			const validationResult = await deploymentStore.validateAndPrepareWorkflowPublication(workflowId)

			if (validationResult.type === 'automatic' && validationResult.autoDeployment) {
				// Despliegue automático
				const { workflowInfo, autoDeployment } = validationResult

				debugStore.addLog(
					'info',
					`Proyecto tiene despliegue asignado: ${autoDeployment.deploymentId}. Publicando automáticamente.`,
					'Canvas'
				)

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
				debugStore.addLog('info', 'Abriendo selector de despliegue manual', 'Canvas')
			}
		} catch (error) {
			debugStore.addLog('error', `Error al preparar la publicación del workflow: ${error}`, 'Canvas', { error })
			toast.error('Error al preparar la publicación del workflow')
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
			debugStore.addLog('info', `Publicando workflow en despliegue: ${deploymentData.deploymentId}`, 'Canvas')

			const result = await deploymentStore.publishWorkflowToDeployment(deploymentData)

			if (typeof result === 'boolean' && result) {
				debugStore.addLog('info', 'Workflow publicado exitosamente en la cola de despliegue', 'Canvas')
				toast.success('Workflow agregado a la cola de despliegue exitosamente')
			} else if (typeof result === 'object' && result.base64) {
				debugStore.addLog('info', 'Workflow generado exitosamente.', 'Canvas')
				toast.success('Workflow generado exitosamente.')
				const link = document.createElement('a')
				link.href = result.base64
				link.download = `${currentWorkflowInfo.value?.name}.zip` || '' // Nombre del archivo que se descargará
				document.body.appendChild(link)
				link.click()
				document.body.removeChild(link)
			}

			closeDeploymentSelector()
		} catch (error) {
			debugStore.addLog('error', `Error al publicar workflow en despliegue: ${error}`, 'Canvas', { error })
			toast.error('Error al publicar workflow en despliegue')
		}
	}

	// Función para inicializar el canvas cuando el elemento esté listo
	const initializeCanvas = (canvas: HTMLCanvasElement) => {
		debugStore.addLog('debug', 'Inicializando instancia de Canvas', 'Canvas')

		canvasInstance = new Canvas({
			canvas: canvas,
			theme: settingsStore.currentTheme
		})

		canvasStore.initCanvas({ canvasInstance })

		debugStore.addLog('info', 'Canvas inicializado correctamente', 'Canvas')

		// Simular petición de red para cargar el workflow
		debugStore.addNetworkRequest({
			method: 'GET',
			url: `/api/workflows/${router.currentRoute.value.params.id}`,
			status: 200,
			duration: 150,
			size: 2048
		})

		canvasInstance.subscriber('mouse_move', (e) => {
			canvasPos.value = `${e.x}x, ${e.y}y`
			currentMousePosition.value = { x: e.x, y: e.y }
		})
		canvasInstance.subscriber('zoom', (e) => {
			canvasZoom.value = e.zoom
		})
		canvasInstance.subscriber('node_added', (e: INodeCanvasAdd) => {
			debugStore.addLog('debug', 'Evento node_added disparado', 'Canvas')
			nodeOrigin.value = e
			nodesStore.showNodePanel()
		})
		canvasInstance.subscriber('node_dbclick', (e: INodeCanvas[]) => {
			if (e.length === 0) return
			if (e.length > 1) {
				alert('No se puede añadir más de un nodo a la vez')
				return
			}
			selectedNodeForEdit.value = e[0]
			showNodePropertiesDialog.value = true
		})
		canvasInstance.subscriber('node_context', (e: { canvasTranslate: Point; selected: INodeCanvas[] }) => {
			selectedNodesForContext.value = e.selected
			showContextMenu.value = true
		})
		canvasInstance.subscriber(
			'node_connection_context',
			(e: {
				id: string
				nodeOrigin: INodeCanvas
				nodeDestiny: INodeCanvas
				input: string
				output: string
			}) => {
				console.log('Nodo conexión contextual:', e)

				// Guardar la información de la conexión para el menú contextual
				selectedConnectionForContext.value = e

				// Mostrar el menú contextual de conexión centrado
				showConnectionContextMenu.value = true
			}
		)

		canvasInstance.subscriber(
			'canvas_context',
			(e: {
				position: { x: number; y: number }
				canvasPosition: { x: number; y: number }
			}) => {
				console.log('Menú contextual del canvas:', e)
				canvasContextPosition.value = e.position
				canvasContextCanvasPosition.value = e.canvasPosition
				showCanvasContextMenu.value = true
			}
		)

		canvasInstance.subscriber(
			'note_context',
			(e: {
				note: INoteCanvas
				position: { x: number; y: number }
			}) => {
				console.log('Menú contextual de nota:', e)
				selectedNoteForContext.value = e.note
				noteContextPosition.value = e.position
				showNoteContextMenu.value = true
			}
		)

		canvasInstance.subscriber(
			'group_context',
			(e: {
				group: INodeGroupCanvas
				position: { x: number; y: number }
			}) => {
				console.log('Menú contextual de grupo:', e)
				selectedGroupForContext.value = e.group
				showGroupContextMenu.value = true
			}
		)

		// Inicializar las notas
		updateNotesFromCanvas()
	}

	// Función para cargar el workflow
	const loadWorkflow = async () => {
		try {
			console.log('iniciando carga del workflow')
			debugStore.addLog('info', 'Iniciando carga del workflow', 'Canvas')
			await canvasStore.loadWorkflow({ flow: router.currentRoute.value.params.id as string })
			console.log('cargando eventos')
			socketService.getWorkflowsEvents('worker:animations', (event: any) => {
				console.log('recibió un evento', event)
			})

			isLoading.value = false

			debugStore.addLog('info', 'Workflow cargado exitosamente', 'Canvas')

			// Watch para actualizar las notas cuando se abra el administrador
			watch(
				() => showNotesManager.value,
				(isVisible) => {
					if (isVisible) {
						updateNotesFromCanvas()
					}
				}
			)

			watch(
				() => settingsStore.currentTheme,
				() => {
					if (!canvasInstance) return
					canvasInstance.changeTheme(settingsStore.currentTheme)
				}
			)
		} catch (error) {
			console.error(error)
			debugStore.addLog('error', `Error cargando flujo: ${error}`, 'Canvas', { error })
			isLoading.value = false
			isError.value = true

			// Simular petición de red fallida
			debugStore.addNetworkRequest({
				method: 'GET',
				url: `/api/workflows/${router.currentRoute.value.params.id}`,
				status: 404,
				duration: 500,
				size: 128
			})
		}
	}

	return {
		// Referencias reactivas
		canvasPos,
		canvasZoom,
		projectName,
		isExecuting,
		isLoading,
		isError,

		// Estados del selector de versiones
		showVersionSelector,
		availableVersions,
		selectedVersion,

		// Estados de modales y menús contextuales
		showNodePropertiesDialog,
		selectedNodeForEdit,
		showContextMenu,
		selectedNodesForContext,
		showConnectionContextMenu,
		selectedConnectionForContext,
		showCanvasContextMenu,
		canvasContextPosition,
		showNoteContextMenu,
		selectedNoteForContext,
		noteContextPosition,
		showNotePropertiesDialog,
		selectedNoteForEdit,
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

		// Funciones
		handleNodeSelection,
		onPanelClose,
		closeNodePropertiesDialog,
		handleNodePropertiesSave,
		closeContextMenu,
		handleNodesDelete,
		handleNodeDuplicate,
		handleNodeRename,
		closeConnectionContextMenu,
		handleConnectionDelete,
		closeCanvasContextMenu,
		handleAddNoteRequest,
		handleEditNoteRequest,
		handleNoteSave,
		closeNoteContextMenu,
		handleNoteDelete,
		closeNotesManager,
		handleNotesManagerSelectNote,
		handleNotesManagerEditNote,
		handleNotesManagerDeleteNote,
		handleCreateGroupRequest,
		closeGroupContextMenu,
		handleEditGroupRequest,
		handleUngroupRequest,
		handleDeleteGroupRequest,
		closeGroupPropertiesDialog,
		handleGroupPropertiesSave,
		handleExecuteWorkflow,
		handleExecuteWithVersionSelection,
		closeVersionSelector,
		executeSelectedVersion,
		handleSave,
		handlePublish,
		closeDeploymentSelector,
		handleDeploymentPublish,
		initializeCanvas,
		loadWorkflow,
		closeNotePropertiesDialog,

		// Función para seleccionar versión
		selectVersion: (version: string) => {
			selectedVersion.value = version
		}
	}
}
