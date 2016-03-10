const lt = require('localtunnel')
const EventEmitter = require('events').EventEmitter

const openTunnel = (e, options, emitUrl) => lt(options.port, options, (err, tunnel) => {
	if (err) {
		return e.emit('error', err)
	}
	if (emitUrl) {
		e.emit('url', tunnel.url)
	}
	tunnel.on('error', (err) => e.emit('error', err))
	tunnel.on('close', () => e.emit('close'))
})

exports.open = (port) => openTunnel(new EventEmitter(), {
	//local_host: 'localhost',
	//subdomain: '',
	host: 'http://localtunnel.me',
	port: port,
}, true) // First time open: emit 'url' event
