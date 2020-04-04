import {createNode} from './node.mjs'
import {parseTag} from './parse-tag.mjs'
import {parseTextNode} from './parse-textnode.mjs'
import {parseComment} from './parse-comment.mjs'
let uid = 0

const parse = (src, embeddedFragments) => {

	/// Transforms the given source into an AST.
	/// => Object

	const ln = src.length

	const state = {
		src,
		embeddedFragments,
		ast: null,
		hostNode: null,
		pos: 0,
		end: () => state.pos === ln,
		peek: distance => {
			if (!distance || distance === 1) {
				return state.src[state.pos]
			}
			if (distance === 2) {
				return state.src[state.pos] + state.src[state.pos + 1]
			}
			return state.src.slice(state.pos, state.pos + distance)
		}
	}

	state.ast = createNode(state)
	state.ast.tagName = 'FRAGMENT'
	state.hostNode = state.ast

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
	if (value.isDom) {
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
	/// => Object

	let src = ''
	const embeddedFragments = {}
	strings.forEach((str, i) => (
		src += (str + serialize(tags[i], embeddedFragments))
	))
	const fragment = parse(src, embeddedFragments)
	uid = 0
	return fragment
}