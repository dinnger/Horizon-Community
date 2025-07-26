  <template>
    <div class="modal modal-open">
      <div class="modal-box">
        <h3 class="font-bold text-lg mb-4">Seleccionar Versión para Ejecutar</h3>

        <div class="form-control">
          <label class="label">
            <span class="label-text">Versiones Disponibles:</span>
          </label>
          <div class="max-h-60 overflow-y-auto border-2 border-base-300">
            <div v-for="version in availableVersions" :key="version.version"
              class="flex items-center p-2 hover:bg-base-200 rounded cursor-pointer"
              :class="{ 'bg-primary border border-primary': selectedVersion === version.version }"
              @click="selectVersion(version.version)">

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
          <button class="btn btn-primary" @click="executeSelectedVersion" :disabled="!selectedVersion">
            <span class="mdi mdi-play"></span>
            Ejecutar Versión
          </button>
          <button class="btn" @click="canvasStore.showSelectedVersion = false">Cancelar</button>
        </div>
      </div>
    </div>
  </template>

<script setup lang="ts">
import { useWorkerComposable } from '@/composables/useWorker.composable'
import { useWorkflowsComposable } from '@/composables/useWorkflows.composable'
import { useCanvas } from '@/stores'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'

const canvasStore = useCanvas()
const router = useRouter()

interface Version {
  version: string
  isCurrent?: boolean
  changeType: string
  changeDescription: string
  createdAt: string
}

const props = defineProps<{
  workflowId: string
}>()

const workerComposable = useWorkerComposable()
const workflowComposable = useWorkflowsComposable()

const availableVersions = ref<Version[]>([])
const selectedVersion = ref<string | null>(null)


const selectVersion = (version: string) => {
  selectedVersion.value = version
}

const executeSelectedVersion = async () => {
  if (!selectedVersion.value) {
    toast.error('Por favor selecciona una versión') // TODO: Traducir                 
    return
  }
  workerComposable.executeWorkflow({ workflowId: props.workflowId, version: selectedVersion.value })
  canvasStore.showSelectedVersion = false
}


onMounted(async () => {
  const data = await workflowComposable.getVersions({ workflowId: props.workflowId })
  if (data.success) {
    availableVersions.value = data.versions
  }
})

</script>
