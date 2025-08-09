/**
 * Migración de interfaces del canvas
 *
 * Este archivo actualiza las interfaces del canvas para usar las interfaces estandarizadas
 */

import type { INodePropertiesType } from './node.properties.interface'
import type {
	INodeCanvas as INodeCanvasStd,
	INodeConnection as INodeConnectionStd,
	INodeConnectors as INodeConnectorsStd,
	INodeCanvasAdd as INodeCanvasAddStd,
	INodeBase,
	INodeInfo as INodeInfoStd,
	INodeMeta as INodeMetaStd,
	IPoint
} from '@shared/interfaces/standardized.js'

// Re-exportar las interfaces estandarizadas para compatibilidad
export type Point = IPoint
export type INodeInfo = INodeInfoStd
export type IMetaNode = INodeMetaStd
export type INodeConnectors = INodeConnectorsStd
export type INodeConnections = INodeConnectionStd
export type INode = INodeBase
export type INodeCanvas = INodeCanvasStd
export type INodeCanvasAdd = INodeCanvasAddStd

// Interfaces específicas del canvas que no están en las estandarizadas
export interface INodeCanvasExtended extends INodeCanvas {
	update: () => void
	updateConnectionsOutput: ({ before, after }: { before: string[]; after: string[] }) => void
}
