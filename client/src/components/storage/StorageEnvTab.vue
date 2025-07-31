<template>
  <div class="card bg-base-200 shadow-xl mb-8">
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
</template>

<script setup lang="ts">
import { defineProps } from 'vue'
const props = defineProps<{ envVars: Record<string, string> }>()
</script>
