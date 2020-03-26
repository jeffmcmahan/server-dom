import {createNode} from './node.mjs'

export const parseTextNode = state => {

	/// Parses a bit of text as a TextNode.
	/// => undefined

	if (state.end() || state.peek() === '<') {
		return
	}
	const onset = state.pos
	const node = createNode(state)
	node.tagName = 'TEXTNODE'
	state.hostNode.childNodes.push(node)
	while (!state.end() && state.peek() !== '<') {
		state.pos++
	}
	node.text = state.src.slice(onset, state.pos)
}