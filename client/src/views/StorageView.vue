<template>
  <div class="p-8 bg-base-100 min-h-screen">
    <div class="max-w-6xl mx-auto">
      <!-- Header -->
      <div class="flex items-center space-x-4 mb-8">
        <button @click="$router.go(-1)" class="btn btn-ghost btn-circle">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <div class="flex-1">
          <h1 class="text-3xl font-bold text-primary">Gestión de Storage</h1>
          <p class="text-base-content/70 -mt-1">Credenciales, archivos y datos encriptados almacenados en el servidor
          </p>
        </div>
        <div class="flex space-x-2">
          <button class="btn btn-primary" @click="showAddModal = true">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Nuevo elemento
          </button>
        </div>
      </div>

      <!-- Storage Stats -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="stat bg-base-200 rounded-box shadow-lg backdrop-blur-sm">
          <div class="stat-figure text-primary">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M3 7v4a1 1 0 001 1h3v2a1 1 0 001 1h3v2a1 1 0 001 1h3v2a1 1 0 001 1h3" />
            </svg>
          </div>
          <div class="stat-title">Credenciales</div>
          <div class="stat-value text-primary">{{ stats.credentials }}</div>
          <div class="stat-desc">Guardadas</div>
        </div>
        <div class="stat bg-base-200 rounded-box shadow-lg backdrop-blur-sm">
          <div class="stat-figure text-secondary">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M4 8V7a2 2 0 012-2h12a2 2 0 012 2v1M16 12H8" />
            </svg>
          </div>
          <div class="stat-title">Archivos</div>
          <div class="stat-value text-secondary">{{ stats.files }}</div>
          <div class="stat-desc">Subidos</div>
        </div>
        <div class="stat bg-base-200 rounded-box shadow-lg backdrop-blur-sm">
          <div class="stat-figure text-success">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 17v-5m0 0V7m0 5h5m-5 0H7" />
            </svg>
          </div>
          <div class="stat-title">Elementos protegidos</div>
          <div class="stat-value text-success">{{ stats.protectedItems }}</div>
          <div class="stat-desc">Cifrados y seguros</div>
        </div>
        <div class="stat bg-base-200 rounded-box shadow-lg backdrop-blur-sm">
          <div class="stat-figure text-info">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <div class="stat-title">Uso de espacio</div>
          <div class="stat-value text-info">{{ stats.spaceUsed }}</div>
          <div class="stat-desc">Total</div>
        </div>
      </div>

      <!-- Tabs Navigation -->
      <div class="tabs tabs-boxed mb-6">
        <a @click="activeTab = 'credenciales'" :class="['tab', activeTab === 'credenciales' ? 'tab-active' : '']">
          Credenciales
        </a>
        <a @click="activeTab = 'archivos'" :class="['tab', activeTab === 'archivos' ? 'tab-active' : '']">
          Archivos
        </a>
        <a @click="activeTab = 'env'" :class="['tab', activeTab === 'env' ? 'tab-active' : '']">
          Variables de entorno
        </a>
        <a @click="activeTab = 'artefactos'" :class="['tab', activeTab === 'artefactos' ? 'tab-active' : '']">
          Artefactos
        </a>
        <a @click="activeTab = 'logs'" :class="['tab', activeTab === 'logs' ? 'tab-active' : '']">
          Logs
        </a>
        <a @click="activeTab = 'historial'" :class="['tab', activeTab === 'historial' ? 'tab-active' : '']">
          Historial
        </a>
      </div>

      <!-- Storage Items Table -->
      <div v-if="activeTab === 'credenciales' || activeTab === 'archivos'"
        class="card bg-base-200 shadow-xl backdrop-blur-sm border border-base-300">
        <div class="card-body">
          <h2 class="card-title mb-6">
            Elementos almacenados -
            <span v-if="activeTab === 'credenciales'">Credenciales</span>
            <span v-else-if="activeTab === 'archivos'">Archivos</span>
          </h2>
          <div v-if="filteredItems.length === 0" class="text-center py-8">
            <div class="w-24 h-24 bg-base-300 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-12 h-12 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M3 7v4a1 1 0 001 1h3v2a1 1 0 001 1h3v2a1 1 0 001 1h3v2a1 1 0 001 1h3" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold mb-2">No hay elementos</h3>
            <p class="text-base-content/70 mb-4">Agrega credenciales o archivos para comenzar</p>
            <button @click="showAddModal = true" class="btn btn-primary">
              Nuevo elemento
            </button>
          </div>
          <div v-else class="overflow-x-auto">
            <table class="table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Tipo</th>
                  <th>Fecha</th>
                  <th class="w-[120px]">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in filteredItems" :key="item.id" class="hover cursor-pointer">
                  <td>
                    <div class="flex items-center space-x-3">
                      <div
                        :class="['w-3 h-3 rounded-full', item.type === 'credencial' ? 'bg-primary' : 'bg-secondary']">
                      </div>
                      <div>
                        <div class="font-bold">{{ item.name }}</div>
                        <div class="text-sm opacity-50">{{ item.description }}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div :class="['badge', item.type === 'credencial' ? 'badge-primary' : 'badge-secondary']">
                      {{ item.type }}
                    </div>
                  </td>
                  <td>{{ item.date }}</td>
                  <td>
                    <div class="flex space-x-2" @click.stop>
                      <button class="btn btn-xs btn-primary">Ver</button>
                      <button class="btn btn-xs btn-ghost">Editar</button>
                      <button class="btn btn-xs btn-error">Eliminar</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Variables de entorno Tab -->
      <div v-if="activeTab === 'env'" class="card bg-base-200 shadow-xl mb-8">
        <div class="card-body">
          <h2 class="card-title mb-6">Variables de entorno</h2>
          <table class="table table-sm">
            <thead>
              <tr>
                <th>Variable</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(value, key) in envVars" :key="key">
                <td class="font-mono text-sm">{{ key }}</td>
                <td class="font-mono text-sm">{{ value }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Artefactos Tab -->
      <div v-if="activeTab === 'artefactos'" class="card bg-base-200 shadow-xl mb-8">
        <div class="card-body">
          <h2 class="card-title mb-6">Artefactos generados</h2>
          <div v-if="artifacts.length === 0" class="text-center py-8">
            <div class="w-24 h-24 bg-base-300 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-12 h-12 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold mb-2">No hay artefactos</h3>
            <p class="text-base-content/70 mb-4">Aún no se han generado artefactos</p>
          </div>
          <div v-else class="space-y-2">
            <div v-for="artifact in artifacts" :key="artifact.id"
              class="flex items-center justify-between p-3 bg-base-300 rounded">
              <div class="flex items-center space-x-3">
                <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <div>
                  <div class="font-semibold">{{ artifact.name }}</div>
                  <div class="text-xs text-base-content/60">{{ artifact.type }} • {{ artifact.size }}</div>
                </div>
              </div>
              <button class="btn btn-xs btn-primary">Descargar</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Logs Tab -->
      <div v-if="activeTab === 'logs'" class="card bg-base-200 shadow-xl mb-8">
        <div class="card-body">
          <h2 class="card-title mb-6">Logs</h2>
          <div class="log-terminal p-4 rounded font-mono text-sm max-h-96 overflow-y-auto">
            <div v-for="log in logs" :key="log.id" class="flex items-start space-x-3 py-1">
              <span class="text-gray-500 text-xs whitespace-nowrap">{{ log.timestamp }}</span>
              <span class="px-2 py-1 rounded text-xs font-bold bg-base-300">{{ log.level }}</span>
              <span class="flex-1">{{ log.message }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Historial Tab -->
      <div v-if="activeTab === 'historial'" class="card bg-base-200 shadow-xl mb-8">
        <div class="card-body">
          <h2 class="card-title mb-6">Historial de cambios</h2>
          <table class="table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Acción</th>
                <th>Usuario</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="event in history" :key="event.id">
                <td>{{ event.date }}</td>
                <td>{{ event.action }}</td>
                <td>{{ event.user }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Add Item Modal -->
      <div v-if="showAddModal" class="modal modal-open">
        <div class="modal-box">
          <h3 class="font-bold text-lg mb-4">Agregar nuevo elemento</h3>
          <form @submit.prevent="addItem">
            <div class="form-control mb-4">
              <label class="label">
                <span class="label-text">Nombre</span>
              </label>
              <input v-model="newItem.name" type="text" placeholder="Nombre" class="input input-bordered w-full"
                required />
            </div>
            <div class="form-control mb-4">
              <label class="label">
                <span class="label-text">Descripción</span>
              </label>
              <textarea v-model="newItem.description" class="textarea textarea-bordered h-20"
                placeholder="Descripción..."></textarea>
            </div>
            <div class="form-control mb-6">
              <label class="label">
                <span class="label-text">Tipo</span>
              </label>
              <select v-model="newItem.type" class="select select-bordered w-full">
                <option value="credencial">Credencial</option>
                <option value="archivo">Archivo</option>
              </select>
            </div>
            <div class="modal-action">
              <button type="button" @click="showAddModal = false" class="btn">Cancelar</button>
              <button type="submit" class="btn btn-primary">Agregar</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'

const showAddModal = ref(false)
const activeTab = ref('credenciales')

const stats = reactive({
  credentials: 5,
  files: 12,
  protectedItems: 9,
  spaceUsed: '1.2 GB'
})

const items = ref([
  { id: 1, name: 'API Key Producción', description: 'Clave para el entorno productivo', type: 'credencial', date: '2024-06-09' },
  { id: 2, name: 'Certificado SSL', description: 'Archivo de certificado', type: 'archivo', date: '2024-06-08' },
  { id: 3, name: 'Token GitHub', description: 'Acceso a repositorios', type: 'credencial', date: '2024-06-07' },
  { id: 4, name: 'Backup DB', description: 'Archivo de respaldo', type: 'archivo', date: '2024-06-06' }
])

const filteredItems = computed(() =>
  items.value.filter(item =>
    activeTab.value === 'credenciales'
      ? item.type === 'credencial'
      : item.type === 'archivo'
  )
)

const newItem = reactive({
  name: '',
  description: '',
  type: 'credencial'
})

const addItem = () => {
  items.value.push({
    id: Date.now(),
    name: newItem.name,
    description: newItem.description,
    type: newItem.type,
    date: new Date().toISOString().slice(0, 10)
  })
  newItem.name = ''
  newItem.description = ''
  newItem.type = 'credencial'
  showAddModal.value = false
}

// Dummy data for new tabs
const envVars = reactive({
  NODE_ENV: 'production',
  API_URL: 'https://api.example.com',
  SECRET_KEY: '************'
})

const artifacts = ref([
  { id: 1, name: 'build.zip', type: 'zip', size: '2.3 MB' },
  { id: 2, name: 'report.pdf', type: 'pdf', size: '800 KB' }
])

const logs = ref([
  { id: 1, timestamp: '2024-06-10 14:23:01', level: 'info', message: 'Archivo subido correctamente.' },
  { id: 2, timestamp: '2024-06-10 14:24:10', level: 'warning', message: 'La credencial expirará pronto.' },
  { id: 3, timestamp: '2024-06-10 14:25:00', level: 'error', message: 'Error al eliminar archivo.' }
])

const history = ref([
  { id: 1, date: '2024-06-09', action: 'Subió archivo', user: 'admin' },
  { id: 2, date: '2024-06-08', action: 'Agregó credencial', user: 'jose' },
  { id: 3, date: '2024-06-07', action: 'Eliminó archivo', user: 'admin' }
])
</script>

<style scoped>
/* Los estilos están ahora manejados por las clases de DaisyUI */
.log-terminal {
  background: #0d1117;
  color: #c9d1d9;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  border-radius: 8px;
  border: 1px solid #30363d;
}
</style>
