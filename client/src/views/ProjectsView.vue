<template>
  <div class="p-8 bg-base-100 min-h-screen">
    <div class="max-w-6xl mx-auto">
      <!-- Header -->
      <ProjectsHeader @create-project="showCreateModal = true" />

      <!-- Projects Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <ProjectCard v-for="project in projectsWithWorkflows" :key="project.id" :project="project"
          @project-click="goToProject" @edit-project="editProject" @delete-project="deleteProject" />

        <div v-if="projectsWithWorkflows.length === 0 && !projectsStore.showEmptyState"
          class="flex justify-center col-span-full ">
          <span class="loading loading-spinner mr-2"></span> Cargando proyectos...
        </div>

        <!-- Empty State -->
        <ProjectsEmptyState v-if="projectsWithWorkflows.length === 0 && projectsStore.showEmptyState"
          @create-project="showCreateModal = true" />
      </div>

      <!-- Create Project Modal -->
      <ProjectModal :is-open="showCreateModal" @close="showCreateModal = false" @submit="createProject" />

      <!-- Edit Project Modal -->
      <ProjectModal :is-open="showEditModal" :is-edit="true" :project="editingProject" @close="showEditModal = false"
        @submit="updateProject" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectWorkflows } from '@/composables/useProjectWorkflows'
import type { Project, ProjectTransportConfig } from '@/stores'

// Import new components
import {
  ProjectsHeader,
  ProjectCard,
  ProjectsEmptyState,
  ProjectModal
} from '@/components/projects'

const router = useRouter()
const { projectsStore, workflowsStore, getProjectsWithWorkflows, deleteProjectAndWorkflows } = useProjectWorkflows()
const showCreateModal = ref(false)
const showEditModal = ref(false)
const editingProject = ref<Project | null>(null)

// Obtener proyectos con información de workflows
const projectsWithWorkflows = getProjectsWithWorkflows

onMounted(() => {
  projectsStore.initializeData()
})

const goToProject = (projectId: string) => {
  router.push(`/projects/${projectId}`)
}

const createProject = (data: {
  name: string
  description: string
  transportType?: 'none' | 'tcp' | 'rabbitmq' | 'kafka' | 'nats' | 'http' | 'websocket' | 'mqtt'
  transportConfig: ProjectTransportConfig
  deploymentId?: string | null
  deploymentConfiguration?: Record<string, any>
}) => {
  projectsStore.createProject({
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

const editProject = (project: Project) => {
  editingProject.value = project
  showEditModal.value = true
}

const updateProject = (data: {
  name: string
  description: string
  transportType?: 'none' | 'tcp' | 'rabbitmq' | 'kafka' | 'nats' | 'http' | 'websocket' | 'mqtt'
  transportConfig: ProjectTransportConfig
  deploymentId?: string | null
  deploymentConfiguration?: Record<string, any>
}) => {
  if (!editingProject.value) return

  projectsStore.updateProject(editingProject.value.id, {
    name: data.name,
    description: data.description,
    transportType: data.transportType,
    transportConfig: data.transportConfig,
    deploymentId: data.deploymentId,
    deploymentConfiguration: data.deploymentConfiguration
  } as any)

  editingProject.value = null
  showEditModal.value = false
}

const deleteProject = async (projectId: string) => {
  if (confirm('¿Estás seguro de que quieres eliminar este proyecto y todos sus workflows?')) {
    await deleteProjectAndWorkflows(projectId)
  }
}
</script>
