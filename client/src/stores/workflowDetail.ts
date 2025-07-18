import { ref, computed } from "vue";
import { defineStore } from "pinia";

// Interfaces
export interface Workflow {
	id: string;
	name: string;
	description: string;
	status: "running" | "success" | "failed" | "pending";
	lastRun: Date;
	duration: string;
	projectId: string;
}

export interface WorkflowStats {
	totalExecutions: number;
	executionsThisWeek: number;
	successRate: number;
	successCount: number;
	avgDuration: string;
	failureCount: number;
	failureRate: number;
}

export interface GanttNode {
	id: string;
	name: string;
	status: "running" | "success" | "failed" | "pending";
	startTime: number;
	duration: number;
}

export interface Log {
	id: number;
	timestamp: Date;
	level: "info" | "warning" | "error";
	message: string;
}

export interface NodeExecution {
	nodeId: string;
	nodeName: string;
	inputs: Record<string, unknown>;
	outputs: Record<string, unknown>;
	status: "running" | "success" | "failed" | "pending";
	startTime: number;
	duration: number;
}

export interface ExecutionData {
	inputs: Record<string, unknown>;
	outputs: Record<string, unknown>;
	environment: Record<string, string>;
	nodeExecutions: NodeExecution[];
	artifacts: {
		id: string;
		name: string;
		path: string;
		size: number;
		type: string;
	}[];
}

export interface ExecutionHistoryItem {
	id: string;
	date: Date;
	status: "success" | "failed";
	duration: string;
	timestamp: Date;
	trigger: string;
}

