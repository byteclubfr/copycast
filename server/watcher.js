var P = require('path')
var fs = require('fs')
var chokidar = require('chokidar')

// TODO use destructuring when available
var tw = require('./tree-walking')
var createDir = tw.createDir
var createFile = tw.createFile
var getChildren = tw.getChildren
var addChild = tw.addChild
var deleteChild = tw.deleteChild

exports.getWatcher = (path, tree, printTree) =>
	chokidar.watch(path, {
		ignored: /node_modules|\.git/,
		persistent: true
	})
	.on('addDir', (path) => {
		console.log(`+ d ${path}`)
		if (path === '.') return

		addChild(
			getChildren(tree, path),
			createDir(P.basename(path))
		)
		printTree(tree)
	})
	.on('add', (path) => {
		console.log(`+ f ${path}`)

		fs.readFile(path, 'utf8', (err, content) => {
			addChild(
				getChildren(tree, P.dirname(path)),
				createFile(P.basename(path), content)
			)
			printTree(tree)
		})
	})
	.on('unlinkDir', (path) => {
		console.log(`- d ${path}`)

		deleteChild(tree, path)
		printTree(tree)
	})
	.on('unlink', (path) => {
		console.log(`- f ${path}`)

		deleteChild(tree, path)
		printTree(tree)
	})
	.on('change', (path) => {
		console.log(`= f ${path}`)

		fs.readFile(path, 'utf8', (err, content) => {
			getChildren(tree, P.dirname(path))
				.find(c => c.name === P.basename(path))
				.content = content
			printTree(tree)
		})
	})
	.on('error', (error) => console.log(`Watcher error: ${error}`))
	.on('ready', () => console.log('Initial scan complete. Ready for changes'))

