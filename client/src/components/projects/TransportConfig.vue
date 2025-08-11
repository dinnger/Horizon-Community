<template>
  <div class="space-y-4">
    <h4 class="font-semibold text-base-content">Configuración de Transporte</h4>

    <div class="form-control">
      <label class="label">
        <span class="label-text">Tipo de Transporte</span>
      </label>
      <select :value="transportType"
        @change="$emit('update:transportType', ($event.target as HTMLSelectElement).value as IProjectTransportType)"
        class="select select-bordered w-full">
        <option value="none">Sin transporte</option>
        <option value="tcp">TCP</option>
        <option value="rabbitmq">RabbitMQ</option>
        <option value="kafka">Apache Kafka</option>
        <option value="nats">NATS</option>
        <option value="http">HTTP/REST</option>
        <option value="websocket">WebSocket</option>
        <option value="mqtt">MQTT</option>
      </select>
    </div>

    <!-- Configuración específica por tipo de transporte -->
    <div v-if="transportType && transportType !== 'none'" class="space-y-3 p-4">
      <h5 class="text-sm font-medium text-base-content/80">Configuración</h5>

      <div class="grid grid-cols-1 gap-2">
        <div class="form-control" v-for="(item, key) in config" :key="key">
          <label class="text-sm opacity-65"> {{ item.label }}</label>
          <input v-model="item.value" @input="updateConfig(key, ($event.target as HTMLInputElement).value)" type="text"
            :placeholder="item.placeholder" class="input input-bordered w-full" />

        </div>

      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import type { IProjectTransportConfig, IProjectTransportType } from '@shared/interfaces/standardized';
import { onMounted, ref, watch } from 'vue';

interface Props {
  transportType: IProjectTransportType
  transportConfig: IProjectTransportConfig
}

const emit = defineEmits<{
  'update:transportType': [value: IProjectTransportType]
  'update:transportConfig': [config: IProjectTransportConfig]
}>()

const props = defineProps<Props>()

const config = ref<Record<string, { label: string; placeholder: string; value: any }>>({})
const loadConfig = () => {
  switch (props.transportType) {
    case 'tcp':
      config.value = {
        host: { label: 'Host', placeholder: 'Host (ej: localhost)', value: props.transportConfig.host || '' },
        port: { label: 'Puerto', placeholder: 'Puerto (ej: 8080)', value: props.transportConfig.port || 8080 },
      }
      break
    case 'rabbitmq':
      config.value = {
        url: { label: 'AMQP URL', placeholder: 'AMQP URL (ej: amqp://localhost:5672)', value: props.transportConfig.url || '' },
        exchange: { label: 'Exchange', placeholder: 'Exchange', value: props.transportConfig.exchange || '' },
        queue: { label: 'Queue', placeholder: 'Queue', value: props.transportConfig.queue || '' },
        routingKey: { label: 'Routing Key', placeholder: 'Routing Key', value: props.transportConfig.routingKey || '' },
      }
      break
    case 'kafka':
      config.value = {
        brokers: { label: 'Brokers', placeholder: 'Brokers (ej: localhost:9092)', value: props.transportConfig.brokers || '' },
        clientId: { label: 'Client ID', placeholder: 'Client ID', value: props.transportConfig.clientId || '' },
        groupId: { label: 'Group ID', placeholder: 'Group ID', value: props.transportConfig.groupId || '' },
        topic: { label: 'Topic', placeholder: 'Topic', value: props.transportConfig.topic || '' },
      }
      break
    case 'nats':
      config.value = {
        url: { label: 'NATS URL', placeholder: 'NATS URL (ej: nats://localhost:4222)', value: props.transportConfig.url || '' },
        subject: { label: 'Subject', placeholder: 'Subject', value: props.transportConfig.subject || '' },
      }
      break
    case 'http':
      config.value = {
        url: { label: 'Base URL', placeholder: 'Base URL (ej: https://api.example.com)', value: props.transportConfig.url || '' },
        timeout: { label: 'Timeout', placeholder: 'Timeout (ms)', value: props.transportConfig.timeout || 10000 },
      }
      break
    case 'websocket':
      config.value = {
        url: { label: 'WebSocket URL', placeholder: 'WebSocket URL (ej: ws://localhost:8080)', value: props.transportConfig.url || '' },
      }
      break
    case 'mqtt':
      config.value = {
        url: { label: 'MQTT URL', placeholder: 'MQTT URL (ej: mqtt://localhost:1883)', value: props.transportConfig.url || '' },
      }
      break
  }
}


watch(() => props.transportType, () => {
  loadConfig()
  const conf: Record<string, any> = {}
  for (const [k, v] of Object.entries(config.value)) {
    conf[k] = v.value
  }
  emit('update:transportConfig', conf)
})

const updateConfig = (key: string, value: any) => {
  const conf: Record<string, any> = {}
  for (const [k, v] of Object.entries(config.value)) {
    conf[k] = v.value
  }
  emit('update:transportConfig', conf)
}

onMounted(() => {
  loadConfig()
})
</script>
