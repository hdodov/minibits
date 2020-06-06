import { Parser } from '../../utils/config'

const config = new Parser()

export function value (input: any) {
	if (typeof input === 'string' && input.length > 0) {
		if (input[0] === '{') {
			return JSON.parse(input)
		} else {
			return config.parse(input)
		}
	} else {
		return undefined
	}
}

export interface ComponentMeta {
	attr: string
	id: string
	name: string

	parentAttr: string
	parentId: string
	parentName: string

	value: string
}

export function attribute (input: Attr, regex: RegExp): ComponentMeta {
	let attr = input.name
	let value = input.value
	let matches = regex.exec(attr)

	if (matches) {
		let id = matches[1]
		let split = id.split('-')
		let name = split.pop()
		let parentId = split.join('-')
		let parentName = split.pop()
		let parentAttr = null

		if (parentName) {
			parentAttr = attr.replace(id, parentId)
		} else {
			parentId = null
			parentName = null
		}

		return {
			attr,
			id,
			name,
			parentAttr,
			parentId,
			parentName,
			value
		}
	}

	return null
}
