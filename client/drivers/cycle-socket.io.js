import io from 'socket.io-client'
import { Observable, BehaviorSubject } from 'rx'

export default function createSocketIODriver() {
	let socketOptions = {}
	if (document.location.hostname.match(/(\.localtunnel\.me|\.ngrok\.io)$/)) {
		// Websocket transports screws the whole thing when tunnelling through localtunnel
		socketOptions = { transports: ['polling'] }
	}

	const socket = io.connect(socketOptions)

	// 'connect' and 'disconnect' cannot be implemented just like 'get' as
	// those events could be emitted BEFORE observable is actually ready
	const statusSubject = new BehaviorSubject({ connected: false, status: 'connecting', error: null })
	const status$ = statusSubject.asObservable()
	const watchStatusChange = (status, connected, isErr = false) =>
		socket.on(status, e => statusSubject.onNext({
			connected,
			status,
			error: isErr ? e : null
		}))
	watchStatusChange('error', false, true)
	watchStatusChange('connect', true)
	watchStatusChange('disconnect', false)
	watchStatusChange('reconnect', true)
	//watchStatusChange('reconnect_attempt', false)
	//watchStatusChange('reconnecting', false)
	watchStatusChange('reconnect_error', false, true)
	//watchStatusChange('reconnect_failed', false)

	const get = eventName =>
		Observable.create(obs => socket.on(eventName, obs.onNext.bind(obs)))

	function publish(messageType, message) {
		socket.emit(messageType, message)
	}

	return function socketIODriver(events$) {
		events$.forEach(event => publish(event.messageType, event.message))
		return {
			get,
			status$: status$,
			dispose: socket.destroy.bind(socket)
		}
	}
}
