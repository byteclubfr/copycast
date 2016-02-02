var P = require('path')

const createDir = (name) => ({ name, children: [] })

const createFile = (name, content) => ({ name, content })

const getChildren = (tree, path) => {
	var children = tree.children
	path.split('/').forEach((dir) => {
		const child = children.find(c => c.name === dir)
		if (child) children = child.children
	})
	return children
}

const addChild = (children, child) => {
	children.push(child)
	// sort dirs by alpha, then files by alpha
	children.sort((a, b) => {
		// dir vs file
		if (a.children && !b.children) return -1
		// file vs dir
		if (!a.children && b.children) return 1
		// alpha
		return a.name > b.name
	})
}

const deleteChild = (tree, path) => {
	var children = getChildren(tree, P.dirname(path))
	children.splice(
		children.findIndex(c => c.name === P.basename(path)),
		1
	)
	return children
}

const printTree = (tree) => console.log(JSON.stringify(tree, null, 2)) // eslint-disable-line

module.exports = {
	createDir, createFile, getChildren, addChild, deleteChild, printTree
}

