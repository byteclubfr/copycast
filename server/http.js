var path = require('path')
var fs = require('fs')
var os = require('os')
var http = require('http')

const clientPath = path.resolve(`${__dirname}/../client`)

const clientFiles = {
	'/index.html': 'text/html',
	'/index.css': 'text/css',
	'/bundle.js': 'application/javascript'
}

// utils

const sendFile = (res, name, mime) => {
	res.writeHead(200, {'Content-Type': mime})
	fs.readFile(`${clientPath}${name}`, 'utf8', (err, content) => {
		if (err) throw err
		res.end(content)
	})
}

const displayAddresses = (port) => {
	const interfaces = os.networkInterfaces()
	Object.keys(interfaces).forEach((dev) => {
		interfaces[dev].forEach((details) => {
			if (details.family !== 'IPv4') return
			console.log('http://' + details.address + ':' + port)
		})
	})
}

exports.createServer = () => {
	const server = http.createServer()
	server.on('request', (req, res) => {
		var url = req.url === '/' ? '/index.html' : req.url
		if (clientFiles[url]) sendFile(res, url, clientFiles[url])
		// else res.end()
	})
	return server
}
exports.displayAddresses = displayAddresses
