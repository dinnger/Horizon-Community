# Componentes NodeProperties

Esta carpeta contiene los componentes refactorizados del diálogo de propiedades de nodos para mejorar la legibilidad y mantenibilidad del código.

## ✨ Actualización: Monaco Editor

El componente `NodeCodeEditor` ahora utiliza **Monaco Editor** para proporcionar una experiencia de edición de código profesional con:

- 🚀 Editor de código de VS Code en el navegador
- 🎨 Resaltado de sintaxis para múltiples lenguajes
- 🔍 Validación en tiempo real (especialmente JSON)
- 🌙 Tema oscuro moderno
- 📝 Autocompletado y características avanzadas
- 🔧 Completamente configurable

**Lenguajes soportados**: JavaScript, TypeScript, JSON, SQL, Python, HTML, CSS, XML, YAML, Markdown

## Estructura de Componentes

### 1. `NodePropertiesDialog.vue` (Componente Principal)

- **Propósito**: Componente contenedor principal que orquesta todos los subcomponentes
- **Responsabilidades**:
  - Gestionar el estado global del diálogo
  - Coordinar la comunicación entre componentes
  - Manejar la lógica de guardado y inicialización
  - Importar y ejecutar scripts onCreate de nodos

### 2. `NodePropertiesHeader.vue`

- **Propósito**: Header del diálogo con información del nodo
- **Contenido**:
  - Ícono y color del nodo
  - Nombre y descripción del nodo
  - Botón de cerrar

### 3. `NodePropertiesSidebar.vue`

- **Propósito**: Navegación lateral entre secciones
- **Funcionalidades**:
  - Lista de secciones disponibles
  - Contador de propiedades por sección
  - Navegación entre secciones

### 4. `NodePropertiesSection.vue`

- **Propósito**: Sección principal de propiedades del nodo
- **Responsabilidades**:
  - Renderizar todas las propiedades visibles
  - Filtrar propiedades según la configuración `show`
  - Delegar el renderizado de cada propiedad al componente `NodePropertyInput`

### 5. `NodePropertyInput.vue`

- **Propósito**: Componente para renderizar un campo de propiedad individual
- **Tipos de input soportados**:
  - `string`: Campo de texto
  - `number`: Campo numérico con validaciones
  - `switch`: Toggle/checkbox
  - `options`: Select/dropdown
  - `textarea`: Área de texto multilínea
  - `code`: Editor de código (delegado a `NodeCodeEditor`)
  - `password`: Campo de contraseña

### 6. `NodeCodeEditor.vue` 🚀 ACTUALIZADO

- **Propósito**: Editor especializado para código con Monaco Editor
- **Características**:

  - ✨ **Monaco Editor**: Editor de VS Code en el navegador
  - 🎨 **Resaltado de sintaxis**: Para múltiples lenguajes
  - 🔍 **Validación en tiempo real**: JSON y otros formatos
  - 🌙 **Tema oscuro**: Interfaz moderna y elegante
  - 📝 **Autocompletado**: Características avanzadas de editor
  - 🔧 **Configurable**: A través del composable `useMonacoEditor`

- **Lenguajes soportados**:

  - `sql`: Para consultas de base de datos
  - `json`: Para configuraciones y datos estructurados
  - `javascript/js`: Para scripts y lógica
  - `typescript`: Para TypeScript
  - `python`: Para scripts de Python
  - `html/css`: Para contenido web
  - `xml`: Para documentos estructurados
  - `yaml`: Para archivos de configuración
  - `markdown`: Para documentación

- **Composable incluido**: `useMonacoEditor` para reutilización
- **Validación**: Automática para JSON, extensible para otros lenguajes

### 7. `NodeCredentialsSection.vue`

- **Propósito**: Sección de credenciales del nodo
- **Funcionalidades**:
  - Renderizado de campos de credenciales
  - Soporte para campos de contraseña
  - Validaciones requeridas

### 8. `NodeMetaSection.vue`

- **Propósito**: Sección de metadatos del nodo
- **Campos incluidos**:
  - ID del nodo (solo lectura)
  - Tipo del nodo (solo lectura)
  - Posición X (editable)
  - Posición Y (editable)

### 9. `NodePropertiesFooter.vue`

- **Propósito**: Footer con controles de acción
- **Botones**:
  - Cancelar: Cierra el diálogo sin guardar
  - Restablecer: Revierte las propiedades a valores por defecto
  - Guardar: Aplica los cambios (con indicador de carga)

## Ventajas de la Refactorización

### 🔧 **Mantenibilidad**

- Cada componente tiene una responsabilidad específica
- Más fácil de debuggear y testear
- Cambios aislados no afectan otros componentes

### 📖 **Legibilidad**

- Código más limpio y organizado
- Componentes pequeños y comprensibles
- Separación clara de responsabilidades

### 🔄 **Reutilización**

- Componentes pueden ser reutilizados en otros contextos
- Lógica específica encapsulada
- Interfaces bien definidas

### 🚀 **Escalabilidad**

- Fácil agregar nuevos tipos de propiedades
- Extensible para nuevas funcionalidades
- Arquitectura modular

## Comunicación entre Componentes

### Flujo de Datos

```
NodePropertiesDialog (Estado Principal)
    ↓ Props
┌─────────────────┐
│ Header/Sidebar  │
│ Footer          │
└─────────────────┘
    ↓ Props + Events
┌─────────────────┐
│ Sections        │
└─────────────────┘
    ↓ Props + Events
┌─────────────────┐
│ PropertyInput   │
│ CodeEditor      │
└─────────────────┘
```

### Eventos

- `@update:property`: Actualiza valor de propiedad
- `@update:credential`: Actualiza valor de credencial
- `@update:meta`: Actualiza metadatos
- `@section-change`: Cambia sección activa
- `@save/@cancel/@reset`: Acciones del footer

## Uso

El componente principal se usa igual que antes:

```vue
<NodePropertiesDialog
  :is-visible="showDialog"
  :node-data="selectedNode"
  @close="showDialog = false"
  @save="handleNodeSave"
/>
```

Los componentes internos son transparentes al usuario y se manejan automáticamente.
