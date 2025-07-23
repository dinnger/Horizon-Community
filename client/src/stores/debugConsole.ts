import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface ConsoleLog {
	id: string
	timestamp: Date
	level: 'info' | 'warn' | 'error' | 'debug'
	message: string
	source?: string
	details?: any
}

export interface WorkerStat {
	id: string
	name: string
	status: 'active' | 'idle' | 'error' | 'stopped'
	cpuUsage: number
	memoryUsage: number
	tasksCompleted: number
	tasksRunning: number
	lastActivity: Date
	uptime: number
}

export interface DebugInfo {
	nodeId?: string
	nodeName?: string
	executionTime?: number
	inputData?: any
	outputData?: any
	error?: string
}

export const useDebugConsoleStore = defineStore('debugConsole', () => {
	// Estado del panel
	const isVisible = ref(false)
	const activeTab = ref<'console' | 'debug' | 'workers' | 'network'>('console')
	const panelHeight = ref(300)
	const isMinimized = ref(false)

	// Logs de consola
	const consoleLogs = ref<ConsoleLog[]>([])
	const maxLogsCount = ref(1000)
	const filterLevel = ref<'all' | 'info' | 'warn' | 'error' | 'debug'>('all')

	// Datos de debug
	const debugInfo = ref<DebugInfo | null>(null)
	const debugHistory = ref<DebugInfo[]>([])

	// Estadísticas de workers
	const workerStats = ref<WorkerStat[]>([])

	// Peticiones de red (simuladas)
	const networkRequests = ref<
		Array<{
			id: string
			method: string
			url: string
			status: number
			duration: number
			timestamp: Date
			size: number
		}>
	>([])

	// Computed
	const filteredLogs = computed(() => {
		if (filterLevel.value === 'all') {
			return consoleLogs.value
		}
		return consoleLogs.value.filter((log) => log.level === filterLevel.value)
	})

	const activeWorkers = computed(() => workerStats.value.filter((worker) => worker.status === 'active').length)

	const totalMemoryUsage = computed(() => workerStats.value.reduce((total, worker) => total + worker.memoryUsage, 0))

	const avgCpuUsage = computed(() => {
		if (workerStats.value.length === 0) return 0
		return workerStats.value.reduce((total, worker) => total + worker.cpuUsage, 0) / workerStats.value.length
	})

	// Acciones
	const togglePanel = () => {
		isVisible.value = !isVisible.value
	}

	const showPanel = () => {
		isVisible.value = true
	}

	const hidePanel = () => {
		isVisible.value = false
	}

	const toggleMinimize = () => {
		isMinimized.value = !isMinimized.value
	}

	const setActiveTab = (tab: 'console' | 'debug' | 'workers' | 'network') => {
		activeTab.value = tab
	}

	const setPanelHeight = (height: number) => {
		panelHeight.value = Math.max(200, Math.min(600, height))
	}

	const addLog = (level: ConsoleLog['level'], message: string, source?: string, details?: any) => {
		const log: ConsoleLog = {
			id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
			timestamp: new Date(),
			level,
			message,
			source,
			details
		}

		consoleLogs.value.unshift(log)

		// Mantener solo los últimos N logs
		if (consoleLogs.value.length > maxLogsCount.value) {
			consoleLogs.value = consoleLogs.value.slice(0, maxLogsCount.value)
		}
	}

	const clearLogs = () => {
		consoleLogs.value = []
	}

	const setFilterLevel = (level: typeof filterLevel.value) => {
		filterLevel.value = level
	}

	const setDebugInfo = (info: DebugInfo) => {
		debugInfo.value = info
		debugHistory.value.unshift({ ...info })

		// Mantener solo los últimos 50 debug entries
		if (debugHistory.value.length > 50) {
			debugHistory.value = debugHistory.value.slice(0, 50)
		}
	}

	const clearDebugInfo = () => {
		debugInfo.value = null
		debugHistory.value = []
	}

	const updateWorkerStats = (stats: WorkerStat[]) => {
		workerStats.value = stats
	}

	const clearNetworkRequests = () => {
		networkRequests.value = []
	}

	// Inicializar con datos dummy
	const initializeDummyData = () => {
		// Logs dummy
		const dummyLogs = [
			{ level: 'info' as const, message: 'Aplicación iniciada correctamente', source: 'Sistema' },
			{ level: 'info' as const, message: 'Conexión establecida con el servidor', source: 'Socket' },
			{ level: 'warn' as const, message: 'Worker #2 reportando alta carga de CPU', source: 'Worker Manager' },
			{ level: 'debug' as const, message: 'Nodo "HTTP Request" ejecutado en 245ms', source: 'Canvas' },
			{ level: 'error' as const, message: 'Falló la conexión con base de datos', source: 'Database', details: { code: 'CONN_TIMEOUT' } },
			{ level: 'info' as const, message: 'Workflow "Data Processing" completado exitosamente', source: 'Execution Engine' },
			{ level: 'debug' as const, message: 'Cache invalidado para key: user_sessions', source: 'Cache Manager' },
			{ level: 'warn' as const, message: 'Rate limit alcanzado para API externa', source: 'HTTP Client' }
		]

		dummyLogs.forEach((log, index) => {
			setTimeout(() => {
				addLog(log.level, log.message, log.source, log.details)
			}, index * 500)
		})

		// Workers dummy
		const dummyWorkers: WorkerStat[] = [
			{
				id: 'worker_1',
				name: 'Data Processor #1',
				status: 'active',
				cpuUsage: 45.2,
				memoryUsage: 128.5,
				tasksCompleted: 1247,
				tasksRunning: 3,
				lastActivity: new Date(Date.now() - 2000),
				uptime: 3600000
			},
			{
				id: 'worker_2',
				name: 'HTTP Handler #1',
				status: 'active',
				cpuUsage: 23.1,
				memoryUsage: 95.3,
				tasksCompleted: 856,
				tasksRunning: 1,
				lastActivity: new Date(Date.now() - 1000),
				uptime: 2700000
			},
			{
				id: 'worker_3',
				name: 'File Processor #1',
				status: 'idle',
				cpuUsage: 2.1,
				memoryUsage: 42.7,
				tasksCompleted: 342,
				tasksRunning: 0,
				lastActivity: new Date(Date.now() - 30000),
				uptime: 5400000
			},
			{
				id: 'worker_4',
				name: 'Email Service #1',
				status: 'error',
				cpuUsage: 0,
				memoryUsage: 15.2,
				tasksCompleted: 98,
				tasksRunning: 0,
				lastActivity: new Date(Date.now() - 120000),
				uptime: 1800000
			}
		]

		updateWorkerStats(dummyWorkers)

		// Network requests dummy
		const dummyRequests = [
			{ method: 'GET', url: '/api/projects', status: 200, duration: 145, size: 2048 },
			{ method: 'POST', url: '/api/workflows/execute', status: 201, duration: 2340, size: 512 },
			{ method: 'GET', url: '/api/nodes/library', status: 200, duration: 89, size: 15360 },
			{ method: 'PUT', url: '/api/projects/123', status: 400, duration: 156, size: 256 },
			{ method: 'GET', url: '/api/workers/stats', status: 200, duration: 67, size: 1024 }
		]

		// Debug info dummy
		setTimeout(() => {
			setDebugInfo({
				nodeId: 'node_http_001',
				nodeName: 'HTTP Request',
				executionTime: 245,
				inputData: { url: 'https://api.example.com/data', method: 'GET' },
				outputData: { status: 200, data: { users: 150, active: 45 } }
			})
		}, 1000)
	}

	return {
		// Estado
		isVisible,
		activeTab,
		panelHeight,
		isMinimized,
		consoleLogs,
		filteredLogs,
		filterLevel,
		debugInfo,
		debugHistory,
		workerStats,
		networkRequests,

		// Computed
		activeWorkers,
		totalMemoryUsage,
		avgCpuUsage,

		// Acciones
		togglePanel,
		showPanel,
		hidePanel,
		toggleMinimize,
		setActiveTab,
		setPanelHeight,
		addLog,
		clearLogs,
		setFilterLevel,
		setDebugInfo,
		clearDebugInfo,
		updateWorkerStats,
		clearNetworkRequests,
		initializeDummyData
	}
})
