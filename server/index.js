const path = require('path')
const socketIO = require('socket.io')
const debug = require('debug')('socket')

const http = require('./http')
const createWatcher = require('./watcher').createWatcher

exports.start = (options) => {
	const DIR = path.resolve(options.dir || '.')
	const PORT = Number(options.port) || 42000

	// state
	var tree = { name: path.basename(DIR), children: [] }

	const server = http.createServer(DIR, tree)
	const io = socketIO(server)
	server.listen(PORT, () => http.displayAddresses(PORT))

	const broadcastTree = (tree) => io.emit('tree', tree)

	createWatcher(DIR, tree, broadcastTree)

	io.on('connection', (socket) => {
		const ip = socket.request.connection.remoteAddress
		debug('connection', ip)
		broadcastTree(tree)
		socket.on('disconnect', () => debug('disconnection', ip))
	})
}
