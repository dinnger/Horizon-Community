import type { Worker } from '../../worker.js'

export class SharedCommunication {
	el: Worker
	constructor(el: Worker) {
		this.el = el
	}
}
