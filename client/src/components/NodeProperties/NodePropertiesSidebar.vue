<template>
  <div class="w-64 bg-base-200 border-r border-base-300 overflow-y-auto">
    <div class="p-4">
      <h3 class="font-semibold mb-3">Secciones</h3>
      <div class="space-y-1">
        <button v-for="section in sections" :key="section.key" @click="$emit('section-change', section.key)"
          class="w-full text-left px-3 py-2 rounded text-sm transition-colors"
          :class="activeSection === section.key ? 'bg-primary text-primary-content' : 'hover:bg-base-300'">
          {{ section.label }}
          <span class="text-xs opacity-60 block">{{ section.count }} propiedades</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Section {
  key: string
  label: string
  count: number
}

interface Props {
  sections: Section[]
  activeSection: string
}

interface Emits {
  'section-change': [sectionKey: string]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
</script>
