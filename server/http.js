const os = require('os')
const http = require('http')
const finalhandler = require('finalhandler')
const serveStatic = require('serve-static')

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

exports.createServer = () =>
	http.createServer((req, res) => serve(req, res, finalhandler(req, res)))

exports.displayAddresses = displayAddresses
