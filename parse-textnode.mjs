import {createNode} from './node.mjs'

export const parseTextNode = state => {

	/// Parses a bit of text as a TextNode.
	/// => undefined

	if (state.peek() === '<') {
		return
	}

	const node = createNode(state)
	const onset = state.pos
	node.tagName = 'TEXTNODE'
	state.hostNode.childNodes.push(node)

	const offset = state.src.indexOf('<', state.pos)
	if (offset !== -1) {
		state.pos = offset
	} else {
		state.pos = state.src.length
	}
	node.text = state.src.slice(onset, state.pos)
}
