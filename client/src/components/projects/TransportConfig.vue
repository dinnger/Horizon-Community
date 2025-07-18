<template>
  <div class="space-y-4">
    <h4 class="font-semibold text-base-content">Configuración de Transporte</h4>

    <div class="form-control">
      <label class="label">
        <span class="label-text">Tipo de Transporte</span>
      </label>
      <select :value="transportType" @change="$emit('update:transportType', ($event.target as HTMLSelectElement).value)"
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
    <div v-if="transportType && transportType !== 'none'" class="space-y-3">
      <h5 class="text-sm font-medium text-base-content/80">Configuración Específica</h5>

      <!-- TCP -->
      <div v-if="transportType === 'tcp'" class="space-y-3">
        <div class="grid grid-cols-2 gap-2">
          <div class="form-control">
            <input :value="transportConfig.host || ''"
              @input="updateConfig('host', ($event.target as HTMLInputElement).value)" type="text"
              placeholder="Host (ej: localhost)" class="input input-bordered input-sm" />
          </div>
          <div class="form-control">
            <input :value="transportConfig.port || ''"
              @input="updateConfig('port', Number(($event.target as HTMLInputElement).value))" type="number"
              placeholder="Puerto (ej: 8080)" class="input input-bordered input-sm" />
          </div>
        </div>
      </div>

      <!-- RabbitMQ -->
      <div v-if="transportType === 'rabbitmq'" class="space-y-3">
        <input :value="transportConfig.amqpUrl || ''"
          @input="updateConfig('amqpUrl', ($event.target as HTMLInputElement).value)" type="text"
          placeholder="AMQP URL (ej: amqp://localhost:5672)" class="input input-bordered input-sm w-full" />
        <div class="grid grid-cols-2 gap-2">
          <input :value="transportConfig.exchange || ''"
            @input="updateConfig('exchange', ($event.target as HTMLInputElement).value)" type="text"
            placeholder="Exchange" class="input input-bordered input-sm" />
          <input :value="transportConfig.queue || ''"
            @input="updateConfig('queue', ($event.target as HTMLInputElement).value)" type="text" placeholder="Queue"
            class="input input-bordered input-sm" />
        </div>
        <input :value="transportConfig.routingKey || ''"
          @input="updateConfig('routingKey', ($event.target as HTMLInputElement).value)" type="text"
          placeholder="Routing Key" class="input input-bordered input-sm w-full" />
      </div>

      <!-- Kafka -->
      <div v-if="transportType === 'kafka'" class="space-y-3">
        <input
          :value="Array.isArray(transportConfig.brokers) ? transportConfig.brokers.join(',') : (transportConfig.brokers || '')"
          @input="updateConfig('brokers', ($event.target as HTMLInputElement).value.split(',').map(b => b.trim()))"
          type="text" placeholder="Brokers (ej: localhost:9092)" class="input input-bordered input-sm w-full" />
        <div class="grid grid-cols-2 gap-2">
          <input :value="transportConfig.clientId || ''"
            @input="updateConfig('clientId', ($event.target as HTMLInputElement).value)" type="text"
            placeholder="Client ID" class="input input-bordered input-sm" />
          <input :value="transportConfig.groupId || ''"
            @input="updateConfig('groupId', ($event.target as HTMLInputElement).value)" type="text"
            placeholder="Group ID" class="input input-bordered input-sm" />
        </div>
        <input :value="transportConfig.topic || ''"
          @input="updateConfig('topic', ($event.target as HTMLInputElement).value)" type="text" placeholder="Topic"
          class="input input-bordered input-sm w-full" />
      </div>

      <!-- NATS -->
      <div v-if="transportType === 'nats'" class="space-y-3">
        <input :value="transportConfig.natsUrl || ''"
          @input="updateConfig('natsUrl', ($event.target as HTMLInputElement).value)" type="text"
          placeholder="NATS URL (ej: nats://localhost:4222)" class="input input-bordered input-sm w-full" />
        <input :value="transportConfig.subject || ''"
          @input="updateConfig('subject', ($event.target as HTMLInputElement).value)" type="text" placeholder="Subject"
          class="input input-bordered input-sm w-full" />
      </div>

      <!-- HTTP -->
      <div v-if="transportType === 'http'" class="space-y-3">
        <input :value="transportConfig.baseUrl || ''"
          @input="updateConfig('baseUrl', ($event.target as HTMLInputElement).value)" type="text"
          placeholder="Base URL (ej: https://api.example.com)" class="input input-bordered input-sm w-full" />
        <input :value="transportConfig.timeout || ''"
          @input="updateConfig('timeout', Number(($event.target as HTMLInputElement).value))" type="number"
          placeholder="Timeout (ms)" class="input input-bordered input-sm w-full" />
      </div>

      <!-- WebSocket -->
      <div v-if="transportType === 'websocket'" class="space-y-3">
        <input :value="transportConfig.wsUrl || ''"
          @input="updateConfig('wsUrl', ($event.target as HTMLInputElement).value)" type="text"
          placeholder="WebSocket URL (ej: ws://localhost:8080)" class="input input-bordered input-sm w-full" />
      </div>

      <!-- MQTT -->
      <div v-if="transportType === 'mqtt'" class="space-y-3">
        <input :value="transportConfig.mqttUrl || ''"
          @input="updateConfig('mqttUrl', ($event.target as HTMLInputElement).value)" type="text"
          placeholder="MQTT URL (ej: mqtt://localhost:1883)" class="input input-bordered input-sm w-full" />
      </div>

      <!-- Configuración común -->
      <div class="collapse collapse-arrow bg-base-200">
        <input type="checkbox" />
        <div class="collapse-title text-sm font-medium">
          Configuración Avanzada
        </div>
        <div class="collapse-content space-y-3">
          <div class="grid grid-cols-2 gap-2">
            <input :value="transportConfig.username || ''"
              @input="updateConfig('username', ($event.target as HTMLInputElement).value)" type="text"
              placeholder="Usuario" class="input input-bordered input-sm" />
            <input :value="transportConfig.password || ''"
              @input="updateConfig('password', ($event.target as HTMLInputElement).value)" type="password"
              placeholder="Contraseña" class="input input-bordered input-sm" />
          </div>
          <div class="grid grid-cols-2 gap-2">
            <input :value="transportConfig.retries || ''"
              @input="updateConfig('retries', Number(($event.target as HTMLInputElement).value))" type="number"
              placeholder="Reintentos" class="input input-bordered input-sm" />
            <input :value="transportConfig.retryDelay || ''"
              @input="updateConfig('retryDelay', Number(($event.target as HTMLInputElement).value))" type="number"
              placeholder="Retraso (ms)" class="input input-bordered input-sm" />
          </div>
          <div class="form-control">
            <label class="label cursor-pointer">
              <span class="label-text">Usar SSL/TLS</span>
              <input :checked="transportConfig.ssl || false"
                @change="updateConfig('ssl', ($event.target as HTMLInputElement).checked)" type="checkbox"
                class="checkbox" />
            </label>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ProjectTransportConfig } from '@/stores'

interface Props {
  transportType: 'none' | 'tcp' | 'rabbitmq' | 'kafka' | 'nats' | 'http' | 'websocket' | 'mqtt' | undefined
  transportConfig: ProjectTransportConfig
}

const emit = defineEmits<{
  'update:transportType': [value: string]
  'update:transportConfig': [config: ProjectTransportConfig]
}>()

const props = defineProps<Props>()

const updateConfig = (key: string, value: any) => {
  const config = { ...props.transportConfig }
  config[key as keyof ProjectTransportConfig] = value
  emit('update:transportConfig', config)
}
</script>
