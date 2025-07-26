# Reglas de Stores del Cliente

## Principios Fundamentales

Los stores del cliente en Horizon están diseñados para manejar únicamente el **estado de la interfaz de usuario** y las **acciones que modifican dicho estado**. No deben contener lógica de negocio ni actuar como repositorios de datos.

## 📋 Reglas Obligatorias

### 1. **Solo Acciones de Estado**

- ✅ Los stores SOLO pueden contener acciones que modifiquen el estado de la UI
- ✅ Cambios de visibilidad de modales, diálogos, menús contextuales
- ✅ Estados de carga, error, validación
- ✅ Configuraciones de usuario y preferencias visuales
- ❌ NO pueden contener métodos que devuelvan listados de datos
- ❌ NO pueden actuar como caché de datos del servidor

### 2. **Variables de Estado Únicamente**

- ✅ Referencias reactivas (`ref`, `reactive`) para el estado de la UI
- ✅ Estados booleanos para controlar la visibilidad de componentes
- ✅ Objetos de configuración temporal
- ✅ Estados de formularios y validaciones
- ❌ NO pueden almacenar listados permanentes de datos
- ❌ NO pueden mantener registros del servidor como estado persistente

### 3. **Suscripciones a Eventos Restringidas**

- ✅ Suscripciones que CAMBIEN el estado de la UI
- ✅ Eventos que actualicen estados de carga o error
- ✅ Notificaciones que modifiquen la interfaz
- ❌ NO pueden tener suscripciones que solo devuelvan registros
- ❌ NO pueden escuchar eventos para poblar listados de datos

### 4. **Separación de Responsabilidades**

- ✅ Estado de UI → Stores del Cliente
- ✅ Datos del negocio → Servicios + Composables
- ✅ Comunicación con servidor → Servicios dedicados
- ✅ Lógica de negocio → Composables o utils

### 5. **Nombres de archivos**

- ✅ Compsables: <nombre-de-la-funcionalidad>.composable.ts
- ✅ Stores: <nombre-de-la-funcionalidad>.store.ts
- ✅ Services: <nombre-de-la-funcionalidad>.service.ts
- ✅ Utils: <nombre-de-la-funcionalidad>.utils.ts

## 🔧 Implementación Correcta

### ✅ Ejemplo Correcto - Store de Canvas

```typescript
const useCanvasStore = defineStore("canvas", () => {
  // ✅ Estados de UI
  const showNodePropertiesDialog = ref(false);
  const isExecuting = ref(false);
  const selectedNodeForEdit = ref<INodeCanvas | null>(null);

  // ✅ Acciones que modifican estado
  const openNodeDialog = (node: INodeCanvas) => {
    selectedNodeForEdit.value = node;
    showNodePropertiesDialog.value = true;
  };

  // ✅ Suscripción que cambia estado
  const initSubscriptions = () => {
    socketService.onWorkerStatus((status) => {
      isExecuting.value = status.isRunning;
    });
  };

  return {
    showNodePropertiesDialog,
    isExecuting,
    selectedNodeForEdit,
    openNodeDialog,
    initSubscriptions,
  };
});
```

### ❌ Ejemplo Incorrecto

```typescript
const useCanvasStore = defineStore("canvas", () => {
  // ❌ Listado de datos del servidor
  const workflows = ref<Workflow[]>([]);
  const nodes = ref<Node[]>([]);

  // ❌ Método que devuelve registros
  const getWorkflows = async () => {
    const data = await api.getWorkflows();
    return data; // ❌ Retorna datos sin cambiar estado UI
  };

  // ❌ Suscripción que solo devuelve datos
  socketService.onWorkflowList((data) => {
    return data.workflows; // ❌ No cambia estado UI
  });
});
```

## 🎯 Alternativas Correctas

### Para Obtener Datos - Composables

Los composables son la forma correcta de manejar datos del servidor y lógica de negocio:

