const P = require('path')
const fs = require('fs')

const createDir = (name) => ({ name, children: [] })

const createFile = (name, content) => ({ name, content })

const getChildren = (tree, path) => {
	let children = tree.children
	path.split(P.sep).forEach((dir) => {
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
	let children = getChildren(tree, P.dirname(path))
	children.splice(
		children.findIndex(c => c.name === P.basename(path)),
		1
	)
	return children
}

const printTree = (tree) => console.log(JSON.stringify(tree, null, 2)) // eslint-disable-line

const ignoreToGlobs = (ignoreFile) => {
	try {
		return _ignoreToGlobs(fs.readFileSync(ignoreFile))
	} catch (e) {
		return []
	}
}

const _ignoreToGlobs = (content) => String(content).split('\n')
	.map(line => line.trim())
	.filter(line => line.length > 0) // Ignore empty lines
	.filter(line => !line.match(/^#/)) // Ignore comments
	.map(glob => P.join('**', glob)) // Convert "node_modules" to "**/node_modules"
	.reduce((globs, glob) => globs.concat([glob, P.join(glob, '**')]), []) // Ignore glob itself, but also sub-paths

const flatten = (tree, withRoot) => _flatten(tree, withRoot ? tree.name : '')
const _flatten = (node, path) => {
	if (Array.isArray(node.children)) {
		return node.children.map(child => _flatten(child, P.join(path, child.name)))
			// Array of Array of String => Array of String
			.reduce((arr, curr) => arr.concat(curr), [])
	} else if (typeof node.content === 'string') {
		// Single file
		return [path]
	}
}

const hasChild = (tree, path) => {
	const parsed = P.parse(path)
	return getChildren(tree, parsed.dir)
		.some(child => child.name === parsed.base)
}

module.exports = {
	createDir, createFile, getChildren, addChild, deleteChild, printTree, ignoreToGlobs, flatten, hasChild
}

