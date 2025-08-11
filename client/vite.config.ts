import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
	// Cargar variables de entorno desde la carpeta padre
	const env = loadEnv(mode, fileURLToPath(new URL('..', import.meta.url)), '')

	const base = `/ui`
	return {
		plugins: [vue(), tailwindcss()] as any,
		base,
		server: {
			proxy: {
				'/api': {
					target: env.VITE_SERVER_URL,
					changeOrigin: true,
					secure: env.SERVER_SSL_MODE.toString().toLowerCase() === 'true'
				}
			}
		},
		resolve: {
			alias: {
				'@': fileURLToPath(new URL('./src', import.meta.url)),
				'@canvas': fileURLToPath(new URL('./canvas', import.meta.url))
			}
		},
		envDir: fileURLToPath(new URL('..', import.meta.url)),
		build: {
			outDir: '../dist/client',
			emptyOutDir: true // also necessary
		}
	}
})
