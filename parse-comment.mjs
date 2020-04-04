export const parseComment = state => {

	/// Consumes a comment (ignoring it entirely).
	/// => undefined

	if (state.peek(4) !== '<!--') {
		return
	}
	const onset = state.pos
	const closePos = state.src.indexOf('-->', state.pos)
	state.pos = closePos
	if (state.peek(3) !== '-->') {
		throw new Error(
			'Unclosed comment: "' + state.src.slice(onset, onset + 10) + '..."'
		)
	}
	state.pos += 3
}
