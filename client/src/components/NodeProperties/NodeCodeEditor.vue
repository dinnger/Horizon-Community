<template>
  <div class="space-y-2">
    <div ref="editorContainer" class="w-full border rounded-md overflow-hidden"
      :class="{ 'border-error': hasError, 'border-base-content/20': !hasError }"
      style="height: 150px; min-height: 150px;">
    </div>
    <div v-if="errorMessage" class="text-error text-xs -mt-2">
      Error: {{ errorMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import loader from '@monaco-editor/loader'

interface Props {
  property: any
  propertyKey: string
  modelValue: any
  isReadOnly?: boolean // Prop para controlar el modo de solo lectura
}

interface Emits {
  'update:modelValue': [value: any]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

let editor: any = null
let monaco: any = null

const editorContainer = ref<HTMLElement>()
const errorMessage = ref('')
const isReady = ref(false)
const isUpdatingFromProp = ref(false)
let changeTimeout: number | null = null
let validationTimeout: number | null = null

const localValue = ref('')

// Sincronizar el valor local con el prop
const updateLocalValue = () => {
  if (typeof props.modelValue === 'object') {
    localValue.value = JSON.stringify(props.modelValue, null, 2)
  } else {
    localValue.value = String(props.modelValue || '')
  }
}

const hasError = computed(() => !!errorMessage.value)

const getLanguageForMonaco = (lang: string) => {
  const languageMap: Record<string, string> = {
    sql: 'sql',
    json: 'json',
    js: 'javascript',
    javascript: 'javascript',
    typescript: 'typescript',
    python: 'python',
    html: 'html',
    css: 'css',
    xml: 'xml',
    yaml: 'yaml',
    markdown: 'markdown'
  }
  return languageMap[lang] || 'plaintext'
}

const initializeMonacoEditor = async () => {
  if (!editorContainer.value) return

  try {
    // Cargar Monaco Editor
    monaco = await loader.init()

    const language = getLanguageForMonaco(props.property.lang || 'plaintext')

    editor = monaco.editor.create(editorContainer.value, {
      value: localValue.value,
      language: language,
      theme: 'vs-dark',
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      fontSize: 14,
      lineNumbers: 'on',
      roundedSelection: false,
      readOnly: props.property.disabled || props.isReadOnly || false,
      automaticLayout: true,
      wordWrap: 'on',
      folding: true,
      lineDecorationsWidth: 0,
      lineNumbersMinChars: 3,
      glyphMargin: false,
      // Configuraciones adicionales para mejorar rendimiento
      quickSuggestions: false,
      parameterHints: { enabled: false },
      suggestOnTriggerCharacters: false,
      acceptSuggestionOnEnter: 'off',
      tabCompletion: 'off',
      wordBasedSuggestions: 'off'
    })

    // Escuchar cambios en el editor con debounce
    editor.onDidChangeModelContent(() => {
      if (editor && !isUpdatingFromProp.value && !props.isReadOnly) {
        const value = editor.getValue()
        localValue.value = value

        // Cancelar timeout anterior
        if (changeTimeout) {
          window.clearTimeout(changeTimeout)
        }

        // Emitir cambio inmediatamente pero validar con delay
        emit('update:modelValue', value)

        // Debounce solo la validación
        changeTimeout = window.setTimeout(() => {
          validateCode(value)
          changeTimeout = null
        }, 500)
      }
    })

    isReady.value = true
    // Inicializar valor local y validar código inicial
    updateLocalValue()
    validateCode(localValue.value)
  } catch (error) {
    console.error('Error inicializando Monaco Editor:', error)
    // Fallback: mostrar un textarea simple
    createFallbackEditor()
  }
}

const createFallbackEditor = () => {
  if (!editorContainer.value) return

  const isReadOnlyMode = props.property.disabled || props.isReadOnly || false

  editorContainer.value.innerHTML = `
    <textarea 
      class="w-full h-full p-3 bg-gray-900 text-green-400 font-mono text-sm resize-none border-0 outline-none"
      placeholder="Ingresa tu código aquí..."
      ${isReadOnlyMode ? 'readonly' : ''}
    >${localValue.value}</textarea>
  `

  const textarea = editorContainer.value.querySelector('textarea')
  if (textarea && !isReadOnlyMode) {
    let inputTimeout: number | null = null
    textarea.addEventListener('input', (e) => {
      if (props.isReadOnly) return // Evitar cambios en modo de solo lectura

      const value = (e.target as HTMLTextAreaElement).value
      localValue.value = value

      // Emitir cambio inmediatamente
      emit('update:modelValue', value)

      // Debounce solo la validación
      if (inputTimeout) {
        window.clearTimeout(inputTimeout)
      }
      inputTimeout = window.setTimeout(() => {
        validateCode(value)
        inputTimeout = null
      }, 500)
    })
  }
}

const validateCode = (value?: string) => {
  // Cancelar validación anterior
  if (validationTimeout) {
    window.clearTimeout(validationTimeout)
  }

  // Usar requestAnimationFrame para no bloquear el hilo principal
  validationTimeout = window.setTimeout(() => {
    try {
      const code = value || localValue.value || ''

      if (props.property.lang === 'json' && code.trim()) {
        JSON.parse(code) // Validar JSON solo si no está vacío
      }

      errorMessage.value = ''
    } catch (error) {
      errorMessage.value = (error as Error).message
    }
    validationTimeout = null
  }, 100)
}

// Validar el código cuando cambia el valor externamente
watch(() => props.modelValue, (newValue) => {
  // Evitar actualizaciones innecesarias
  if (isUpdatingFromProp.value) return

  if (isReady.value && editor) {
    isUpdatingFromProp.value = true

    const formattedValue = typeof newValue === 'object' ?
      JSON.stringify(newValue, null, 2) :
      String(newValue || '')

    const currentValue = editor.getValue()
    if (formattedValue !== currentValue) {
      // Usar nextTick para asegurar que la actualización se haga correctamente
      requestAnimationFrame(() => {
        if (editor) {
          editor.setValue(formattedValue)
          localValue.value = formattedValue
        }

        // Resetear flag después de la actualización
        setTimeout(() => {
          isUpdatingFromProp.value = false
        }, 50)
      })
    } else {
      isUpdatingFromProp.value = false
    }
  } else {
    // Si el editor no está listo, actualizar valor local
    updateLocalValue()
  }
}, { flush: 'sync' })

// Observar cambios en el idioma
watch(() => props.property.lang, (newLang) => {
  if (isReady.value && editor && monaco) {
    const language = getLanguageForMonaco(newLang || 'plaintext')
    const model = editor.getModel()
    if (model) {
      monaco.editor.setModelLanguage(model, language)
    }
  }
})

// Observar cambios en el estado de solo lectura
watch(() => [props.property.disabled, props.isReadOnly], ([isDisabled, isReadOnly]) => {
  if (isReady.value && editor) {
    editor.updateOptions({ readOnly: isDisabled || isReadOnly || false })
  }
})

onMounted(() => {
  // Inicializar valor local
  updateLocalValue()

  // Pequeño delay para asegurar que el DOM esté listo
  setTimeout(() => {
    initializeMonacoEditor()
  }, 100)
})

onUnmounted(() => {
  if (editor) {
    editor.dispose()
    editor = null
  }
})
</script>

<style scoped>
/* Estilos específicos para el contenedor del editor */
:deep(.monaco-editor) {
  border-radius: 0.375rem;
}

:deep(.monaco-editor .margin) {
  background-color: transparent;
}
</style>
