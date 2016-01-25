// TODO get from argv
const PATH = '.'
const PORT = 42000

var http = require('./server/http')
var server = http.createServer()
var io = require('socket.io')(server)

var getWatcher = require('./server/watcher').getWatcher

// state
var tree = {
	name: 'root',
	toggled: true,
	children: []
}

var broadcastTree = (tree) => io.emit('tree', tree)

getWatcher(PATH, tree, broadcastTree)

server.listen(PORT)
http.displayAddresses(PORT)

// socket
io.on('connection', (socket) => {
	var ip = socket.request.connection.remoteAddress
	console.log('socket connection', ip)
	broadcastTree(tree)
	socket.on('disconnect', () => {
		console.log('socket disconnection', ip)
	})
})
