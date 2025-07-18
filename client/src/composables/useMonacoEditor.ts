import { ref, onMounted, onUnmounted, type Ref } from 'vue'
import loader from '@monaco-editor/loader'

export interface MonacoEditorOptions {
	language?: string
	theme?: 'vs-dark' | 'vs-light' | 'hc-black'
	readOnly?: boolean
	minimap?: boolean
	fontSize?: number
	lineNumbers?: 'on' | 'off' | 'relative' | 'interval'
	wordWrap?: 'on' | 'off' | 'wordWrapColumn' | 'bounded'
	height?: number
}

export function useMonacoEditor(containerRef: Ref<HTMLElement | undefined>, initialValue = '', options: MonacoEditorOptions = {}) {
	const editor = ref<any>(null)
	const isReady = ref(false)
	const monaco = ref<any>(null)

	const defaultOptions = {
		value: initialValue,
		language: options.language || 'plaintext',
		theme: options.theme || 'vs-dark',
		minimap: { enabled: options.minimap ?? false },
		scrollBeyondLastLine: false,
		fontSize: options.fontSize || 14,
		lineNumbers: options.lineNumbers || 'on',
		roundedSelection: false,
		readOnly: options.readOnly || false,
		automaticLayout: true,
		wordWrap: options.wordWrap || 'on',
		folding: true,
		lineDecorationsWidth: 0,
		lineNumbersMinChars: 3,
		glyphMargin: false
	}

	const initializeEditor = async () => {
		if (!containerRef.value) return

		try {
			// Configurar Monaco Loader
			loader.config({
				paths: {
					vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs'
				}
			})

			// Cargar Monaco Editor
			monaco.value = await loader.init()

			// Crear el editor
			editor.value = monaco.value.editor.create(containerRef.value, defaultOptions)
			isReady.value = true
		} catch (error) {
			console.error('Error inicializando Monaco Editor:', error)
		}
	}

	const setValue = (value: string) => {
		if (editor.value && value !== editor.value.getValue()) {
			editor.value.setValue(value)
		}
	}

	const getValue = (): string => {
		return editor.value?.getValue() || ''
	}

	const setLanguage = (language: string) => {
		if (editor.value && monaco.value) {
			const model = editor.value.getModel()
			if (model) {
				monaco.value.editor.setModelLanguage(model, language)
			}
		}
	}

	const setTheme = (theme: 'vs-dark' | 'vs-light' | 'hc-black') => {
		if (monaco.value) {
			monaco.value.editor.setTheme(theme)
		}
	}

	const setReadOnly = (readOnly: boolean) => {
		if (editor.value) {
			editor.value.updateOptions({ readOnly })
		}
	}

	const onContentChange = (callback: (value: string) => void) => {
		if (editor.value) {
			return editor.value.onDidChangeModelContent(() => {
				callback(getValue())
			})
		}
	}

	const dispose = () => {
		if (editor.value) {
			editor.value.dispose()
			editor.value = null
			isReady.value = false
		}
	}

	onMounted(() => {
		// Pequeño delay para asegurar que el DOM esté listo
		setTimeout(initializeEditor, 100)
	})

	onUnmounted(() => {
		dispose()
	})

	return {
		editor,
		isReady,
		setValue,
		getValue,
		setLanguage,
		setTheme,
		setReadOnly,
		onContentChange,
		dispose
	}
}
