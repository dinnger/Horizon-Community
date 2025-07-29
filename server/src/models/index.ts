// Import all models
import User from './User.js'
import Role from './Role.js'
import Permission from './Permission.js'
import RolePermission from './RolePermission.js'
import Workspace from './Workspace.js'
import Project from './Project.js'
import Workflow from './Workflow.js'
import WorkflowExecution from './WorkflowExecution.js'
import WorkflowHistory from './WorkflowHistory.js'
import ExecutionLog from './ExecutionLog.js'
import UserSettings from './UserSettings.js'
import Deployment from './Deployment.js'
import DeploymentInstance from './DeploymentInstance.js'
import DeploymentInstanceAssignment from './DeploymentInstanceAssignment.js'
import DeploymentInstanceAssignmentRole from './DeploymentInstanceAssignmentRole.js'
import DeploymentQueue from './DeploymentQueue.js'
import { sequelize } from '../config/database.js'

// Initialize database
export const initDatabase = async () => {
	try {
		// Test connection
		await sequelize.authenticate()
		console.log('Database connection established successfully.')

		// Sync all models
		await sequelize.sync({ force: false })
		console.log('All models were synchronized successfully.')
	} catch (error) {
		console.error('Unable to connect to the database:', error)
		throw error
	}
}

// Export all models
export {
	User,
	Role,
	Permission,
	RolePermission,
	Workspace,
	Project,
	Workflow,
	WorkflowExecution,
	WorkflowHistory,
	ExecutionLog,
	UserSettings,
	Deployment,
	DeploymentInstance,
	DeploymentInstanceAssignment,
	DeploymentInstanceAssignmentRole,
	DeploymentQueue,
	sequelize
}

// Export model interfaces
export type {
	UserAttributes,
	UserCreationAttributes
} from './User'

export type {
	RoleAttributes,
	RoleCreationAttributes
} from './Role'

export type {
	PermissionAttributes,
	PermissionCreationAttributes
} from './Permission'

export type {
	RolePermissionAttributes,
	RolePermissionCreationAttributes
} from './RolePermission'

export type {
	WorkspaceAttributes,
	WorkspaceCreationAttributes
} from './Workspace'

export type {
	ProjectAttributes,
	ProjectCreationAttributes
} from './Project'

export type {
	WorkflowAttributes,
	WorkflowCreationAttributes
} from './Workflow'

export type {
	WorkflowExecutionAttributes,
	WorkflowExecutionCreationAttributes
} from './WorkflowExecution'

export type {
	WorkflowHistoryAttributes,
	WorkflowHistoryCreationAttributes
} from './WorkflowHistory'

export type {
	ExecutionLogAttributes,
	ExecutionLogCreationAttributes
} from './ExecutionLog'

export type {
	UserSettingsAttributes,
	UserSettingsCreationAttributes
} from './UserSettings'

export type {
	DeploymentAttributes,
	DeploymentCreationAttributes
} from './Deployment'

export type {
	DeploymentInstanceAttributes,
	DeploymentInstanceCreationAttributes
} from './DeploymentInstance'

export type {
	DeploymentInstanceAssignmentAttributes,
	DeploymentInstanceAssignmentCreationAttributes
} from './DeploymentInstanceAssignment'

export type {
	DeploymentInstanceAssignmentRoleAttributes,
	DeploymentInstanceAssignmentRoleCreationAttributes
} from './DeploymentInstanceAssignmentRole'

export type {
	DeploymentQueueAttributes,
	DeploymentQueueCreationAttributes
} from './DeploymentQueue'
