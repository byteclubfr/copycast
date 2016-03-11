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

// options: port, subdomain, host, local_host
exports.open = (options) => openTunnel(new EventEmitter(), options, true)
