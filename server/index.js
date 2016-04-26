const path = require('path')
const socketIO = require('socket.io')
const debug = require('debug')('socket')

const http = require('./http')
const createWatcher = require('./watcher').createWatcher

const parseDomain = require('parse-domain')
const config = require('./configuration')
const openTunnel = require('./localtunnel').open


exports.start = (options) => {
	if (options.localtunnel === true) {
		// requested a localtunnel without specifying subdomain
		// check if we find a previous one
		options.localtunnel = config.get('localtunnel_subdomain') || true
	}

	const DIR = path.resolve(options.dir || '.')
	const PORT = Number(options.port) || 42000
	const LT = options.localtunnel || false

	// state
	const tree = { name: path.basename(DIR), children: [] }

	const server = http.createServer(DIR, tree)
	const io = socketIO(server)
	server.listen(PORT, () => {
		http.displayAddresses(PORT, tree.name)
		if (LT) {
			openTunnel({
				port: PORT,
				subdomain: (typeof LT === 'string') ? LT : false
			})
			.on('url', (url) => {
				console.log(url) // eslint-disable-line
				// store subdomain
				const domain = parseDomain(url)
				if (domain) {
					config.set({ localtunnel_subdomain: domain.subdomain })
				}
			})
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
