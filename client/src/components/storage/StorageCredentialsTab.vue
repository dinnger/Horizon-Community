<template>
  <div class="card bg-base-200 shadow-xl  border border-base-300">
    <div class="card-body">
      <div class="flex justify-between">
        <h2 class="card-title mb-6">
          Credenciales
        </h2>
        <StorageCredentialsModal />
      </div>
      <div v-if="items.length === 0" class="text-center py-8">
        <div class="w-24 h-24 bg-base-300 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-12 h-12 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M3 7v4a1 1 0 001 1h3v2a1 1 0 001 1h3v2a1 1 0 001 1h3v2a1 1 0 001 1h3" />
          </svg>
        </div>
        <h3 class="text-lg font-semibold mb-2">No hay elementos</h3>
        <p class="text-base-content/70 mb-4">Agrega credenciales o archivos para comenzar</p>
        <button @click="$emit('showAddModal')" class="btn btn-primary">
          Nuevo elemento
        </button>
      </div>
      <div v-else class="overflow-x-auto">
        <table class="table">
          <thead>
            <tr>
              <th>Nodo</th>
              <th>Nombre</th>
              <th>Fecha</th>
              <th class="w-[120px]">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in items" :key="item.id" class="hover cursor-pointer">
              <td>
                <span class="material-icons">{{ item.node?.icon }} </span>
                {{ item.node?.name || 'N/A' }}
              </td>
              <td>
                <div class="flex items-center space-x-3">

                  <div>
                    <div class="font-bold">{{ item.name }}</div>
                    <div class="text-sm opacity-50">{{ item.description }}</div>
                  </div>
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
</template>

<script setup lang="ts">
import { defineProps, computed, ref, onMounted } from 'vue'
import StorageCredentialsModal from './StorageCredentialsModal.vue';
import { useStorageComposable } from '@/composables/useStorage.composable';
const items = ref<{ node: any, id: string; name: string; description: string; date: string }[]>([])



const useStorage = useStorageComposable()


onMounted(() => {
  useStorage.getStorages({ type: 'credential' }).then((response) => {
    console.log('Storage items fetched:', response)
    items.value = response.map((item: any) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      date: new Date(item.createdAt).toLocaleDateString('es-ES'),
      node: item.node || null
    }))
  }).catch(error => {
    console.error('Error fetching storage items:', error)
  })
  // Fetch initial data or perform setup actions
})


</script>
