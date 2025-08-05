<template>
  <div class="p-8 bg-base-100 min-h-screen">
    <div class="max-w-6xl mx-auto">
      <!-- Header -->
      <div class="flex items-center space-x-4 mb-8">
        <div class="flex-1">
          <h1 class="text-3xl font-bold text-primary">Gestión de Storage</h1>
          <p class="text-base-content/70 -mt-1">Credenciales, archivos y datos encriptados almacenados en el servidor
          </p>
        </div>

      </div>

      <StorageStats :stats="stats" />

      <StorageTabs :activeTab="activeTab" @update:activeTab="activeTab = $event" />

      <StorageCredentialsTab v-if="activeTab === 'credenciales'" @showAddModal="showAddModal = true" />

      <StorageFilesTab v-if="activeTab === 'archivos'" :items="items" :activeTab="activeTab"
        @showAddModal="showAddModal = true" />

      <StorageEnvTab v-if="activeTab === 'env'" :envVars="envVars" />

      <StorageArtifactsTab v-if="activeTab === 'artefactos'" :artifacts="artifacts" />

      <StorageLogsTab v-if="activeTab === 'logs'" :logs="logs" />

      <StorageHistoryTab v-if="activeTab === 'historial'" :history="history" />

      <!-- <StorageAddItemModal :showAddModal="showAddModal" :newItem="newItem" @close="showAddModal = false"
        @addItem="addItem" /> -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import StorageStats from '../components/storage/StorageStats.vue'
import StorageTabs from '../components/storage/StorageTabs.vue'
import StorageEnvTab from '../components/storage/StorageEnvTab.vue'
import StorageArtifactsTab from '../components/storage/StorageArtifactsTab.vue'
import StorageLogsTab from '../components/storage/StorageLogsTab.vue'
import StorageHistoryTab from '../components/storage/StorageHistoryTab.vue'
import StorageAddItemModal from '../components/storage/StorageAddItemModal.vue'
import StorageCredentialsTab from '@/components/storage/StorageCredentialsTab.vue'
import StorageFilesTab from '@/components/storage/StorageFilesTab.vue'

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

// La lógica de filtrado ahora está en StorageItemsTable

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
