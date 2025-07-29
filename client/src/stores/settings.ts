import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import type {
	IUserSettingsClient,
	IUserTheme,
	IUserNotificationSettings,
	IUserPerformanceSettings,
	IUserPrivacySettings
} from '@shared/interfaces/standardized.js'
import socketService from '@/services/socket'

// Interfaces legacy para compatibilidad
export interface Theme extends IUserTheme {}
export interface NotificationSettings extends IUserNotificationSettings {}
export interface PerformanceSettings extends IUserPerformanceSettings {}
export interface PrivacySettings extends IUserPrivacySettings {}
export interface UserSettings extends IUserSettingsClient {}

export const useSettingsStore = defineStore('settings', () => {
	// Current settings

	const currentTheme = ref(localStorage.getItem('horizon-theme') || 'light')
	const fontSize = ref(16)
	const language = ref('es')

	const notifications = reactive<NotificationSettings>({
		general: true,
		workflowExecution: true,
		errors: true,
		systemUpdates: false,
		projectReminders: true
	})

	const performance = reactive<PerformanceSettings>({
		reducedAnimations: false,
		autoSave: true,
		canvasRefreshRate: 25
	})

	const privacy = reactive<PrivacySettings>({
		telemetry: false,
		localCache: true
	})

	const setTheme = (theme: string) => {
		currentTheme.value = theme
		localStorage.setItem('horizon-theme', theme)
	}

	const setFontSize = (size: number) => {
		fontSize.value = size
		document.documentElement.style.fontSize = `${size}px`
	}

	const setLanguage = (lang: string) => {
		language.value = lang
	}

	const updateNotifications = (key: keyof NotificationSettings, value: boolean) => {
		notifications[key] = value
	}

	const updatePerformance = (key: keyof PerformanceSettings, value: never) => {
		performance[key] = value
	}

	const updatePrivacy = (key: keyof PrivacySettings, value: boolean) => {
		privacy[key] = value
	}

	const saveSettings = () => {
		const settings: UserSettings = {
			fontSize: fontSize.value,
			language: language.value,
			notifications: { ...notifications },
			performance: { ...performance },
			privacy: { ...privacy }
		}
		socketService.settings().updateUserSettings(settings)
	}

	const loadSettings = async () => {
		const settings: UserSettings = await socketService.settings().getUserSettings()
		if (settings) {
			try {
				fontSize.value = settings.fontSize || 16
				language.value = settings.language || 'es'

				if (settings.notifications) {
					Object.assign(notifications, settings.notifications)
				}
				if (settings.performance) {
					Object.assign(performance, settings.performance)
				}
				if (settings.privacy) {
					Object.assign(privacy, settings.privacy)
				}

				setFontSize(fontSize.value)
			} catch (e) {
				console.error('Error loading settings:', e)
			}
		}
	}

	const exportData = () => {
		const data = {
			settings: {
				theme: currentTheme.value,
				fontSize: fontSize.value,
				language: language.value,
				notifications: notifications,
				performance: performance,
				privacy: privacy
			},
			timestamp: new Date().toISOString()
		}

		const blob = new Blob([JSON.stringify(data, null, 2)], {
			type: 'application/json'
		})
		const url = URL.createObjectURL(blob)
		const a = document.createElement('a')
		a.href = url
		a.download = 'horizon-settings.json'
		a.click()
		URL.revokeObjectURL(url)
	}

	const clearData = () => {
		if (confirm('¿Estás seguro de que quieres limpiar todos los datos? Esta acción no se puede deshacer.')) {
			localStorage.clear()
			// Reset to defaults
			currentTheme.value = 'crystal'
			fontSize.value = 16
			language.value = 'es'

			Object.assign(notifications, {
				general: true,
				workflowExecution: true,
				errors: true,
				systemUpdates: false,
				projectReminders: true
			})

			Object.assign(performance, {
				reducedAnimations: false,
				autoSave: true
			})

			Object.assign(privacy, {
				telemetry: false,
				localCache: true
			})

			alert('Datos limpiados. La página se recargará.')
			window.location.reload()
		}
	}

	const importSettings = (settingsData: UserSettings) => {
		fontSize.value = settingsData.fontSize || 16
		language.value = settingsData.language || 'es'

		if (settingsData.notifications) {
			Object.assign(notifications, settingsData.notifications)
		}
		if (settingsData.performance) {
			Object.assign(performance, settingsData.performance)
		}
		if (settingsData.privacy) {
			Object.assign(privacy, settingsData.privacy)
		}

		saveSettings()
		setTheme(currentTheme.value)
		setFontSize(fontSize.value)
	}

	const resetToDefaults = () => {
		if (confirm('¿Estás seguro de que quieres restablecer todas las configuraciones a los valores por defecto?')) {
			currentTheme.value = 'light'
			fontSize.value = 16
			language.value = 'es'

			Object.assign(notifications, {
				general: true,
				workflowExecution: true,
				errors: true,
				systemUpdates: false,
				projectReminders: true
			})

			Object.assign(performance, {
				reducedAnimations: false,
				autoSave: true,
				canvasRefreshRate: 25
			})

			Object.assign(privacy, {
				telemetry: false,
				localCache: true
			})

			saveSettings()
			setTheme(currentTheme.value)
			setFontSize(fontSize.value)
		}
	}

	return {
		// State
		currentTheme,
		fontSize,
		language,
		notifications,
		performance,
		privacy,

		// Actions
		setTheme,
		setFontSize,
		setLanguage,
		updateNotifications,
		updatePerformance,
		updatePrivacy,
		saveSettings,
		loadSettings,
		exportData,
		clearData,
		importSettings,
		resetToDefaults
	}
})
