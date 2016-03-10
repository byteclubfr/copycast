const path = require('path')
const socketIO = require('socket.io')
const debug = require('debug')('socket')

const http = require('./http')
const createWatcher = require('./watcher').createWatcher

const openTunnel = require('./localtunnel').open


exports.start = (options) => {
	const DIR = path.resolve(options.dir || '.')
	const PORT = Number(options.port) || 42000
	const LT = options.localtunnel || false

	// state
	var tree = { name: path.basename(DIR), children: [] }

	const server = http.createServer(tree)
	const io = socketIO(server)
	server.listen(PORT, () => {
		http.displayAddresses(PORT)
		if (LT) {
			openTunnel({
				port: PORT,
				subdomain: (typeof LT === 'string') ? LT : false
			})
			.on('url', console.log) // eslint-disable-line
			.on('error', (err) => console.error('[localtunnel] %s', err)) // eslint-disable-line
		}
	})

	const broadcastTree = (tree) => io.emit('tree', tree)

	createWatcher(DIR, tree, broadcastTree)

	io.on('connection', (socket) => {
		const ip = socket.request.connection.remoteAddress
		debug('connection', ip)
		broadcastTree(tree)
		socket.on('disconnect', () => debug('disconnection', ip))
	})
}
