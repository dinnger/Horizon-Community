# Horizon

**Plataforma de automatización y gestión de workflows distribuidos**

Horizon es una plataforma completa para el diseño, ejecución y monitoreo de workflows automatizados con soporte para múltiples entornos y despliegues distribuidos.

## 🌟 Características Principales

### ✨ Editor Visual de Workflows

- **Canvas Interactivo**: Editor de nodos tipo visual programming para diseñar workflows
- **Librería de Nodos**: Amplio catálogo de nodos reutilizables y personalizables
- **Conectores Visuales**: Sistema intuitivo para conectar nodos y definir flujos de datos
- **Previsualización en Tiempo Real**: Vista previa de la ejecución antes del despliegue

### 🔄 Sistema de Workers Distribuidos

- **Ejecución Aislada**: Cada workflow se ejecuta en procesos worker independientes
- **Escalabilidad Horizontal**: Soporte para múltiples workers simultáneos
- **Monitoreo en Tiempo Real**: Dashboard con métricas de CPU, memoria y estado
- **Comunicación Bidireccional**: Workers pueden solicitar información al servidor principal

### 🚀 Gestión de Despliegues

- **Versionado Semántico**: Control automático de versiones (patch, minor, major)
- **Pipelines de Aprobación**: Flujos de aprobación configurables
- **Múltiples Entornos**: Soporte para desarrollo, staging y producción
- **Rollback Automático**: Reversión automática en caso de fallos

### 🔐 Sistema de Autenticación y Permisos

- **Autenticación JWT**: Sistema seguro de tokens
- **Roles y Permisos**: Control granular de acceso por workspace/proyecto
- **Multi-tenant**: Soporte para múltiples organizaciones
- **Gestión de Usuarios**: Panel de administración completo

## 🏗️ Arquitectura

Horizon está construido con una arquitectura de microservicios moderna:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │  Backend API    │    │     Workers     │
│   (Vue.js)      │◄──►│  (Node.js)      │◄──►│   (Node.js)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                       │                       │
        │                       ▼                       │
        └─────────────► ┌─────────────────┐ ◄───────────┘
                        │   PostgreSQL    │
                        │    SQLite       │
                        └─────────────────┘
```

### Componentes

#### Frontend (`/client`)

- **Framework**: Vue.js 3 + TypeScript
- **Estado**: Pinia para gestión de estado
- **UI**: Tailwind CSS + Material Design Icons
- **Editor**: Monaco Editor para código
- **Canvas**: Sistema personalizado para editor visual

#### Backend (`/server`)

- **Framework**: Node.js + Express
- **Base de Datos**: Sequelize ORM (PostgreSQL/SQLite)
- **Comunicación**: Socket.IO para tiempo real
- **Autenticación**: JWT + bcrypt
- **Logging**: Winston para logs estructurados

#### Workers (`/worker`)

- **Ejecución**: Procesos Node.js independientes
- **Aislamiento**: Sandboxing con @nyariv/sandboxjs
- **Comunicación**: IPC con el servidor principal
- **Monitoreo**: Métricas de rendimiento en tiempo real

#### Shared (`/shared`)

- **Interfaces**: TypeScript interfaces compartidas
- **Plugins**: Sistema de plugins extensible
- **Utilidades**: Funciones comunes entre componentes

## 🚀 Instalación y Configuración

### Prerrequisitos

- Node.js 18+
- npm o yarn
- PostgreSQL (opcional, usa SQLite por defecto)

### Instalación

1. **Clonar el repositorio**

```bash
git clone <repository-url>
cd Horizon
```

2. **Instalar dependencias**

```bash
npm install
```

3. **Configurar variables de entorno**

```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar configuraciones necesarias
nano .env
```

### Desarrollo

#### Servidor de desarrollo

```bash
# Backend API
npm run start

# Frontend (en otra terminal)
cd client
npm run dev --ws
```

### Producción

```bash
# Construir el proyecto
npm run build

# Iniciar en producción
npm start
```

## 📊 Monitoreo y Logs

### Dashboard de Workers

- Acceso a `/workers` en la interfaz web
- Métricas en tiempo real de CPU y memoria
- Estado de ejecución de workflows
- Logs de errores y actividad

### Sistema de Logs

Los logs se almacenan en `/logs` organizados por workflow:

- `info.log` - Información general
- `error.log` - Errores y excepciones

## 🔧 Configuración Avanzada

### Base de Datos

Por defecto usa SQLite (`database.sqlite`), pero soporta PostgreSQL para producción.

### Workers

- Puerto base: 3001 (se asignan automáticamente)
- Timeout: Configurable por workflow
- Límites de memoria: Configurables

### Autenticación

- JWT secret configurable
- Expiración de tokens personalizable
- Soporte para refresh tokens

## 📝 Estructura de Directorios

```
Horizon/
├── client/           # Frontend Vue.js
│   ├── canvas/       # Editor visual de workflows
│   ├── src/          # Código fuente del cliente
│   └── public/       # Archivos estáticos
├── server/           # Backend Node.js
│   └── src/          # API, rutas, servicios
├── worker/           # Sistema de workers
├── shared/           # Código compartido
│   ├── interfaces/   # Tipos TypeScript
│   └── plugins/      # Sistema de plugins
├── data/             # Datos de workflows y despliegues
├── docs/             # Documentación técnica
└── logs/             # Archivos de log
```

## 🤝 Contribución

1. Fork el proyecto
2. Crear rama para feature (`git checkout -b feature/AmazingFeature`)
3. Commit los cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia ISC. Ver el archivo `LICENSE` para más detalles.

---

**Desarrollado con ❤️ para automatizar tus workflows**
