import { li, ul } from '@cycle/dom'

import { PATH_SEP } from '../utils/tree-walker'
import File from './File'

const Dir = ({ root, path, tree, sel, collapsed }) => {
	if (!tree || !tree.children) return

	path = root ? tree.name : `${path}${PATH_SEP}${tree.name}`
	let klass = '.dirname'
	let trees = []
	if (collapsed.has(path)) {
		klass += '.collapsed'
	} else {
		trees = tree.children.map((child) => {
			return (child.children)
				? Dir({ path, tree: child, sel, collapsed })
				: File({ path, file: child, sel })
		})
	}
	return ul('.dir', [li(klass, { data: { id: path } }, tree.name), ...trees])
}

// recursive
export default Dir

