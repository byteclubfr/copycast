var P = require('path')
var fs = require('fs')
var chokidar = require('chokidar')

// TODO use destructuring when available
var tw = require('./tree-walker')
var createDir = tw.createDir
var createFile = tw.createFile
var getChildren = tw.getChildren
var addChild = tw.addChild
var deleteChild = tw.deleteChild

exports.createWatcher = (root, tree, done) =>
	chokidar.watch(root, {
		ignored: /node_modules|\.git/,
		persistent: true,
		awaitWriteFinish: {
			stabilityThreshold: 500,
			pollInterval: 100
		}
	})
	.on('addDir', (path) => {
		if (path === root) return
		console.log(`+ d ${path}`)

		addChild(
			getChildren(tree, path),
			createDir(P.basename(path))
		)
		done(tree)
	})
	.on('add', (path) => {
		console.log(`+ f ${path}`)

		fs.readFile(path, 'utf8', (err, content) => {
			addChild(
				getChildren(tree, P.dirname(path)),
				createFile(P.basename(path), content)
			)
			done(tree)
		})
	})
	.on('unlinkDir', (path) => {
		console.log(`- d ${path}`)

		deleteChild(tree, path)
		done(tree)
	})
	.on('unlink', (path) => {
		console.log(`- f ${path}`)

		deleteChild(tree, path)
		done(tree)
	})
	.on('change', (path, stats) => {
		console.log(`= f ${path}`)

		fs.readFile(path, 'utf8', (err, content) => {
			const c = getChildren(tree, P.dirname(path))
				.find(c => c.name === P.basename(path))
			c.content = content
			c.updatedAt = stats.mtime.getTime()
			done(tree)
		})
	})
	.on('error', (error) => console.log(`Watcher error: ${error}`))
	.on('ready', () => console.log('Initial scan complete. Ready for changes'))

