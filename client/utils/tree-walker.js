export const PATH_SEP = '|'

export const getChildren = (tree, path) => {
	let children = tree.children
	path.forEach((dir) => {
		const child = children.find(c => c.name === dir)
		if (child) children = child.children
	})
	return children
}

export const getContent = (tree, selected) => {
	if (!selected) return null

	let path = selected.split(PATH_SEP)
	path.shift()
	let filename = path.pop()

	const file = getChildren(tree, path).find(c => c.name === filename)
	return file ? file.content : null
}

