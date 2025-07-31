<template>
  <div class="card bg-base-200 shadow-xl backdrop-blur-sm border border-base-300">
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
        <button @click="$emit('showAddModal')" class="btn btn-primary">
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
                  <div :class="['w-3 h-3 rounded-full', item.type === 'credencial' ? 'bg-primary' : 'bg-secondary']">
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
</template>

<script setup lang="ts">
import { defineProps, computed } from 'vue'
const props = defineProps<{ items: any[], activeTab: string }>()
const filteredItems = computed(() =>
  props.items.filter(item =>
    props.activeTab === 'credenciales'
      ? item.type === 'credencial'
      : item.type === 'archivo'
  )
)
</script>
