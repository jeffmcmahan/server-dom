import {emptyTags} from './parse-tag.mjs'

const printAttrs = node => {

	/// Prints a set of attributes as a string.
	/// => string

	const attrs = []
	Object.keys(node).forEach(attr => {
		const isString = (typeof node[attr] === 'string')
		const isAttrName = (isString && !('tagName text').includes(attr))
		if (isAttrName) {
			if (attr === 'className') {
				attrs.push(`class="${node[attr]}"`)
			} else {
				attrs.push(`${attr}="${node[attr]}"`)
			}
		}
	})
	return attrs.join(' ')
}

const toString = node => {

	/// Prints a DOM node as a string.
	/// => string

	if (node.tagName == 'TEXTNODE') {
		return node.text
	}
	if (node.tagName == 'FRAGMENT') {
		return node.childNodes.map(node => node.toString()).join('')
	}
	const opening = [
		node.tagName.toLowerCase(),
		printAttrs(node)
	].filter(s => s).join(' ')
	const closing = emptyTags.includes(node.tagName) 
		? '' 
		: `</${node.tagName.toLowerCase()}>`
	return `<${opening}>` +
		node.childNodes.map(node => node.toString()).join('') +
	closing
}

const query = (node, selector) => {

	///
	/// => Array
	
	if (typeof selector === 'string') {
		let attr = ''
		let value = ''
		if (selector.startsWith('#')) {
			attr = 'id'
			value = selector.slice(1).trim()
		}
		if (selector.startsWith('.')) {
			attr = 'className'
			value = selector.slice(1).trim()
		}
		if (selector.startsWith('[')) {
			[attr, value] = selector.slice(1,-1).split('=')
			value = (value || '')
		}
		if (!attr) {
			attr = 'tagName'
			value = selector
		}
		selector = {attr, value}
	}

	const results = []
	node.childNodes.forEach(node => {
		results.push(...query(node, selector))
	})
	if (selector.attr === 'className' && node.classList.contains(selector.value)) {
		results.push(node)
	} else if (selector.attr === 'tagName' && node.tagName.toLowerCase() === selector.value) {
		results.push(node)
	} else if (node[selector.attr] === selector.value) {
		results.push(node)
	}
	return results
}

const methods = node => {

	/// Adds a browser-like interface to the node object.
	/// => Object

	return {
		classList: {
			contains: str => {
				return (node.className || '').split(' ').includes(str)
			},
			add: str => {
				if (!node.classList.contains(str)) {
					node.className = ((node.className || '') + ' ' + str).trim()
				}
			},
			remove: str => {
				node.className = node.className
					.split(' ')
					.filter(s => s !== str)
					.join(' ')
			}
		},
		append: (...fragments) => node.childNodes.push(...fragments),
		remove: () => {
			const i = node.parent.childNodes.indexOf(node)
			node.parent.childNodes.splice(i, 1)
		},
		querySelector: selector => (query(node, selector)[0] || null),
		querySelectorAll: selector => query(node, selector),
		toString: () => toString(node)
	}
}

export const createNode = state => {

	/// Creates a new DOM node.
	/// => Object

	const node = {
		onset: state.pos,
		tagName: '',
		text: '',
		childNodes: []
	}
	Object.assign(node, methods(node))
	return node
}