```typescript
// ✅ Composable para datos con estado reactivo
export function useWorkflows() {
  const loading = ref(false);
  const error = ref<string | null>(null);
  const workflows = ref<Workflow[]>([]);

  const fetchWorkflows = async (projectId?: string) => {
    loading.value = true;
    error.value = null;
    try {
      const data = await workflowService.getAll(projectId);
      workflows.value = data;
    } catch (err) {
      error.value = "Error loading workflows";
    } finally {
      loading.value = false;
    }
  };

  const createWorkflow = async (workflowData: CreateWorkflowData) => {
    loading.value = true;
    try {
      const newWorkflow = await workflowService.create(workflowData);
      workflows.value.push(newWorkflow);
      return newWorkflow;
    } catch (err) {
      error.value = "Error creating workflow";
      throw err;
    } finally {
      loading.value = false;
    }
  };

  return {
    workflows: readonly(workflows),
    loading: readonly(loading),
    error: readonly(error),
    fetchWorkflows,
    createWorkflow,
  };
}
```

```typescript
// ✅ Composable para lógica combinada
export function useProjectWorkflows() {
  const projectsStore = useProjectsStore(); // Solo para estado UI

  const getProjectWithStats = computed(() => {
    return (projectId: string) => {
      const project = projectService.getById(projectId);
      const workflowStats = workflowService.getStats(projectId);

      return {
        ...project,
        stats: workflowStats,
      };
    };
  });

  const deleteProjectAndWorkflows = async (projectId: string) => {
    try {
      await workflowService.deleteByProjectId(projectId);
      await projectService.delete(projectId);

      // Solo actualizar estado UI en stores
      projectsStore.setSelectedProject(null);
      workflowsStore.clearSelection();
    } catch (error) {
      projectsStore.setError("Error deleting project");
      throw error;
    }
  };

  return {
    getProjectWithStats,
    deleteProjectAndWorkflows,
  };
}
```

```typescript
// ✅ Composable con API reactiva
export function useApi<T>(endpoint: string) {
  const data = ref<T | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const execute = async (options?: RequestOptions) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await fetch(endpoint, options);
      if (!response.ok) throw new Error(response.statusText);

      data.value = await response.json();
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Unknown error";
    } finally {
      loading.value = false;
    }
  };

  const reset = () => {
    data.value = null;
    error.value = null;
    loading.value = false;
  };

  return {
    data: readonly(data),
    loading: readonly(loading),
    error: readonly(error),
    execute,
    reset,
  };
}
```

### Para Servicios de Datos

```typescript
// ✅ Servicio dedicado para comunicación con API
export const workflowService = {
  async getAll(projectId?: string): Promise<Workflow[]> {
    const params = projectId ? `?projectId=${projectId}` : "";
    const response = await fetch(`/api/workflows${params}`);
    return response.json();
  },

  async getById(id: string): Promise<Workflow> {
    const response = await fetch(`/api/workflows/${id}`);
    return response.json();
  },

  async create(data: CreateWorkflowData): Promise<Workflow> {
    const response = await fetch("/api/workflows", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  async update(id: string, data: UpdateWorkflowData): Promise<Workflow> {
    const response = await fetch(`/api/workflows/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  async delete(id: string): Promise<void> {
    await fetch(`/api/workflows/${id}`, { method: "DELETE" });
  },
};
```

### Uso en Componentes

```typescript
// ✅ En componentes Vue
<script setup lang="ts">
import { useWorkflows } from '@/composables/useWorkflows'
import { useCanvasStore } from '@/stores/canvas' // Solo para estado UI

const { workflows, loading, error, fetchWorkflows } = useWorkflows()
const canvasStore = useCanvasStore() // Solo para estado UI

onMounted(() => {
  fetchWorkflows()
})

