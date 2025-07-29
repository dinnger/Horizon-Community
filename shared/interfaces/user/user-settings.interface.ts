/**
 * Configuración de tema
 */
export interface IUserTheme {
	value: string
	label: string
	icon: string
	colors: string[]
}

/**
 * Configuración de notificaciones
 */
export interface IUserNotificationSettings {
	general: boolean
	workflowExecution: boolean
	errors: boolean
	systemUpdates: boolean
	projectReminders: boolean
}

/**
 * Configuración de rendimiento
 */
export interface IUserPerformanceSettings {
	reducedAnimations: boolean
	autoSave: boolean
	canvasRefreshRate: number
}

/**
 * Configuración de privacidad
 */
export interface IUserPrivacySettings {
	telemetry: boolean
	localCache: boolean
}

/**
 * Configuración base del usuario
 */
export interface IUserSettingsBase {
	id: string
	userId: string
	fontSize: number
	language: string
	notifications: IUserNotificationSettings | object
	performance: IUserPerformanceSettings | object
	privacy: IUserPrivacySettings | object
	createdAt: Date
	updatedAt: Date
}

/**
 * Interfaz para configuración de usuario del cliente
 */
export interface IUserSettingsClient extends Omit<IUserSettingsBase, 'id' | 'userId' | 'createdAt' | 'updatedAt'> {
	notifications: IUserNotificationSettings
	performance: IUserPerformanceSettings
	privacy: IUserPrivacySettings
}

/**
 * Interfaz para configuración de usuario del servidor
 */
export interface IUserSettingsServer extends IUserSettingsBase {
	notifications: object // JSON para configuraciones de notificaciones
	performance: object // JSON para configuraciones de rendimiento
	privacy: object // JSON para configuraciones de privacidad
}

/**
 * Interfaz para crear configuración de usuario
 */
export interface IUserSettingsCreate extends Omit<IUserSettingsBase, 'id' | 'createdAt' | 'updatedAt'> {
	id?: string
	createdAt?: Date
	updatedAt?: Date
}

/**
 * Interfaz para actualizar configuración de usuario
 */
export interface IUserSettingsUpdate extends Partial<Omit<IUserSettingsBase, 'id' | 'userId' | 'createdAt' | 'updatedAt'>> {
	updatedAt?: Date
}

/**
 * Interfaz legacy para compatibilidad - será depreciada
 * @deprecated Usar IUserSettingsClient en su lugar
 */
export interface UserSettings extends IUserSettingsClient {}

/**
 * Interfaz legacy para compatibilidad - será depreciada
 * @deprecated Usar IUserSettingsServer en su lugar
 */
export interface UserSettingsAttributes extends IUserSettingsServer {}

/**
 * Interfaz legacy para compatibilidad - será depreciada
 * @deprecated Usar IUserTheme en su lugar
 */
export interface Theme extends IUserTheme {}

/**
 * Interfaz legacy para compatibilidad - será depreciada
 * @deprecated Usar IUserNotificationSettings en su lugar
 */
export interface NotificationSettings extends IUserNotificationSettings {}

/**
 * Interfaz legacy para compatibilidad - será depreciada
 * @deprecated Usar IUserPerformanceSettings en su lugar
 */
export interface PerformanceSettings extends IUserPerformanceSettings {}

/**
 * Interfaz legacy para compatibilidad - será depreciada
 * @deprecated Usar IUserPrivacySettings en su lugar
 */
export interface PrivacySettings extends IUserPrivacySettings {}