export const useWorkflowDetailStore = defineStore("workflowDetail", () => {
	// State
	const workflow = ref<Workflow | null>(null);
	const workflowStats = ref<WorkflowStats>({
		totalExecutions: 0,
		executionsThisWeek: 0,
		successRate: 0,
		successCount: 0,
		avgDuration: "0s",
		failureCount: 0,
		failureRate: 0,
	});
	const ganttData = ref<GanttNode[]>([]);
	const totalDuration = ref(0);
	const logs = ref<Log[]>([]);	const executionData = ref<ExecutionData>({
		inputs: {},
		outputs: {},
		environment: {},
		nodeExecutions: [],
		artifacts: [],
	});
	const executionHistory = ref<ExecutionHistoryItem[]>([]);
	const loading = ref(false);
	const error = ref<string | null>(null);

	// Getters
	const timeScale = computed(() => {
		if (totalDuration.value === 0) return [];
		const seconds = Math.ceil(totalDuration.value / 1000);
		return Array.from({ length: seconds + 1 }, (_, i) => i);
	});

	// Actions
	function fetchWorkflowDetails(workflowId: string) {
		loading.value = true;
		error.value = null;
		try {
			// Simulate API call
			setTimeout(() => {
				loadMockData(workflowId);
				loading.value = false;
			}, 500);
		} catch (e) {
			error.value = "Failed to fetch workflow details.";
			loading.value = false;
		}
	}

	function loadMockData(workflowId: string) {
		workflow.value = {
			id: workflowId,
			name: "Procesamiento de Pedidos",
			description:
				"Un flujo de trabajo para procesar los pedidos de los clientes desde la recepción hasta el envío.",
			status: "success",
			lastRun: new Date("2025-06-23T14:30:00Z"),
			duration: "5m 23s",
			projectId: "1",
		};

		workflowStats.value = {
			totalExecutions: 152,
			executionsThisWeek: 14,
			successRate: 95,
			successCount: 144,
			avgDuration: "5m 10s",
			failureCount: 8,
			failureRate: 5,
		};

		ganttData.value = [
			{
				id: "node-1",
				name: "Recibir Pedido",
				status: "success",
				startTime: 0,
				duration: 500,
			},
			{
				id: "node-2",
				name: "Validar Stock",
				status: "success",
				startTime: 500,
				duration: 1000,
			},
			{
				id: "node-3",
				name: "Procesar Pago",
				status: "success",
				startTime: 1500,
				duration: 1500,
			},
			{
				id: "node-4",
				name: "Preparar Envío",
				status: "success",
				startTime: 3000,
				duration: 2000,
			},
			{
				id: "node-5",
				name: "Notificar Cliente",
				status: "success",
				startTime: 5000,
				duration: 230,
			},
		];
		totalDuration.value = ganttData.value.reduce(
			(acc, node) => Math.max(acc, node.startTime + node.duration),
			0,
		);

		logs.value = [
			{
				id: 1,
				timestamp: new Date(),
				level: "info",
				message: "Workflow started",
			},
			{
				id: 2,
				timestamp: new Date(),
				level: "info",
				message: "Executing node: Recibir Pedido",
			},
			{
				id: 3,
				timestamp: new Date(),
				level: "warning",
				message: "Stock level low for product XYZ",
			},
			{
				id: 4,
				timestamp: new Date(),
				level: "info",
				message: "Payment processed successfully",
			},
			{
				id: 5,
				timestamp: new Date(),
				level: "error",
				message: "Failed to send notification email",
			},
			{
				id: 6,
				timestamp: new Date(),
				level: "info",
				message: "Workflow finished",
			},
		];
		executionData.value = {
			inputs: { orderId: "ORD-12345", customerId: "CUST-6789" },
			outputs: {
				shipmentId: "SHP-54321",
				trackingUrl: "http://example.com/track/SHP-54321",
			},
			environment: { API_KEY: "********", REGION: "us-east-1" },
			nodeExecutions: [
				{
					nodeId: "node-1",
					nodeName: "Recibir Pedido",
					inputs: { orderId: "ORD-12345", customerId: "CUST-6789" },
					outputs: { validatedOrder: true, orderDetails: { items: 3, total: 299.99 } },
					status: "success",
					startTime: 0,
					duration: 500,
				},
				{
					nodeId: "node-2",
					nodeName: "Validar Stock",
					inputs: { orderDetails: { items: 3, total: 299.99 } },
					outputs: { stockAvailable: true, reservedItems: ["item1", "item2", "item3"] },
					status: "success",
					startTime: 500,
					duration: 1000,
				},
				{
					nodeId: "node-3",
					nodeName: "Procesar Pago",
					inputs: { total: 299.99, paymentMethod: "credit_card" },
					outputs: { transactionId: "TXN-789", paymentStatus: "completed" },
					status: "success",
					startTime: 1500,
					duration: 1500,
				},
				{
					nodeId: "node-4",
					nodeName: "Preparar Envío",
					inputs: { 
						reservedItems: ["item1", "item2", "item3"], 
						shippingAddress: "123 Main St, City, State" 
					},
					outputs: { 
						shipmentId: "SHP-54321", 
						trackingNumber: "TRK-98765",
						estimatedDelivery: "2025-06-25T10:00:00Z"
					},
					status: "success",
					startTime: 3000,
					duration: 2000,
				},
				{
					nodeId: "node-5",
					nodeName: "Notificar Cliente",
					inputs: { 
						customerId: "CUST-6789", 
						trackingNumber: "TRK-98765",
						estimatedDelivery: "2025-06-25T10:00:00Z"
					},
					outputs: { 
						emailSent: true, 
						smsSent: true,
						notificationId: "NOT-456"
					},
					status: "success",
					startTime: 5000,
					duration: 230,
				},
			],
			artifacts: [
				{
					id: "art-1",
					name: "order_invoice.pdf",
					path: "/artifacts/order_invoice.pdf",
					size: 123456,
					type: "application/pdf",
				},
				{
					id: "art-2",
					name: "shipping_label.png",
					path: "/artifacts/shipping_label.png",
					size: 123456,
					type: "image/png",
				},
			],
		};

		executionHistory.value = [
			{
				id: "exec-1",
				date: new Date("2025-06-23T14:30:00Z"),
				status: "success",
				duration: "5m 23s",
				timestamp: new Date("2025-06-23T14:30:00Z"),
				trigger: "Manual",
			},
			{
				id: "exec-2",
				date: new Date("2025-06-22T11:00:00Z"),
				status: "success",
				duration: "5m 10s",
				timestamp: new Date("2025-06-22T11:00:00Z"),
				trigger: "Git Push",
			},
			{
				id: "exec-3",
				date: new Date("2025-06-21T09:15:00Z"),
				status: "failed",
				duration: "2m 5s",
				timestamp: new Date("2025-06-21T09:15:00Z"),
				trigger: "Scheduled",
			},
		];
	}

	function getNodeStatusColor(
		status: "running" | "success" | "failed" | "pending",
	): string {
		switch (status) {
			case "running":
				return "bg-blue-500";
			case "success":
				return "bg-green-500";
			case "failed":
				return "bg-red-500";
			case "pending":
				return "bg-gray-400";
			default:
				return "bg-gray-400";
		}
	}

	return {
		workflow,
		workflowStats,
		ganttData,
		totalDuration,
		logs,
		executionData,
		executionHistory,
		loading,
		error,
		timeScale,
		fetchWorkflowDetails,
		getNodeStatusColor,
	};
});
