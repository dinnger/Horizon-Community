<template>
  <div class="bg-base-200 rounded-box mb-1 ">
    <div class="tabs tabs-boxed  ">
      <a @click="$emit('update:activeTab', 'credenciales')"
        :class="['tab', activeTab === 'credenciales' ? 'tab-active' : '']">
        Credenciales
      </a>
      <a @click="$emit('update:activeTab', 'archivos')" :class="['tab', activeTab === 'archivos' ? 'tab-active' : '']">
        Archivos
      </a>
      <a @click="$emit('update:activeTab', 'env')" :class="['tab', activeTab === 'env' ? 'tab-active' : '']">
        Variables de entorno
      </a>
      <a @click="$emit('update:activeTab', 'artefactos')"
        :class="['tab', activeTab === 'artefactos' ? 'tab-active' : '']">
        Artefactos
      </a>
      <a @click="$emit('update:activeTab', 'logs')" :class="['tab', activeTab === 'logs' ? 'tab-active' : '']">
        Logs
      </a>
      <a @click="$emit('update:activeTab', 'historial')"
        :class="['tab', activeTab === 'historial' ? 'tab-active' : '']">
        Historial
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps } from 'vue'
const props = defineProps<{ activeTab: string }>()
</script>
