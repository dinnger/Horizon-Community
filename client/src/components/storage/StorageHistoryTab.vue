<template>
  <div class="card bg-base-200 shadow-xl mb-8">
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
</template>

<script setup lang="ts">
import { defineProps } from 'vue'
const props = defineProps<{ history: any[] }>()
</script>
