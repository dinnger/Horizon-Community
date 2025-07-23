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
		const cl = console.log
		const cl2 = console.debug
		console.log = (...args) => {
			// console.warn('console.log', args)
			if (args.length > 1) {
				args[0] = `\x1b[42m Execute \x1b[0m \x1B[34m${args[0]} \x1B[0m`
				args.unshift(`\x1B[43m Worker ${this.el.index && this.el.index > 0 ? this.el.index : ''} \x1B[0m`)
			}
			if (args.length === 1) args.unshift(`\x1B[43m Worker ${this.el.index && this.el.index > 0 ? this.el.index : ''} \x1B[0m`)
			cl.apply(console, args)
		}
		console.debug = (...args) => {
			this.el.coreModule.stats.console({
				date: dayjs().format('DD/MM/YYYY HH:mm:ss.SSS'),
				level: 'info',
				message: JSON.stringify(args)
			})
			cl2.apply(console, args)
		}
	}

	// sendLogs(logMessages: { date: string; level: string; message: string }[]) {
	// 	this.el.communicationModule.server.sendLogs(logMessages)
	// }
}
