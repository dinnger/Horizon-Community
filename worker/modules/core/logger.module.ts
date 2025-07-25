import type { Worker } from '../../worker.js'
import winston from 'winston'
import Transport from 'winston-transport'
import dayjs from 'dayjs'

export class CoreLogger {
	el: Worker
	logger: winston.Logger
	constructor(el: Worker) {
		this.el = el
		this.logger = winston.createLogger({
			level: 'info',
			format: winston.format.json(),
			transports: [
				new winston.transports.File({
					filename: `logs/${this.el.flow}/error.log`,
					level: 'error'
				}),
				new winston.transports.File({
					filename: `logs/${this.el.flow}/info.log`,
					level: 'info'
				}),
				new winston.transports.Console({
					format: winston.format.combine(
						winston.format.colorize(), // Colorea el texto en la consola
						winston.format.simple() // Formato simple (sin detalles adicionales)
					)
				})
			]
		})

		if (this.el.isDev) {
			this.initConsole()
			this.initLoggerDev()
		}
	}

	initLoggerDev() {
		let logMessages: { date: string; level: string; message: string }[] = []
		class CustomTransport extends Transport {
			log(info: any, callback: () => void) {
				const d = new Date()
				const pad = (n: number) => String(n).padStart(2, '0')
				const date = `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
				logMessages.push({ ...structuredClone(info), date })
				callback()
			}
		}
		this.logger.add(new CustomTransport())
		setInterval(() => {
			if (logMessages.length > 0) {
				// this.sendLogs(logMessages)
			}
			logMessages = []
		}, 500)
	}

	initConsole() {
		// Guardar referencias originales de console
		const originalConsole = {
			log: console.log,
			debug: console.debug,
			info: console.info,
			warn: console.warn,
			error: console.error
		}

		// Colores para cada nivel de log
		const logColors = {
			log: { bg: '\x1b[42m', text: '\x1B[34m' }, // Verde y azul
			debug: { bg: '\x1b[45m', text: '\x1B[35m' }, // Magenta
			info: { bg: '\x1b[46m', text: '\x1B[36m' }, // Cian
			warn: { bg: '\x1b[43m', text: '\x1B[33m' }, // Amarillo
			error: { bg: '\x1b[41m', text: '\x1B[31m' } // Rojo
		}

		// Función genérica para interceptar console
		const createConsoleInterceptor = (level: keyof typeof originalConsole, originalMethod: (...args: any[]) => void) => {
			return (...args: any[]) => {
				const colors = logColors[level]
				const workerPrefix = `\x1B[43m Worker ${this.el.index && this.el.index > 0 ? this.el.index : ''} \x1B[0m`

				// Formatear argumentos según el tipo de log
				const formattedArgs = [...args]
				if (formattedArgs.length > 1 && formattedArgs[0] === 'console') {
					formattedArgs[0] = `\u001b[42m Execute \u001b[0m ${colors.bg} ${formattedArgs[0]} \x1b[0m`
					formattedArgs.unshift(workerPrefix)
				} else if (formattedArgs.length === 1) {
					formattedArgs.unshift(workerPrefix)
				}

				// Enviar estadísticas
				this.el.coreModule.stats.console({
					date: dayjs().format('DD/MM/YYYY HH:mm:ss.SSS'),
					level,
					message: JSON.stringify(args[0] !== 'console' ? args : args.slice(1))
				})

				// Llamar al método original
				originalMethod.apply(console, formattedArgs)
			}
		}

		// Interceptar todos los métodos de console
		console.log = createConsoleInterceptor('log', originalConsole.log)
		console.debug = createConsoleInterceptor('debug', originalConsole.debug)
		console.info = createConsoleInterceptor('info', originalConsole.info)
		console.warn = createConsoleInterceptor('warn', originalConsole.warn)
		console.error = createConsoleInterceptor('error', originalConsole.error)
	}

	// sendLogs(logMessages: { date: string; level: string; message: string }[]) {
	// 	this.el.communicationModule.server.sendLogs(logMessages)
	// }
}
