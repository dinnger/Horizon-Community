import { seedDatabase } from "./seeders/seed";

async function runSeed() {
	try {
		console.log("🌱 Iniciando seed de la base de datos...");
		await seedDatabase();
		console.log("✅ Seed completado exitosamente");
		process.exit(0);
	} catch (error) {
		console.error("❌ Error durante el seed:", error);
		process.exit(1);
	}
}

runSeed();
