<template>
  <!-- Canvas Tabs Header -->
  <CanvasTabsHeader :project-name="canvasStore.projectName" :is-executing="canvasStore.isExecuting"
    :version="canvasStore.version.value" />
  <CanvasArea :is-context="true" />

</template>

<script setup lang="ts">
import { useCanvas, useWorkflowsStore } from '@/stores'
import { useRouter } from 'vue-router'
import CanvasArea from '@/components/Canvas/CanvasArea.vue'
import CanvasTabsHeader from '@/components/Canvas/CanvasTabsHeader.vue'

const router = useRouter()
const workflowStore = useWorkflowsStore()
const canvasStore = useCanvas()
const canvasExecuteStore = useCanvas()



</script>