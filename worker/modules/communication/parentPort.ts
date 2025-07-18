import { type MessagePort, parentPort } from 'node:worker_threads'
import { MessageChannel } from 'node:worker_threads'

let tempParentPort: MessagePort | null = null
export const setParentPort = (data: any) => {
	tempParentPort = data
}

export const sendData = async (type: string, data?: any): Promise<any> => {
	const mc = new MessageChannel()
	const res = new Promise((resolve) => {
		mc.port1.once('message', (data) => {
			try {
				resolve(JSON.parse(data))
			} catch (error) {
				resolve(data || null)
			}
		})
	})
	const ports = [mc.port2]
	// 'self' refers to the global scope of the worker
	const parent = parentPort || tempParentPort
	parent?.postMessage({ type: type, data: data, ports: ports }, ports)
	return await res
}

export { parentPort, tempParentPort }
