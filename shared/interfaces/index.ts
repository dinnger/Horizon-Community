/**
 * Interfaces existentes del proyecto Horizon
 *
 * Para las nuevas interfaces estandarizadas, use:
 * import { ... } from '@shared/interfaces/standardized.js'
 */

// Status interface (nueva interfaz unificada)
export * from './status.interface.js'

// Existing interfaces (mantener compatibilidad)
export * from './class.interface.js'
export * from './client.interface.js'
export * from './connection.interface.js'
export * from './socket.interface.js'
export * from './context.interface.js'
export * from './workflow.properties.interface.js'
export * from './deployment.interface.js'

// Entity interfaces
export * from './entities/global.interface.js'
export * from './entities/global.deployments.interface.js'
export * from './entities/global.deploymentsQueue.interface.js'
export * from './entities/projects.interface.js'
export * from './entities/security.interface.js'
export * from './entities/security.secret.interface.js'
export * from './entities/workflows.envs.interface.js'
export * from './entities/workflows.flows.interface.js'
export * from './entities/workflows.history.interface.js'
export * from './entities/workspace.interface.js'
