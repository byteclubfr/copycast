const P = require('path')
const fs = require('fs')
const chokidar = require('chokidar')
const debug = require('debug')('watcher')

const { createDir, createFile, getChildren, addChild,
	deleteChild, ignoreToGlobs } = require('./tree-walker')

// TODO improve heuristics
const isHugeFile = (name, content) => {
	if (content.split('\n').length > 2000) return true
	if (content.length > 200000) return true

	return false
}

const ignoredPatterns = () => {
	return ignoreToGlobs('.gitignore')
}

exports.createWatcher = (root, tree, done) => {
	// unfortunate helper, see "change" event handler below
	const addFile = (path, content, updatedAt) => {
		const name = P.basename(path)
		content = isHugeFile(name, content) ? 'Content too huge' : content
		const child = createFile(name, content)
		if (updatedAt) child.updatedAt = updatedAt
		addChild(getChildren(tree, P.dirname(path)), child)
		done(tree)
	}

	return chokidar.watch(root, {
		ignored: ignoredPatterns() // Get ignored files from standard ignore files
			// and add static files and files we anyway always want to ignore
			.concat(['**/.git', '**/*.gif', '**/*.jpg', '**/*.png', '**/*.eot', '**/*.ttf', '**/*.woff']),
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

		fs.readFile(path, 'utf8', (err, content) => addFile(path, content))
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

			if (c) {
				c.content = content
				c.updatedAt = stats.mtime.getTime()
				done(tree)
			} else {
				// chokidar edge case when a "change" is preceded by a phantom "unlink"
				debug('~f', path)
				addFile(path, content, Date.now())
			}
		})
	})
	.on('error', (error) => debug('Watcher error', error))
	.on('ready', () => debug('Initial scan complete. Ready for changes'))
}
