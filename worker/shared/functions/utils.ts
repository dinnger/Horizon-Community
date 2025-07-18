import dotenv from 'dotenv'
dotenv.config()

export function getTime() {
	const hrTime = process.hrtime()
	const time = Number.parseFloat(
		(hrTime[0] * 1000 + hrTime[1] / 1000000).toFixed(3)
	)
	return time
}

export function getMemoryUsage() {
	return (
		Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100
	).toFixed(2)
}

export function getArgs() {
	return process.argv.reduce((args: any, arg: string) => {
		// long arg
		if (arg.slice(0, 2) === '--') {
			const longArg = arg.split('=')
			const longArgFlag = longArg[0].slice(2)
			const longArgValue = longArg.length > 1 ? longArg[1] : true
			args[longArgFlag] = longArgValue
		}
		// flags
		else if (arg[0] === '-') {
			const flags = arg.slice(1).split('')
			for (const flag of flags) {
				args[flag] = true
			}
		}
		return args
	}, {})
}
