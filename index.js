var os = require('os')
var fs = require('fs')
var P = require('path')
var chokidar = require('chokidar')
var server = require('http').createServer()
var io = require('socket.io')(server)

const PATH = '.'

// state
var tree = {
	name: 'root',
	toggled: true,
	children: []
}

// watcher utils
var createDir = (name) => ({ name, children: [] })
var createFile = (name, content) => ({ name, content })
var getChildren = (tree, path) => {
	var children = tree.children
	path.split('/').forEach((dir) => {
		var child = children.find(c => c.name === dir)
		if (child) children = child.children
	})
	return children
}
var addChild = (children, child) => {
	children.push(child)
	children.sort((a, b) => a.name > b.name)
}
var deleteChild = (tree, path) => {
	var children = getChildren(tree, P.dirname(path))
	children.splice(
		children.findIndex(c => c.name === P.basename(path)),
		1
	)
	return children
}
// var printTree = () => console.log(JSON.stringify(tree, null, 2))
var printTree = () => broadcastTree()

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
	printTree()
})
.on('add', (path) => {
	console.log(`+ f ${path}`)

	fs.readFile(path, 'utf8', (err, content) => {
		addChild(
			getChildren(tree, P.dirname(path)),
			createFile(P.basename(path), content)
		)
		printTree()
	})
})
.on('unlinkDir', (path) => {
	console.log(`- d ${path}`)

	deleteChild(tree, path)
	printTree()
})
.on('unlink', (path) => {
	console.log(`- f ${path}`)

	deleteChild(tree, path)
	printTree()
})
.on('change', (path) => {
	console.log(`= f ${path}`)

	fs.readFile(path, 'utf8', (err, content) => {
		getChildren(tree, P.dirname(path))
			.find(c => c.name === P.basename(path))
			.content = content
		printTree()
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
var broadcastTree = () => io.emit('tree', tree)

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
	printTree()
	socket.on('disconnect', () => {
		console.log('socket disconnection', ip)
	})
})
