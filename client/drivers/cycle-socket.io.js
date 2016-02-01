import { Observable } from 'rx'

export default function createSocketIODriver() {

	const socket = io.connect() // eslint-disable-line

	socket.on('connect', () => console.log('connected'))
	socket.on('disconnect', (err) => console.error('disconnected', err))
	socket.on('error', (err) => console.error('error', err))

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
