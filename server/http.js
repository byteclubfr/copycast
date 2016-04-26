const os = require('os')
const http = require('http')
const finalhandler = require('finalhandler')
const serveStatic = require('serve-static')
const compression = require('compression')()
const path = require('path')

const treeWalker = require('./tree-walker')
const flatten = treeWalker.flatten
const hasChild = treeWalker.hasChild
const Zip = require('easy-zip').EasyZip

const serve = serveStatic(`${__dirname}/../client`)

// used to communicate easily the local network IP address to students
const displayAddresses = (port) => {
	const interfaces = os.networkInterfaces()
	Object.keys(interfaces).forEach((dev) => {
		interfaces[dev].forEach((details) => {
			if (details.family !== 'IPv4') return
			console.log(`http://${details.address}:${port}`) // eslint-disable-line
		})
	})
}

// Handle '/{root}.zip' URL
const zipper = tree => (req, res, next) => {
	if (req.url === '/' + tree.name + '.zip') {
		const files = flatten(tree, false)
		const zip = new Zip()
		zip.batchAdd(files.map(f => ({ source: f, target: f })), () => {
			zip.writeToResponse(res, tree.name)
		})
		return
	}
	next()
}

// Handle '/download/{path}' URLs
const prefixedDownload = (prefix, root, tree) => {
	const download = serveStatic(root, {
		dotfiles: 'allow',
		setHeaders: function (res, filename) {
			// Force download
			res.setHeader('Content-Description', 'File Transfer')
			res.setHeader('Content-Type', 'application/octet-stream')
			res.setHeader('Content-Disposition', 'attachment; filename=' + path.basename(filename))
			res.setHeader('Content-Transfer-Encoding', 'binary')
			res.setHeader('Expires', '0')
			res.setHeader('Cache-Control', 'must-revalidate, post-check=0, pre-check=0')
			res.setHeader('Pragma', 'public')
		}
	})

	// normalize prefix: prepend/append slashes
	const fullPrefix = '/' + prefix.replace(/^\/?(.*?)\/?$/, '$1') + '/'

	return (req, res, next) => {
		if (req.url.indexOf(fullPrefix) !== 0) {
			return next() // exclude URLs not starting with prefix
		}
		const url = req.url.substring(fullPrefix.length - 1)
		if (!hasChild(tree, url)) {
			return next() // exclude unexposed files
		}
		const unprefixedReq = Object.assign({}, req, { url })
		return download(unprefixedReq, res, next)
	}
}

const onerror = err => console.error(err.stack || err.toString()) // eslint-disable-line no-console

const handler = (middlewares) => (req, res) => middlewares.length > 0
	? middlewares[0](req, res, err => err
			? finalhandler(req, res, { onerror })(err)
			: handler(middlewares.slice(1))(req, res)
		)
	: null

exports.createServer = (root, tree) => {
	const download = prefixedDownload('download', root, tree)
	return http.createServer(handler([
		zipper(tree),
		compression,
		serve,
		download
	]))
}

exports.displayAddresses = displayAddresses
