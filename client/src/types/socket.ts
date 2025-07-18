// Socket Response Types
export interface SocketResponse<T = unknown> {
	success: boolean;
	message?: string;
	data?: T;
}

export interface LoginResponse extends SocketResponse {
	user?: {
		id: string;
		email: string;
		name: string;
		avatar?: string;
		role: {
			id: string;
			name: string;
			level: number;
			description?: string;
		};
		permissions: {
			id: string;
			module: string;
			action: string;
			description?: string;
		}[];
		settings?: UserSettings;
	};
}

export interface PermissionCheckResponse extends SocketResponse {
	hasPermission: boolean;
}

// Entity Types
export interface User {
	id: string;
	email: string;
	name: string;
	avatar?: string;
	status: "active" | "inactive" | "suspended";
	lastLoginAt?: Date;
	role: Role;
	permissions: Permission[];
	settings?: UserSettings;
	createdAt: Date;
	updatedAt: Date;
}

export interface Role {
	id: string;
	name: string;
	description?: string;
	level: number;
	status: "active" | "inactive";
	permissions?: Permission[];
	createdAt: Date;
	updatedAt: Date;
}

export interface Permission {
	id: string;
	module: string;
	action: string;
	description?: string;
	status: "active" | "inactive";
	createdAt: Date;
	updatedAt: Date;
}

export interface Workspace {
	id: string;
	name: string;
	description?: string;
	color?: string;
	icon?: string;
	isDefault: boolean;
	userId?: string;
	status: "active" | "archived";
	createdAt: Date;
	updatedAt: Date;
}

export interface Project {
	id: string;
	name: string;
	description?: string;
	color?: string;
	icon?: string;
	workspaceId: string;
	status: "active" | "archived";
	createdAt: Date;
	updatedAt: Date;
}

export interface Workflow {
	id: string;
	name: string;
	description?: string;
	version: string;
	status:
		| "draft"
		| "active"
		| "inactive"
		| "running"
		| "success"
		| "error"
		| "archived";
	nodes: any;
	connections: any;
	variables: any;
	triggers: any;
	schedule?: string;
	timeout?: number;
	retryCount?: number;
	lastRun?: Date;
	duration?: string;
	projectId: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface WorkflowExecution {
	id: string;
	workflowId: string;
	status: "running" | "success" | "error" | "cancelled";
	trigger: "manual" | "schedule" | "webhook" | "api";
	startTime: Date;
	endTime?: Date;
	duration?: string;
	inputData?: any;
	outputData?: any;
	errorMessage?: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface UserSettings {
	id: string;
	userId: string;
	theme: "light" | "dark" | "system";
	language: string;
	timezone: string;
	notifications: {
		email: boolean;
		push: boolean;
		workflowComplete: boolean;
		workflowError: boolean;
	};
	preferences: {
		autoSave: boolean;
		showLineNumbers: boolean;
		wordWrap: boolean;
	};
	createdAt: Date;
	updatedAt: Date;
}

// Socket Event Data Types
export interface LoginData {
	email: string;
	password: string;
}

export interface PermissionCheckData {
	userId: string;
	module: string;
	action: string;
}

export interface WorkspaceCreateData {
	name: string;
	description?: string;
	color?: string;
	icon?: string;
	isDefault?: boolean;
}

export interface WorkspaceUpdateData {
	id: string;
	name?: string;
	description?: string;
	color?: string;
	icon?: string;
	isDefault?: boolean;
}

export interface ProjectCreateData {
	name: string;
	description?: string;
	color?: string;
	icon?: string;
	workspaceId: string;
}

export interface WorkflowCreateData {
	name: string;
	description?: string;
	projectId: string;
	nodes?: any;
	connections?: any;
}

export interface WorkflowExecuteData {
	workflowId: string;
	trigger?: "manual" | "schedule" | "webhook" | "api";
}

export interface SettingsUpdateData {
	theme?: "light" | "dark" | "system";
	language?: string;
	timezone?: string;
	notifications?: {
		email?: boolean;
		push?: boolean;
		workflowComplete?: boolean;
		workflowError?: boolean;
	};
	preferences?: {
		autoSave?: boolean;
		showLineNumbers?: boolean;
		wordWrap?: boolean;
	};
}
