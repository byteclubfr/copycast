var os = require('os')
var fs = require('fs')
var P = require('path')
var chokidar = require('chokidar')
var server = require('http').createServer()
var io = require('socket.io')(server)

// TODO use destructuring when available
var tw = require('./server/tree-walking')
var createDir = tw.createDir
var createFile = tw.createFile
var getChildren = tw.getChildren
var addChild = tw.addChild
var deleteChild = tw.deleteChild

const PATH = '.'

// state
var tree = {
	name: 'root',
	toggled: true,
	children: []
}

var printTree = (tree) => broadcastTree(tree)

// events
chokidar.watch(PATH, {
	ignored: /node_modules|\.git/,
	persistent: true
})
.on('addDir', (path) => {
	console.log(`+ d ${path}`)
	if (path === '.') return

	addChild(
		getChildren(tree, path),
		createDir(P.basename(path))
	)
	printTree(tree)
})
.on('add', (path) => {
	console.log(`+ f ${path}`)

	fs.readFile(path, 'utf8', (err, content) => {
		addChild(
			getChildren(tree, P.dirname(path)),
			createFile(P.basename(path), content)
		)
		printTree(tree)
	})
})
.on('unlinkDir', (path) => {
	console.log(`- d ${path}`)

	deleteChild(tree, path)
	printTree(tree)
})
.on('unlink', (path) => {
	console.log(`- f ${path}`)

	deleteChild(tree, path)
	printTree(tree)
})
.on('change', (path) => {
	console.log(`= f ${path}`)

	fs.readFile(path, 'utf8', (err, content) => {
		getChildren(tree, P.dirname(path))
			.find(c => c.name === P.basename(path))
			.content = content
		printTree(tree)
	})
})
.on('error', (error) => console.log(`Watcher error: ${error}`))
.on('ready', () => console.log('Initial scan complete. Ready for changes'))

// http utils
var sendFile = (res, name, mime) => {
	res.writeHead(200, {'Content-Type': mime})
	fs.readFile(`client${name}`, 'utf8', (err, content) => {
		if (err) throw err
		res.end(content)
	})
}
var broadcastTree = (tree) => io.emit('tree', tree)

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
	printTree(tree)
	socket.on('disconnect', () => {
		console.log('socket disconnection', ip)
	})
})
