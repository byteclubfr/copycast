var fs = require('fs')
var P = require('path')
var chokidar = require('chokidar')

// state
var tree = {
	name: 'root',
	toggled: true,
	children: []
}

// utils
var createDir = (name) => ({ name, children: [] })
var createFile = (name, content) => ({ name, content })
var getChildren = (path) => {
	var children = tree.children
	path.split('/').forEach((dir) => {
		var child = children.find(c => c.name === dir)
		if (child) children = child.children
	})
	return children
}
var addChild = (children, child) => {
	children.push(child)
	children.sort((a, b) => a.name > b.name)
}
var deleteChild = (path) => {
	var children = getChildren(P.dirname(path))
	children.splice(
		children.findIndex(c => c.name === P.basename(path)),
		1
	)
	return children
}
var printTree = () => console.log(JSON.stringify(tree, null, 2))

// events
chokidar.watch('test', {
	ignored: /node_modules/,
	persistent: true
})
.on('addDir', (path) => {
	console.log(`+ d ${path}`)
	if (path === '.') return

	addChild(
		getChildren(path),
		createDir(P.basename(path))
	)
	printTree()
})
.on('add', (path) => {
	console.log(`+ f ${path}`)

	fs.readFile(path, 'utf8', (err, content) => {
		addChild(
			getChildren(P.dirname(path)),
			createFile(P.basename(path), content)
		)
		printTree()
	})
})
.on('unlinkDir', (path) => {
	console.log(`- d ${path}`)

	deleteChild(path)
	printTree()
})
.on('unlink', (path) => {
	console.log(`- f ${path}`)

	deleteChild(path)
	printTree()
})
.on('change', (path) => {
	console.log(`= f ${path}`)

	fs.readFile(path, 'utf8', (err, content) => {
		getChildren(P.dirname(path))
			.find(c => c.name === P.basename(path))
			.content = content
		printTree()
	})
})
.on('error', (error) => console.log(`Watcher error: ${error}`))
.on('ready', () => console.log('Initial scan complete. Ready for changes'))
