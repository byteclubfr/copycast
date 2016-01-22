import Rx from 'rx'
import Cycle from '@cycle/core'
import {pre, makeDOMDriver} from '@cycle/dom'
var socket = io.connect()

socket.on('connect', () => console.log('connected'))
socket.on('disconnect', (err) => console.error('disconnected', err))
socket.on('error', (err) => console.error('error', err))

socket.on('tree', (tree) => console.log(tree))

function main({ DOM, socketIO }) {
	const vtree$ = socketIO.get('tree')
			.startWith('Loading…')
			.map(payload => pre(JSON.stringify(payload, null, 2)))

	return {
		DOM: vtree$
	}
}

Cycle.run(main, {
	DOM: makeDOMDriver('#app'),
	socketIO: createSocketIODriver()
})

function createSocketIODriver() {
	function get(eventName) {
		return Rx.Observable.create(observer => {
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
