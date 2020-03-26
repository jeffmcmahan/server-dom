export const parseComment = state => {

	/// Consumes a comment (ignoring it entirely).
	/// => undefined

	if (state.end() || state.peek(4) !== '<!--') {
		return
	}
	const onset = state.pos
	state.pos += 4
	while (!state.end() && state.peek(3) !== '-->') {
		state.pos++
	}
	if (state.peek(3) !== '-->') {
		throw new Error(
			'Unclosed comment: "' + state.src.slice(onset, onset + 10) + '..."'
		)
	}
	state.pos += 3
}
