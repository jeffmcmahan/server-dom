import {emptyTags} from './parse-tag.mjs'

const printAttrs = node => {

	/// Prints a set of attributes as a string.
	/// => string

	const attrs = []
	Object.keys(node).forEach(attr => {
		const val = node[attr]
		const isString = (typeof val === 'string')
		const isAttrName = (isString && !('nodeName value').includes(attr))
		if (isAttrName && val) {
			if (attr === 'className') {
				attrs.push(`class="${val}"`)
			} else if (val === 'true') {
				attrs.push(attr)
			} else {
				attrs.push(`${attr}="${val}"`)
			}
		}
	})
	return attrs.join(' ')
}

const query = (node, selector) => {

	/// Executes the given query on the DOM.
	/// => Array<AstNode>

	// Should we index classes and ids during parse?
	// That would make this massively faster.

	// • h1
	// • #foo-id
	// • .foo-class
	// h1.foo-class
	// h2#foo-id
	// {el}?[attr]
	// {el}?[attr=value]
	// {sel} {sel}
	// {sel}>{sel}
	
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
			attr = 'nodeName'
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
	} else if (selector.attr === 'nodeName' && node.nodeName.toLowerCase() === selector.value) {
		results.push(node)
	} else if (node[selector.attr] === selector.value) {
		results.push(node)
	}
	return results
}

const addClass = function (className) {

	/// Adds the given className to the className prop.
	/// Note: Will not add it redundantly.
	/// => undefined

	className = className.trim()
	if (!className) {
		return
	}
	if (!this.classList.contains(className)) {
		this.className = ((this.className || '') + ' ' + className).trim()
	}
}

const hasClass = function (className) {

	/// Indicates whether the given className is in the className prop.
	/// Note: Case-sensitive.
	/// => boolean

	className = className.trim()
	if (!className) {
		return false
	}
	if (!(this.className || '').includes(className)) {
		return false
	}
	return (this.className || '').split(' ').includes(className)
}

const removeClass = function (className) {

	/// Removes the given className from the className prop.
	/// => undefined

	className = className.trim()
	if (!className) {
		return
	}
	this.className = this.className
		.split(' ')
		.filter(s => s !== className)
		.join(' ')
}

class AstNode {

	/// A basic implementation of the core DOM node capabilities.
	/// All attributes are understood as optional extensions.

	constructor (pos) {
		this.onset = pos
		this.id = ''
		this.className = ''
		this.parent = null 		// AstNode
		this.nodeName = ''
		this.value = '' 		// Only populated for TEXTNODE nodes.
		this.childNodes = []
		this.classList = {
			add: addClass.bind(this),
			contains: hasClass.bind(this),
			remove: removeClass.bind(this)
		}
	}

	append(...fragments) {

		/// Adds the given dom fragments to the end of childNodes.
		/// => undefined

		if (fragments.some((node, i) => node.constructor !== AstNode)) {
			throw new TypeError(
				`Failed to execute \'append\': `+
				`parameter ${i} is not of type \'Node\'.`
			)
		}
		this.childNodes.push(...fragments)
	}

	cloneNode(deep = false) {

		/// Returns an optionally deep clone of the this AstNode.
		/// => AstNode

		const clone = new AstNode(0)
		Object.assign(clone, {...this, childNodes: []})
		if (deep) {
			clone.childNodes = this.childNodes.map(node => node.clone(true))
		}
		return clone
	}

	insertBefore(node, refNode) {

		/// Inserts the given node before the given reference node.
		/// => undefined

		if (node.constructor !== AstNode) {
			throw new TypeError(
				'Failed to execute \'insertBefore\': '+
				'parameter 1 is not of type \'Node\'.'
			)
		}
		if (refNode.constructor !== AstNode) {
			throw new TypeError(
				'Failed to execute \'insertBefore\': '+
				'parameter 2 is not of type \'Node\'.'
			)
		}
		const pos = this.childNodes.indexOf(refNode)
		this.childNodes.splice(pos, 0, node)
	}

	querySelector(selector) {

		/// Returns the first match from the dom.
		/// => AstNode?

		return (query(this, selector)[0] || null)
	}

	querySelectorAll(selector) {

		/// Returns all matches in the dom.
		/// => Array<AstNode>

		return query(this, selector)
	}

	remove() {

		/// Removes this node from the tree.
		/// => undefined

		const i = this.parent.childNodes.indexOf(this)
		this.parent.childNodes.splice(i, 1)
	}

	removeChild(node) {

		/// Removes the given node from the document if it is a child
		/// of this AstNode.
		/// => undefined

		if (node.constructor !== AstNode) {
			throw new TypeError(
				'Failed to execute \'removeChild\': '+
				'parameter 1 is not of type \'Node\'.'
			)
		}
		if (!this.parent.childNodes.includes(node)) {
			throw new Error(
				'Failed to execute \'removeChild\': The node '+
				'to be removed is not a child of this node.'
			)
		}
		node.remove()
	}

	get firstChild() {

		/// Read-only calculated property.
		/// => AstNode?

		return (this.childNodes[0] || null)
	}

	get innerHTML() {

		/// Prints all child nodes as an HTML string.
		/// => string

		return this.childNodes.reduce((html, node) => (
			html + node.outerHTML
		), '')
	}

	get isConnected() {

		/// Read-only calculated property.
		/// => boolean

		return !!this.ownerDocument
	}

	get lastChild() {

		/// Read-only calculated property.
		/// => AstNode?

		return (this.childNodes.slice(-1)[0] || null)
	}

	get nextSibling() {

		/// Read-only calculated property.
		/// => AstNode?

		const i = this.parent.childNodes.indexOf(this)
		return (this.parent.childNodes[i + 1] || null)
	}

	get nodeType() {

		/// Read-only calculated property.
		/// => AstNode?

		const name = node.nodeName
		if (name === 'TEXTNODE') {
			return 'TEXT_NODE'
		} else if (name === 'HTML') {
			return 'DOCUMENT_NODE'
		} else if (name === '!DOCTYPE') {
			return 'DOCUMENT_TYPE_NODE'
		} else if (name === 'FRAGMENT') {
			return 'DOCUMENT_FRAGMENT_NODE'
		} else {
			return 'ELEMENT_NODE'
		}
	}

	get outerHTML() {

		/// Prints a DOM node as an HTML string.
		/// => string
	
		if (this.nodeName == 'TEXTNODE') {
			return this.value
		}
		if (this.nodeName == 'FRAGMENT') {
			return this.childNodes.map(node => node.outerHTML).join('')
		}
		const opening = [
			this.nodeName.toLowerCase(),
			printAttrs(this)
		].filter(s => s).join(' ')
		const closing = emptyTags.includes(this.nodeName) 
			? '' 
			: `</${this.nodeName.toLowerCase()}>`
		return `<${opening}>` +
			this.childNodes.map(node => node.outerHTML).join('') +
		closing
	}

	get ownerDocument () {

		/// Read-only calculated property.
		/// => AstNode?

		let parent = this.parent
		while (parent.nodeName !== 'HTML') {
			parent = parent.parent
		}
		return (parent || null)
	}

	get previousSibling() {

		/// Read-only calculated property.
		/// => AstNode?

		const i = this.parent.childNodes.indexOf(this)
		return (this.parent.childNodes[i - 1] || null)
	}

	get textContent () {

		/// Read-only calculated property.
		/// => AstNode?

		this.childNodes.reduce((txt, node) => (
			txt + node.value || node.textContent
		), '')
	}
}

export const createNode = state => new AstNode(state.pos)