const handleWorkflowSelect = (workflow: Workflow) => {
  // Actualizar solo estado UI en store
  canvasStore.setSelectedWorkflow(workflow.id)
  canvasStore.openWorkflowDialog()
}
</script>
```

## 🚫 Violaciones Comunes

1. **Store como repositorio de datos**

   ```typescript
   // ❌ Incorrecto
   const allUsers = ref<User[]>([]);
   const loadUsers = async () => {
     /* ... */
   };
   ```

2. **Métodos que devuelven datos sin cambiar estado**

   ```typescript
   // ❌ Incorrecto
   const getProjects = () => projects.value;
   ```

3. **Suscripciones que no afectan la UI**
   ```typescript
   // ❌ Incorrecto
   socketService.onDataUpdate((data) => {
     return data; // No cambia estado de UI
   });
   ```

## ✅ Checklist de Revisión

Antes de crear o modificar un store, verifica:

- [ ] ¿Todas las variables son estados de UI?
- [ ] ¿Todas las acciones modifican el estado de la interfaz?
- [ ] ¿Las suscripciones cambian el estado visual o de interacción?
- [ ] ¿No hay listados de datos del servidor?
- [ ] ¿No hay métodos que solo devuelvan datos sin cambiar estado?
- [ ] ¿La responsabilidad está clara y separada?

## 📝 Notas Adicionales

- Los stores deben ser **ligeros** y **enfocados en la UI**
- Para datos complejos, usar **composables** con `useApi` o similares
- Para comunicación con servidor, usar **servicios dedicados**
- Para lógica de negocio, usar **utils** o **composables específicos**

## 🧩 Patrones de Composables Recomendados

### 1. **Composable de Datos (Data Composable)**

```typescript
export function useEntity<T>(entityName: string) {
  const items = ref<T[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const fetch = async () => {
    /* ... */
  };
  const create = async (data: Partial<T>) => {
    /* ... */
  };
  const update = async (id: string, data: Partial<T>) => {
    /* ... */
  };
  const remove = async (id: string) => {
    /* ... */
  };

  return { items, loading, error, fetch, create, update, remove };
}
```

### 2. **Composable de Lógica (Logic Composable)**

```typescript
export function useWorkflowLogic() {
  const canvasStore = useCanvasStore(); // Solo estado UI

  const executeWorkflow = async (id: string) => {
    canvasStore.setExecuting(true); // Cambiar estado UI

    try {
      const result = await workflowService.execute(id);
      canvasStore.showSuccessMessage("Workflow executed");
      return result;
    } catch (error) {
      canvasStore.showErrorMessage("Execution failed");
      throw error;
    } finally {
      canvasStore.setExecuting(false);
    }
  };

  return { executeWorkflow };
}
```

### 3. **Composable de Formulario (Form Composable)**

```typescript
export function useWorkflowForm(initialData?: Partial<Workflow>) {
  const form = reactive({
    name: initialData?.name || "",
    description: initialData?.description || "",
    tags: initialData?.tags || [],
  });

  const errors = ref<Record<string, string>>({});
  const isValid = computed(() => Object.keys(errors.value).length === 0);

  const validate = () => {
    errors.value = {};
    if (!form.name) errors.value.name = "Name is required";
    if (form.name.length < 3) errors.value.name = "Name too short";
  };

  const submit = async () => {
    validate();
    if (!isValid.value) return false;

    try {
      const result = await workflowService.create(form);
      return result;
    } catch (error) {
      errors.value.general = "Failed to create workflow";
      return false;
    }
  };

  return { form, errors, isValid, validate, submit };
}
```

### 4. **Composable de Integración (Integration Composable)**

```typescript
export function useCanvasIntegration() {
  const canvasStore = useCanvasStore();
  const { workflows, fetchWorkflows } = useWorkflows();
  const { executeWorkflow } = useWorkflowLogic();

  const loadWorkflowInCanvas = async (workflowId: string) => {
    canvasStore.setLoading(true);

    try {
      await canvasStore.load({ workflowId });
      canvasStore.setCurrentWorkflow(workflowId);
    } catch (error) {
      canvasStore.setError("Failed to load workflow");
    } finally {
      canvasStore.setLoading(false);
    }
  };

  const executeCurrentWorkflow = async () => {
    const currentId = canvasStore.getCurrentWorkflowId();
    if (!currentId) return;

    return await executeWorkflow(currentId);
  };

  return {
    workflows,
    loadWorkflowInCanvas,
    executeCurrentWorkflow,
    fetchWorkflows,
  };
}
```

## 🔍 Comparación: Store vs Composable

| Aspecto           | ❌ Store Incorrecto              | ✅ Composable Correcto                |
| ----------------- | -------------------------------- | ------------------------------------- |
| **Propósito**     | Almacenar datos del servidor     | Gestionar datos y lógica              |
| **Estado**        | `workflows: ref([])`             | `workflows: ref([])` + loading/error  |
| **Métodos**       | `getWorkflows()` devuelve datos  | `fetchWorkflows()` actualiza estado   |
| **Reutilización** | Acoplado a un store global       | Reutilizable en cualquier componente  |
| **Testing**       | Requiere mock del store completo | Se puede testear independientemente   |
| **Separación**    | Mezcla UI y datos                | Clara separación de responsabilidades |

---

**Recuerda**: Los stores del cliente son para el **estado de la interfaz**, no para datos del negocio.
