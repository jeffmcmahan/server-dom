import {createNode} from './node.mjs'
import {parseComment} from './parse-comment.mjs'
import {parseTextNode} from './parse-textnode.mjs'
import {parseAttribute} from './parse-attribute.mjs'

export const emptyTags = [
	'AREA',
	'BASE',
	'BR',
	'COL',
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
	const tagName = state.src.slice(onset + 1, state.pos)
	state.hostNode.tagName = tagName.toUpperCase()
	while (!state.end() && state.peek() !== '>') {
		if (state.peek(2) === '/>') {
			state.pos++
			continue
		}
		parseAttribute(state)
		if (state.peek() != '>') {
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
	state.pos += (state.hostNode.tagName.length + 3)
	return true
}

export const parseTag = state => {

	/// Parses an element into a new AST node.
	/// => undefined

	const next2 = state.peek(2)
	if (state.end() || !tagOnset.test(next2)) {
		return
	}

	const node = createNode(state)
	node.parent = state.hostNode
	state.hostNode.childNodes.push(node)
	state.hostNode = node
	parseOpeningTag(state)

	// If empty, just stop here.
	// But how do we warn?
	if (emptyTags.includes(state.hostNode.tagName)) {
		if (node.tagName == 'EMBEDDED-FRAGMENT') {
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
		parseTextNode(state)
		parseComment(state)
		parseTag(state)
		if (state.pos === lastPos) {
			const openNode = node.childNodes.slice(-1).pop()
			const unclosedTag = openNode.tagName.toLowerCase()
			const pos = openNode.onset
			throw new Error(
				`Invalid HTML: unclosed <${unclosedTag}> at char ${pos}.`
			)
		}
		lastPos = state.pos
	}
	state.hostNode = node.parent
}