import {createNode} from './node.mjs'
import {parseTag} from './parse-tag.mjs'
import {parseAttribute} from './parse-attribute.mjs'
import {parseTextNode} from './parse-textnode.mjs'
import {parseComment} from './parse-comment.mjs'
let uid = 0

const parseDoctype = state => {

	/// Handles a leading <!doctype ...> declaration.
	/// => undefined

	if (/^<!doctype/i.test(state.src)) {
		const node = createNode(state)
		node.nodeName = '!DOCTYPE'
		node.parent = state.hostNode
		state.hostNode.childNodes.push(node)
		state.hostNode = node
		state.pos += 10
		parseAttribute(state)
		state.hostNode = node.parent
		state.pos++
	}
}

const parse = (src, embeddedFragments) => {

	/// Transforms the given source into an AST.
	/// => AstNode

	const ln = src.length

	const state = {
		src,
		embeddedFragments,
		ast: null,
		hostNode: null,
		pos: 0,
		end: () => (state.pos === ln),
		peek: distance => {
			if (!distance || distance === 1) {
				return state.src[state.pos]
			}
			return state.src.slice(state.pos, state.pos + distance)
		}
	}

	state.ast = createNode(state)
	state.ast.nodeName = 'FRAGMENT'
	state.hostNode = state.ast

	parseDoctype(state)
	while (!state.end()) {
		parseTextNode(state)
		parseComment(state)
		parseTag(state)
	}
	return state.ast
}

const serialize = (value, embeddedFragments) => {

	/// Expresses the given value as a string.
	/// => string

	if (value == null) {
		return ''
	}
	if (value.constructor.name === 'AstNode') {
		embeddedFragments[++uid] = value
		return `<embedded-fragment uid="${uid}">`
	}
	if (value.constructor === Array) {
		return value.map(v => serialize(v)).join('')
	}
	return value.toString()
}

export const dom = (strings, ...tags) => {

	/// Produces a virtual DOM object from the given strings and tags.
	/// => AstNode - the fragment root node

	let src = ''
	const embeddedFragments = {}
	strings.forEach((str, i) => (
		src += (str + serialize(tags[i], embeddedFragments))
	))
	const fragment = parse(src.trim(), embeddedFragments)
	uid = 0
	return fragment
}