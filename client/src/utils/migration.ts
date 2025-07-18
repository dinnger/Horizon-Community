/**
 * Utilidades para migrar datos de la versión anterior donde
 * proyectos y workflows estaban en el mismo store
 */

export interface LegacyProject {
	id: string;
	name: string;
	description: string;
	status: "active" | "inactive";
	workflows: string[];
	createdAt: Date;
	updatedAt: Date;
	stats?: {
		executions: number;
		successRate: number;
		avgDuration: string;
		lastExecution?: Date;
	};
}

/**
 * Migra datos de proyectos legacy removiendo la propiedad workflows
 */
export function migrateLegacyProjects(legacyProjects: LegacyProject[]) {
	return legacyProjects.map(({ workflows, stats, ...project }) => ({
		...project,
		createdAt: new Date(project.createdAt),
		updatedAt: new Date(project.updatedAt),
	}));
}

/**
 * Verifica si hay datos legacy en localStorage y los migra si es necesario
 */
export function checkAndMigrateLegacyData() {
	const savedData = localStorage.getItem("horizon-projects");

	if (savedData) {
		try {
			const parsed = JSON.parse(savedData);

			// Verificar si es formato legacy (tiene propiedad workflows en proyectos)
			if (parsed.length > 0 && "workflows" in parsed[0]) {
				console.log("Detectados datos legacy, migrando...");

				// Migrar proyectos removiendo workflows
				const migratedProjects = migrateLegacyProjects(parsed);

				// Guardar proyectos migrados
				localStorage.setItem(
					"horizon-projects",
					JSON.stringify(migratedProjects),
				);

				console.log("Migración de proyectos completada");
				return true;
			}
		} catch (error) {
			console.error("Error durante la migración:", error);
		}
	}

	return false;
}

/**
 * Limpia completamente los datos almacenados (útil para desarrollo)
 */
export function clearAllStoredData() {
	localStorage.removeItem("horizon-projects");
	localStorage.removeItem("horizon-workflows");
	console.log("Todos los datos almacenados han sido eliminados");
}
