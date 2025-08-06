<template>
  <div class="p-8 bg-base-100 min-h-screen">
    <div class="max-w-6xl mx-auto">
      <!-- Header Mejorado -->
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-primary">Proyectos</h1>
          <p class="text-base-content/70 mt-2">Administra tus proyectos, workflows y microservicios</p>
        </div>
        <button class="btn btn-primary" @click="showCreateModal = true">
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Proyecto
        </button>
      </div>

      <!-- Estadísticas Generales -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="stat bg-base-200 rounded-box shadow-lg backdrop-blur-sm">
          <div class="stat-figure text-primary">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div class="stat-title">Proyectos</div>
          <div class="stat-value text-primary">{{ projectsWithWorkflows.length }}</div>
          <div class="stat-desc">Totales</div>
        </div>
        <div class="stat bg-base-200 rounded-box shadow-lg backdrop-blur-sm">
          <div class="stat-figure text-secondary">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div class="stat-title">Workflows</div>
          <div class="stat-value text-secondary">{{ totalWorkflows }}</div>
          <div class="stat-desc">En todos los proyectos</div>
        </div>
        <div class="stat bg-base-200 rounded-box shadow-lg backdrop-blur-sm">
          <div class="stat-figure text-success">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="stat-title">Activos</div>
          <div class="stat-value text-success">{{ activeProjects }}</div>
          <div class="stat-desc">Proyectos activos</div>
        </div>
      </div>

      <!-- Projects Table -->
      <div class="card bg-base-200 shadow-xl backdrop-blur-sm border border-base-300 mb-8">
        <div class="card-body">
          <h2 class="card-title mb-6">Listado de Proyectos</h2>
          <div v-if="projectsWithWorkflows.length === 0 && !projectComposable.showEmptyState" class="text-center py-8">
            <span class="loading loading-spinner mr-2"></span> Cargando proyectos...
          </div>
          <div v-else-if="projectsWithWorkflows.length === 0 && projectComposable.showEmptyState"
            class="text-center py-8">
            <ProjectsEmptyState @create-project="showCreateModal = true" />
          </div>
          <div v-else class="overflow-x-auto">
            <table class="table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Descripción</th>
                  <th>Estado</th>
                  <th>Transporte</th>
                  <th>Workflows</th>
                  <th class="w-[120px]">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="project in projectsWithWorkflows" :key="project.id" class="hover cursor-pointer"
                  @click="goToProject(project.id)">
                  <td>
                    <div class="font-bold text-primary">{{ project.name }}</div>
                  </td>
                  <td>
                    <div class="text-base-content/70">{{ project.description }}</div>
                  </td>
                  <td>
                    <div
                      :class="['badge badge-outline', project.status === 'active' ? 'badge-success' : 'badge-ghost']">
                      {{ project.status === 'active' ? 'Activo' : 'Inactivo' }}
                    </div>
                  </td>
                  <td>
                    <div class="badge badge-info badge-sm badge-outline">{{ project.transportType?.toUpperCase() ||
                      'Sin transporte'
                    }}</div>
                  </td>
                  <td>
                    <div class="badge badge-secondary badge-outline">
                      {{ project.workflows?.length || 0 }} workflows
                    </div>
                  </td>
                  <td>
                    <div class="flex space-x-2" @click.stop>
                      <button @click="editProject(project)" class="btn btn-sm btn-outline btn-ghost">Editar</button>
                      <button @click="deleteProject(project.id)"
                        class="btn btn-sm btn-outline btn-error ">Eliminar</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Create Project Modal -->
      <ProjectModal :is-open="showCreateModal" @close="showCreateModal = false" @submit="createProject" />

      <!-- Edit Project Modal -->
      <ProjectModal :is-open="showEditModal" :is-edit="true" :project="editingProject" @close="closeModal"
        @submit="updateProject" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectComposable } from '@/composables/useProjects.composable'

// Import new components
import {
  ProjectsEmptyState,
  ProjectModal
} from '@/components/projects'
import type { IProjectClient, IProjectTransportConfig } from '@shared/interfaces/standardized'
import { toast } from 'vue-sonner'

const router = useRouter()
const projectComposable = useProjectComposable()
const showCreateModal = ref(false)
const showEditModal = ref(false)
const editingProject = ref<IProjectClient | null>(null)

// Obtener proyectos con información de workflows
const projectsWithWorkflows = projectComposable.getProjectsWithWorkflows

const totalWorkflows = computed(() =>
  projectsWithWorkflows.value.reduce((acc, p) => {
    const workflows = Array.isArray(p.workflows) ? p.workflows : []
    return acc + workflows.length
  }, 0)
)
const activeProjects = computed(() =>
  projectsWithWorkflows.value.filter(p => p.status === 'active').length
)

const goToProject = (projectId: string) => {
  router.push(`/projects/${projectId}`)
}

const createProject = (data: {
  name: string
  description: string
  transportType?: 'none' | 'tcp' | 'rabbitmq' | 'kafka' | 'nats' | 'http' | 'websocket' | 'mqtt'
  transportConfig: IProjectTransportConfig
  deploymentId?: string | null
  deploymentConfiguration?: Record<string, any>
}) => {
  projectComposable.createProject({
    name: data.name,
    description: data.description,
    status: 'active',
    transportType: data.transportType,
    transportConfig: data.transportConfig,
    deploymentId: data.deploymentId,
    deploymentConfiguration: data.deploymentConfiguration
  } as any)

  showCreateModal.value = false
}

const editProject = (project: IProjectClient) => {
  editingProject.value = project
  showEditModal.value = true
}

const updateProject = (data: {
  name: string
  description: string
  transportType?: 'none' | 'tcp' | 'rabbitmq' | 'kafka' | 'nats' | 'http' | 'websocket' | 'mqtt'
  transportConfig: IProjectTransportConfig
  deploymentId?: string | null
  deploymentConfiguration?: Record<string, any>
}) => {
  if (!editingProject.value) return

  projectComposable.updateProject(editingProject.value.id, {
    name: data.name,
    description: data.description,
    transportType: data.transportType,
    transportConfig: data.transportConfig,
    deploymentId: data.deploymentId,
    deploymentConfiguration: data.deploymentConfiguration
  } as any)
    .then(() => {
      toast.success('Proyecto actualizado correctamente')
      closeModal()
    })
    .catch(error => {
      toast.error(`Error al actualizar proyecto: ${error}`)
      console.error('Error updating project:', error)
    })

  editingProject.value = null
  showEditModal.value = false
}

const deleteProject = async (projectId: string) => {
  if (confirm('¿Estás seguro de que quieres eliminar este proyecto y todos sus workflows?')) {
    await projectComposable.deleteProject(projectId)
  }
}

const closeModal = () => {
  editingProject.value = null
  showCreateModal.value = false
  showEditModal.value = false
}

onMounted(() => {
  projectComposable.loadProjects()
})
</script>
