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

class AstNode {

	/// Using a class construct simply for performance gain.
	/// ... saves 80% vs. return public pattern.

	isDom = true

	constructor (pos) {
		this.onset = pos
		this.tagName = ''
		this.text = ''
		this.childNodes = []
		this.classList = {
			add: this.addClass.bind(this),
			contains: this.containsClass.bind(this),
			remove: this.removeClass.bind(this)
		}
	}

	containsClass(str) {
		return (this.className || '').split(' ').includes(str)
	}
	
	addClass(str) {
		if (!this.classList.contains(str)) {
			this.className = ((this.className || '') + ' ' + str).trim()
		}
	}

	removeClass(str) {
		this.className = this.className
			.split(' ')
			.filter(s => s !== str)
			.join(' ')
	}

	append(...fragments) {
		this.childNodes.push(...fragments)
	}

	remove() {
		const i = this.parent.childNodes.indexOf(this)
		this.parent.childNodes.splice(i, 1)
	}

	querySelector(selector) {
		return (query(this, selector)[0] || null)
	}

	querySelectorAll(selector) {
		return query(this, selector)
	}

	toString() {

		/// Prints a DOM node as a string.
		/// => string
	
		if (this.tagName == 'TEXTNODE') {
			return this.text
		}
		if (this.tagName == 'FRAGMENT') {
			return this.childNodes.map(node => node.toString()).join('')
		}
		const opening = [
			this.tagName.toLowerCase(),
			printAttrs(this)
		].filter(s => s).join(' ')
		const closing = emptyTags.includes(this.tagName) 
			? '' 
			: `</${this.tagName.toLowerCase()}>`
		return `<${opening}>` +
			this.childNodes.map(node => node.toString()).join('') +
		closing
	}
}

export const createNode = state => new AstNode(state.pos)