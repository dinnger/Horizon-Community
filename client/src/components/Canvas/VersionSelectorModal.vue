  <template>
    <div v-if="isVisible" class="modal modal-open">
      <div class="modal-box">
        <h3 class="font-bold text-lg mb-4">Seleccionar Versión para Ejecutar</h3>

        <div class="form-control">
          <label class="label">
            <span class="label-text">Versiones Disponibles:</span>
          </label>
          <div class="max-h-60 overflow-y-auto">
            <div v-for="version in availableVersions" :key="version.version"
              class="flex items-center p-2 hover:bg-base-200 rounded cursor-pointer"
              @click="$emit('selectVersion', version.version)">
              <input type="radio" :value="version.version" :checked="selectedVersion === version.version"
                class="radio radio-primary mr-3">
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <span class="font-mono text-sm">{{ version.version }}</span>
                  <span v-if="version.isCurrent" class="badge badge-primary badge-xs">Actual</span>
                  <span class="badge badge-outline badge-xs">{{ version.changeType }}</span>
                </div>
                <p class="text-xs text-base-content/60">{{ version.changeDescription }}</p>
                <p class="text-xs text-base-content/40">{{ new Date(version.createdAt).toLocaleString() }}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-action">
          <button class="btn btn-primary" @click="$emit('executeSelectedVersion')" :disabled="!selectedVersion">
            <span class="mdi mdi-play"></span>
            Ejecutar Versión
          </button>
          <button class="btn" @click="$emit('close')">Cancelar</button>
        </div>
      </div>
    </div>
  </template>

<script setup lang="ts">
interface Version {
  version: string
  isCurrent?: boolean
  changeType: string
  changeDescription: string
  createdAt: string
}

interface Props {
  isVisible: boolean
  availableVersions: Version[]
  selectedVersion: string | null
}

defineProps<Props>()

defineEmits<{
  selectVersion: [version: string]
  executeSelectedVersion: []
  close: []
}>()
</script>
