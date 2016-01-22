import { Observable } from 'rx'
import Cycle from '@cycle/core'
import {aside, ul, li, makeDOMDriver} from '@cycle/dom'
import isolate from '@cycle/isolate'

var socket = io.connect()

socket.on('connect', () => console.log('connected'))
socket.on('disconnect', (err) => console.error('disconnected', err))
socket.on('error', (err) => console.error('error', err))
socket.on('tree', (tree) => console.log(tree))

function main({ socketIO }) {
	const res$ = socketIO.get('tree').startWith('Loading…')
	const sidebar = Sidebar({ res$ })

	return {
		DOM: sidebar.DOM
	}
}

// components

function Sidebar ({ res$ }) {
	const vtree$ = res$
			.map(payload =>
					 aside('.sidebar', Dir(payload)))
	return {
		DOM: vtree$
	}
}

function Dir (branch) {
	if (!branch.children) return branch
	const branches = branch.children.map((child) => {
		if (child.children) return Dir(child)
		return li('.filename', child.name)
	})
	return ul('.dir',
		[li('.dirname', branch.name)].concat(branches)
	)
}


Cycle.run(main, {
	DOM: makeDOMDriver('#app'),
	socketIO: createSocketIODriver()
})

function createSocketIODriver() {
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
