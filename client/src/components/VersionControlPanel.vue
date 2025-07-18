<template>
  <div>
    <div class="drawer drawer-end">
      <input id="my-drawer-4" type="checkbox" class="drawer-toggle " />
      <div class="drawer-content">
        <!-- Page content here -->
        <label for="my-drawer-4" class="drawer-button btn btn-sm btn-default" @click="loadHistory()">
          <span class="mdi mdi-history"></span>
          Historial
        </label>
      </div>
      <div class="drawer-side">
        <label for="my-drawer-4" aria-label="close sidebar" class="drawer-overlay"></label>
        <div class="menu bg-base-200 text-base-content min-h-full w-80 p-4">
          <button class="btn btn-sm btn-primary" @click="canvasStore.clearHistory()">
            Limpiar Cambios
          </button>
          <div class="divider my-2"></div>
          <div class="btn btn-ghost mb-2" v-for="workflow in history" :key="workflow.version"
            @click="canvasStore.selectHistory(workflow.version)">
            <div class="flex-1 min-w-0">
              <div class="flex items-center space-x-2">
                <span class="font-medium text-sm truncate">{{ workflow.version }}</span>
              </div>
              <p class="text-xs opacity-70 truncate">{{ workflow.timestamp }}</p>
            </div>

          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useCanvas } from '@/stores'
import { onMounted } from 'vue';

const canvasStore = useCanvas()
const history = ref()

const loadHistory = () => {
  history.value = canvasStore.getHistory()
  console.log(history.value)
}

</script>