import {createNode} from './node.mjs'
import {parseComment} from './parse-comment.mjs'
import {parseTextNode} from './parse-textnode.mjs'
import {parseAttribute} from './parse-attribute.mjs'

const syntaxError = (state, node) => {
	throw new SyntaxError(
		`Unclosed <${node.nodeName.toLowerCase()}> tag at: `+
		`${state.src.slice(node.onset, node.onset + 45).replace(/\n/g, '\\n')}...`
	)
}

export const emptyTags = [
	'AREA',
	'BASE',
	'BR',
	'COL',
	'!DOCTYPE',
	'EMBED',
	'HR',
	'IMG',
	'INPUT',
	'LINK',
	'META',
	'PARAM',
	'SOURCE',
	'TRACK',
	'WBR',
	'EMBEDDED-FRAGMENT'
]

const tagOnset = /^<[^!\\/]/
const nameOffset = /[\s\n>]/

const parseOpeningTag = state => {

	/// Parses the opening tag of an element.
	/// => undefined

	const onset = state.pos
	state.pos++
	while (!state.end() && !nameOffset.test(state.peek())) {
		state.pos++
	}
	const nodeName = state.src.slice(onset + 1, state.pos)
	state.hostNode.nodeName = nodeName.toUpperCase()
	while (!state.end() && state.peek() !== '>') {
		if (state.peek(2) === '/>') {
			state.hostNode._closed = true
			state.pos += 2
			return
		}
		parseAttribute(state)
		if (state.peek() !== '>') {
			state.pos++
		}
	}
	state.pos++ // step past final ">"
}

const parseClosingTag = (node, state) => {

	/// Consumes the closing tag if it exists and returns true if so.
	/// => boolean

	if (state.end() || state.peek(2) !== '</') {
		return false
	}

	// The closing tag must match the opening tag.
	const close = '</' + node.nodeName.toLowerCase() + '>'
	if (state.end() || state.peek(close.length) !== close) {
		syntaxError(state, node)
	}
	state.pos += (node.nodeName.length + 3)
	node._closed = true
	return true
}

const consume = (state, nodeName) => {

	/// Consume the content until encountering an unescaped closing
	/// tag (script or style).

	nodeName = nodeName.toLowerCase()
	const closingTag = `</${nodeName}>`
	const onset = state.pos
	const node = createNode(state)
	node.nodeName = 'TEXTNODE'
	state.hostNode.childNodes.push(node)

	const closePos = state.src.indexOf(closingTag, state.pos)
	state.pos = closePos
	node.nodeValue = state.src.slice(onset, state.pos)
	if (state.end()) {
		syntaxError(state, node)
	}
}

export const parseTag = state => {

	/// Parses an element into a new AST node.
	/// => undefined

	const next2 = state.peek(2)
	if (!tagOnset.test(next2)) {
		return
	}

	const node = createNode(state)
	node.parent = state.hostNode
	state.hostNode.childNodes.push(node)
	state.hostNode = node
	parseOpeningTag(state)

	if (emptyTags.includes(node.nodeName)) {
		if (node.nodeName == 'EMBEDDED-FRAGMENT') {
			const fragment = state.embeddedFragments[node.uid]
			fragment.parent = node
			node.parent.childNodes.pop()
			node.parent.childNodes.push(fragment)
		}
		state.hostNode = node.parent
		return
	} else if (node._closed) { // <foo/>
		state.hostNode = node.parent
		return
	}

	// Parse the contents of the tag.
	let lastPos = state.pos
	while (!parseClosingTag(node, state)) {
		if (['SCRIPT','STYLE'].includes(node.nodeName)) {
			consume(state, node.nodeName)
		}
		parseComment(state)
		parseTextNode(state)
		parseTag(state)
		if (state.pos === lastPos) {
			break
		}
		lastPos = state.pos
	}

	if (!node._closed) {
		syntaxError(state, node)
	}
	state.hostNode = node.parent
}