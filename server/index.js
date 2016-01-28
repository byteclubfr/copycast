var path = require('path')
var http = require('./http')
var socketIO = require('socket.io')
var createWatcher = require('./watcher').createWatcher

exports.start = (options) => {
	const DIR = path.resolve(options.dir || '.')
	const PORT = Number(options.port) || 42000

	// state
	var tree = { name: 'root', children: [] }

	var server = http.createServer()
	var io = socketIO(server)
	server.listen(PORT, () => http.displayAddresses(PORT))

	var broadcastTree = (tree) => io.emit('tree', tree)

	createWatcher(DIR, tree, broadcastTree)

	io.on('connection', (socket) => {
		var ip = socket.request.connection.remoteAddress
		console.log('socket connection', ip)
		broadcastTree(tree)
		socket.on('disconnect', () => console.log('socket disconnection', ip))
	})
}
