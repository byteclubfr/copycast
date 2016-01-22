import { Observable } from 'rx'

export default function createSocketIODriver(socket) {
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
