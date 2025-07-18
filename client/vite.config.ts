import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
	// Cargar variables de entorno desde la carpeta padre
	const env = loadEnv(mode, fileURLToPath(new URL('..', import.meta.url)), '')

	return {
		plugins: [vue(), tailwindcss()],
		resolve: {
			alias: {
				'@': fileURLToPath(new URL('./src', import.meta.url)),
				'@canvas': fileURLToPath(new URL('./canvas', import.meta.url))
			}
		},
		envDir: fileURLToPath(new URL('..', import.meta.url))
	}
})
