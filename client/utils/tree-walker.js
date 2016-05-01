export const PATH_SEP = '|'

export const getChildren = (tree, path) => {
	let children = tree.children
	path.forEach((dir) => {
		const child = children.find(c => c.name === dir)
		if (child) children = child.children
	})
	return children
}

const getContent = (tree, selected) => {
	if (!selected) return null

	let path = selected.split(PATH_SEP)
	path.shift()
	let filename = path.pop()

	const file = getChildren(tree, path).find(c => c.name === filename)
	return file ? file.content : null
}

// gather the last DIFF_COUNT unique contents for Time Travel
export const getContents = (trees, selected) => {
	const contents = trees.map(tree => getContent(tree, selected)).filter(x => x)
	return [...new Set(contents)]
}
