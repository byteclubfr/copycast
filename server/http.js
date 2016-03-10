const os = require('os')
const http = require('http')
const finalhandler = require('finalhandler')
const serveStatic = require('serve-static')
const compression = require('compression')()

const flatten = require('./tree-walker').flatten
<<<<<<< HEAD
var Zip = require('easy-zip').EasyZip
=======
const Zip = require('easy-zip').EasyZip
>>>>>>> master

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
const zipper = (tree, req, res, next) => {
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

exports.createServer = (tree) =>
	http.createServer((req, res) =>
		zipper(tree, req, res, () =>
			compression(req, res, () =>
				serve(req, res, finalhandler(req, res)))))

exports.displayAddresses = displayAddresses
