import { li, span } from '@cycle/dom'

import { PATH_SEP } from '../utils/tree-walker'

export default ({ path, file, sel }) => {
	const { name, updatedAt } = file
	const id = `${path}${PATH_SEP}${name}`
	let elapsed = ''
	if (updatedAt) {
		let ago = Math.round((Date.now() - updatedAt) / 1000)
		if (ago <= 180) {
			elapsed = `${ago}s`
		}
	}
	return li(`.file${ sel === id ? '.selected' : '' }`, [
		span('.filename', { data: { id } }, name),
		span('.elapsed', { data: { id } }, elapsed)
	])
}

