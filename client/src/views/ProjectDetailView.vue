<template>
  <div class="p-8 bg-base-100 min-h-screen">
    <div class="max-w-6xl mx-auto" v-if="projectData">
      <!-- Header -->
      <div class="flex items-center space-x-4 mb-8">
        <button @click="$router.go(-1)" class="btn btn-ghost btn-circle">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <div class="flex-1">
          <h1 class="text-3xl font-bold text-primary">{{ projectData?.name }}</h1>
          <p class="text-base-content/70 -mt-1">{{ projectData?.description }}</p>

          <!-- Transport Info -->
          <div v-if="projectData?.transportType && projectData.transportType !== 'none'">
            <div class="flex items-center space-x-3 text-sm">
              <div class="badge badge-info badge-sm">
                {{ getTransportLabel(projectData.transportType) }}
              </div>

            </div>
          </div>
        </div>
        <div class="flex space-x-2">
          <button @click="showWorkflowModal = true" class="btn btn-primary">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Workflow
          </button>

        </div>
      </div>

      <!-- Project Stats -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="stat bg-base-200 rounded-box shadow-lg backdrop-blur-sm">
          <div class="stat-figure text-primary">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div class="stat-title">Workflows</div>
          <div class="stat-value text-primary">{{ workflows.length }}</div>
          <div class="stat-desc">{{ activeWorkflows }} activos</div>
        </div>

        <div class="stat bg-base-200 rounded-box shadow-lg backdrop-blur-sm">
          <div class="stat-figure text-secondary">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div class="stat-title">Ejecuciones</div>
          <div class="stat-value text-secondary">{{ projectStats.executions }}</div>
          <div class="stat-desc">↗︎ 12% más que ayer</div>
        </div>

        <div class="stat bg-base-200 rounded-box shadow-lg backdrop-blur-sm">
          <div class="stat-figure text-success">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="stat-title">Éxito</div>
          <div class="stat-value text-success">{{ projectStats.successRate }}%</div>
          <div class="stat-desc">Tasa de éxito</div>
        </div>

        <div class="stat bg-base-200 rounded-box shadow-lg backdrop-blur-sm">
          <div class="stat-figure text-info">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="stat-title">Tiempo Promedio</div>
          <div class="stat-value text-info">{{ projectStats.avgDuration }}</div>
          <div class="stat-desc">Por ejecución</div>
        </div>
      </div>


      <!-- Workflows List -->
      <div class="card bg-base-200 shadow-xl backdrop-blur-sm border border-base-300">
        <div class="card-body">
          <h2 class="card-title mb-6">Workflows del Proyecto</h2>

          <div v-if="workflows.length === 0" class="text-center py-8">
            <div class="w-24 h-24 bg-base-300 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-12 h-12 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold mb-2">No hay workflows</h3>
            <p class="text-base-content/70 mb-4">Crea tu primer workflow para este proyecto</p>
            <button @click="showWorkflowModal = true" class="btn btn-primary">
              Crear Workflow
            </button>
          </div>

          <div v-else class="overflow-x-auto">
            <table class="table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Estado</th>
                  <th>Última Ejecución</th>
                  <th>Duración</th>
                  <th class="w-[120px]">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="workflow in workflows" :key="workflow.id" class="hover cursor-pointer"
                  @click="editWorkflow(workflow)">
                  <td>
                    <div class="flex items-center space-x-3">
                      <div :class="['w-3 h-3 rounded-full', getStatusColor(workflow.status)]"></div>
                      <div>
                        <div class="font-bold">{{ workflow.name }}</div>
                        <div class="text-sm opacity-50">{{ workflow.description }}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div :class="['badge', getStatusBadge(workflow.status)]">
                      {{ workflow.status }}
                    </div>
                  </td>
                  <td>{{ formatDate(workflow.lastRun) }}</td>
                  <td>{{ workflow.duration }}</td>
                  <td>
                    <div class="flex space-x-2" @click.stop>
                      <button @click="runWorkflow(workflow.id)" class="btn btn-sm btn-outline btn-primary">
                        Ejecutar
                      </button>
                      <button @click="viewWorkflowDetail(workflow.id)" class="btn btn-sm btn-outline btn-ghost">
                        Detalle
                      </button>
                      <button @click="deleteWorkflow(workflow.id)" class="btn btn-sm btn-outline btn-error">
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Create Workflow Modal -->

      <WorkflowModal :show-workflow-modal="showWorkflowModal" @close="loadWorkflows(); showWorkflowModal = false" />

    </div>
    <div v-else class="text-center py-8">
      <div class="w-24 h-24 bg-base-300 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg class="w-12 h-12 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </div>
      <h3 class="text-lg font-semibold mb-2">El proyecto no existe</h3>
      <p class="text-base-content/70 mb-4">Revisa que el ID del proyecto sea correcto</p>
      <router-link to="/projects" class="btn btn-primary">
        Volver a proyectos
      </router-link>

    </div>

  </div>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { ref, reactive, computed, onMounted } from 'vue'
import { useWorkflowsComposable, type Workflow } from '@/composables/useWorkflows.composable'
import { useProjectWorkflows } from '@/composables/useProjectWorkflows'
import type { IProjectClient } from '@shared/interfaces/project/project.interface'
import WorkflowModal from '@/components/workflow/workflowModal.vue'


const route = useRoute()
const router = useRouter()
const showWorkflowModal = ref(false)

const projectComposable = useProjectWorkflows({ projectId: route.params.id as string })


const projectData = ref<IProjectClient | null>(null)
const workflows = projectComposable.workflows.workflows
const activeWorkflows = projectComposable.workflows.getActiveWorkflowsCount
const projectStats = projectComposable.workflows.getWorkflowStats




const runWorkflow = (workflowId: string) => {
  // projectComposable.workflows.runWorkflow(workflowId)
}

const editWorkflow = (workflow: Workflow) => {
  router.push(`/projects/${workflow.id}/canvas`)
}

const deleteWorkflow = (workflowId: string) => {
  const confirmMessage = '¿Estás seguro de que quieres eliminar este workflow?'
  if (confirm(confirmMessage)) {
    projectComposable.workflows.deleteWorkflow(workflowId)
  }
}

const viewWorkflowDetail = (workflowId: string) => {
  router.push(`/projects/${route.params.id as string}/workflows/${workflowId}`)
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'success': return 'bg-success'
    case 'running': return 'bg-warning'
    case 'failed': return 'bg-error'
    default: return 'bg-base-300'
  }
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'success': return 'badge-success'
    case 'running': return 'badge-warning'
    case 'failed': return 'badge-error'
    default: return 'badge-ghost'
  }
}

const formatDate = (date: Date) => {
  return date.toLocaleString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getTransportLabel = (transportType: string) => {
  const labels: Record<string, string> = {
    none: 'Sin transporte',
    tcp: 'TCP',
    rabbitmq: 'RabbitMQ',
    kafka: 'Kafka',
    nats: 'NATS',
    http: 'HTTP',
    websocket: 'WebSocket',
    mqtt: 'MQTT'
  }
  return labels[transportType] || transportType.toUpperCase()
}

const loadWorkflows = () => {
  projectComposable.workflows.loadWorkflows()
}

onMounted(() => {
  loadWorkflows()
  projectComposable.getProjectById().then((project) => {
    projectData.value = project
  })
})


</script>
