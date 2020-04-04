const nameOffset = '= \t\n\r>'

export const parseAttribute = state => {

	/// Parses an element's attributes into an Object.
	/// => undefined

	if (/\s/.test(state.peek())) {
		return
	}

	const onset = state.pos
	while (!nameOffset.includes(state.peek())) {
		state.pos++
	}
	const attrName = state.src.slice(onset, state.pos)
	state.hostNode[attrName] = true
	
	if (state.peek() === '=') {
		state.pos++ // step past: =
		if (state.peek() !== '"') {
			throw new Error(
				`Invalid ${attrName} attribute at ${state.pos} (double quotes are required).`
			)
		} else {
			state.pos++ // step post opening double quote.
		}
		const valueOnset = state.pos
		state.pos = state.src.indexOf('"', state.pos)
		if (state.peek() !== '"') {
			throw new Error(
				`Invalid ${attrName} attribute at ${onset} (double quotes are required).`
			)
		}
		const attrValue = state.src.slice(valueOnset, state.pos)
		if (attrName === 'class') {
			state.hostNode.className = attrValue
		} else {
			state.hostNode[attrName] = attrValue
		}
	}
}