const P = require('path')
const fs = require('fs')
const chokidar = require('chokidar')
const debug = require('debug')('watcher')

// TODO use destructuring when available
const tw = require('./tree-walker')
const createDir = tw.createDir
const createFile = tw.createFile
const getChildren = tw.getChildren
const addChild = tw.addChild
const deleteChild = tw.deleteChild

// TODO improve heuristics
const isHugeFile = (name, content) => {
	if (name === 'bundle.js') return true
	if (/\.min\.js/.test(name)) return true
	if (content.split('\n').length > 2000) return true

	return false
}

exports.createWatcher = (root, tree, done) =>
	chokidar.watch(root, {
		ignored: /node_modules|\.git|\.gif|\.jpg|\.png|\.eot|\.ttf|\.woff/,
		persistent: true,
		awaitWriteFinish: {
			stabilityThreshold: 500,
			pollInterval: 100
		}
	})
	.on('addDir', (path) => {
		if (path === root) return
		debug('+d', path)

		addChild(
			getChildren(tree, path),
			createDir(P.basename(path))
		)
		done(tree)
	})
	.on('add', (path) => {
		debug('+f', path)

		fs.readFile(path, 'utf8', (err, content) => {
			const name = P.basename(path)
			content = isHugeFile(name, content) ? 'Content too huge' : content
			addChild(
				getChildren(tree, P.dirname(path)),
				createFile(name, content)
			)
			done(tree)
		})
	})
	.on('unlinkDir', (path) => {
		debug('-d', path)

		deleteChild(tree, path)
		done(tree)
	})
	.on('unlink', (path) => {
		debug('-f', path)

		deleteChild(tree, path)
		done(tree)
	})
	.on('change', (path, stats) => {
		debug('=f', path)

		fs.readFile(path, 'utf8', (err, content) => {
			const c = getChildren(tree, P.dirname(path))
				.find(c => c.name === P.basename(path))
			c.content = content
			c.updatedAt = stats.mtime.getTime()
			done(tree)
		})
	})
	.on('error', (error) => debug('Watcher error', error))
	.on('ready', () => debug('Initial scan complete. Ready for changes'))

