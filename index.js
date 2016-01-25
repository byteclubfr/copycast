var os = require('os')
var fs = require('fs')
var server = require('http').createServer()
var io = require('socket.io')(server)

var getWatcher = require('./server/watcher').getWatcher

const PATH = '.'

// state
var tree = {
	name: 'root',
	toggled: true,
	children: []
}

var broadcastTree = (tree) => io.emit('tree', tree)

getWatcher(PATH, tree, broadcastTree)

// http utils
var sendFile = (res, name, mime) => {
	res.writeHead(200, {'Content-Type': mime})
	fs.readFile(`client${name}`, 'utf8', (err, content) => {
		if (err) throw err
		res.end(content)
	})
}

// http
const displayAddresses = () => {
	const interfaces = os.networkInterfaces()
	Object.keys(interfaces).forEach((dev) => {
		interfaces[dev].forEach((details) => {
			if (details.family !== 'IPv4') return
			console.log('http://' + details.address + ':' + PORT)
		})
	})
}
const clientFiles = {
	'/index.html': 'text/html',
	'/index.css': 'text/css',
	'/bundle.js': 'application/javascript'
}
const PORT = 42000

server.on('request', (req, res) => {
	var url = req.url === '/' ? '/index.html' : req.url
	if (clientFiles[url]) sendFile(res, url, clientFiles[url])
	// else res.end()
})
server.listen(PORT)
displayAddresses()

// socket
io.on('connection', (socket) => {
	var ip = socket.request.connection.remoteAddress
	console.log('socket connection', ip)
	broadcastTree(tree)
	socket.on('disconnect', () => {
		console.log('socket disconnection', ip)
	})
})
