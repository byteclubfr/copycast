import { Observable } from 'rx'

export default function createSocketIODriver() {
	let socketOptions = {}
	if (document.location.hostname.match(/(\.localtunnel\.me|\.ngrok\.io)$/)) {
		// Websocket transports screws the whole thing when tunnelling through localtunnel
		socketOptions = { transports: ['polling'] }
	}

	const socket = io.connect(socketOptions) // eslint-disable-line

	// socket.on('connect', () => console.log('connected'))
	// socket.on('disconnect', (err) => console.error('disconnected', err))
	// socket.on('error', (err) => console.error('error', err))

	function get(eventName) {
		return Observable.create(observer => {
			const sub = socket.on(eventName, function (message) {
				observer.onNext(message)
			})
			return function dispose() {
				sub.dispose()
			}
		})
	}

	function publish(messageType, message) {
		socket.emit(messageType, message)
	}

	return function socketIODriver(events$) {
		events$.forEach(event => publish(event.messageType, event.message))
		return {
			get,
			dispose: socket.destroy.bind(socket)
		}
	}
}
