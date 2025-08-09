<template>
  <div @click="$emit('project-click', project.id)"
    class="card bg-base-200 shadow-xl backdrop-blur-sm border border-base-300 hover:shadow-2xl transition-all duration-300 cursor-pointer hover:scale-105">
    <div class="card-body">
      <div class="flex justify-between items-start mb-4">
        <h2 class="card-title text-lg">{{ project.name }}</h2>
        <div class="dropdown dropdown-end" @click.stop.prevent>
          <div tabindex="0" role="button" class="btn btn-ghost btn-sm" @click.stop>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zM12 13a1 1 0 110-2 1 1 0 010 2zM12 20a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </div>
          <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
            <li><a @click.stop.prevent="$emit('edit-project', project)">Editar</a></li>
            <li><a @click.stop.prevent="$emit('delete-project', project.id)" class="text-error">Eliminar</a></li>
          </ul>
        </div>
      </div>

      <p class="text-sm opacity-70 mb-2">{{ project.description }}</p>

      <div v-if="project.transportType && project.transportType !== 'none'" class="text-xs text-base-content/60 mb-4">
        <div class="flex items-center space-x-2">
          <span class="font-medium">Transporte:</span>
          <span>{{ getTransportLabel(project.transportType) }}</span>
        </div>
        <div v-if="getConnectionInfo(project)" class="mt-1 font-mono text-xs">
          {{ getConnectionInfo(project) }}
        </div>
      </div>

      <div class="flex justify-between items-center text-sm">
        <div class="flex items-center space-x-2">
          <span class="badge badge-primary badge-sm">{{ project.workflows.length }} workflows</span>
          <span :class="['badge badge-sm', project.status === 'active' ? 'badge-success' : 'badge-warning']">
            {{ project.status }}
          </span>
          <span v-if="project.transportType && project.transportType !== 'none'" class="badge badge-info badge-sm">
            {{ getTransportLabel(project.transportType) }}
          </span>
        </div>
        <span class="opacity-50">{{ formatDate(project.createdAt) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Project } from '../../../../shared/interfaces/project/project.interface'

interface Props {
  project: any // Cambiamos a any para ser más flexible con el tipo
}

defineProps<Props>()

defineEmits<{
  'project-click': [projectId: string]
  'edit-project': [project: Project]
  'delete-project': [projectId: string]
}>()

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

const getConnectionInfo = (project: any) => {
  if (!project.transportConfig || project.transportType === 'none') return null

  const config = project.transportConfig

  switch (project.transportType) {
    case 'tcp':
      return config.host && config.port ? `${config.host}:${config.port}` : null
    case 'rabbitmq':
      return config.amqpUrl || (config.exchange && config.queue ? `${config.exchange}/${config.queue}` : null)
    case 'kafka':
      return config.brokers || (config.topic ? `Topic: ${config.topic}` : null)
    case 'nats':
      return config.natsUrl || (config.subject ? `Subject: ${config.subject}` : null)
    case 'http':
      return config.baseUrl
    case 'websocket':
      return config.wsUrl
    default:
      return null
  }
}

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date)
}
</script>
