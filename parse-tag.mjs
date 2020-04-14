import {createNode} from './node.mjs'
import {parseComment} from './parse-comment.mjs'
import {parseTextNode} from './parse-textnode.mjs'
import {parseAttribute} from './parse-attribute.mjs'

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
			state.pos++
			continue
		}
		parseAttribute(state)
		if (state.peek() !== '>') {
			state.pos++
		}
	}
	state.pos++ // step past final ">"
}

const parseClosingTag = state => {

	/// Consumes the closing tag if it exists and returns true if so.
	/// => boolean

	if (state.end() || state.peek(2) !== '</') {
		return false
	}
	state.pos += (state.hostNode.nodeName.length + 3)
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
		throw new Error(`Unclosed <${nodeName}> element.`)
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

	if (emptyTags.includes(state.hostNode.nodeName)) {
		if (node.nodeName == 'EMBEDDED-FRAGMENT') {
			const fragment = state.embeddedFragments[node.uid]
			fragment.parent = node
			node.parent.childNodes.pop()
			node.parent.childNodes.push(fragment)
		}
		state.hostNode = node.parent
		return
	}

	let lastPos = state.pos
	while (!parseClosingTag(state)) {

		parseComment(state)

		// Handle scripts and styles without recursion.
		if (['SCRIPT','STYLE'].includes(node.nodeName)) {
			consume(state, node.nodeName)
		}

		parseTextNode(state)
		
		parseTag(state)
		if (state.pos === lastPos) {
			const openNode = node.childNodes.slice(-1).pop()
			const unclosedTag = openNode.nodeName.toLowerCase()
			const pos = openNode.onset
			throw new Error(
				`Invalid HTML: unclosed <${unclosedTag}> at char ${pos}.`
			)
		}
		lastPos = state.pos
	}
	state.hostNode = node.parent
}