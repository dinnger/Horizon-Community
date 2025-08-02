export const variablesValue: Map<string,any> = new Map()

export function setVariable({ name, value }: { name: string; value: any }) {
  variablesValue.set(name,value)
}

export function getVariable({ name }: { name: string }) {
  return variablesValue.get(name)
}

export function listVariables() {
	return Object.keys(variablesValue)
}