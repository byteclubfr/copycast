import { Observable } from 'rx'
import Cycle from '@cycle/core'
import {aside, div, ul, li, makeDOMDriver} from '@cycle/dom'

import createSocketIODriver from './cycle-socket.io'

var socket = io.connect()

socket.on('connect', () => console.log('connected'))
socket.on('disconnect', (err) => console.error('disconnected', err))
socket.on('error', (err) => console.error('error', err))
socket.on('tree', (tree) => console.log(tree))

function main({ socketIO }) {
	const res$ = socketIO.get('tree').startWith('Loading…')
	const vtree$ = Observable.just()
		.map(() =>
				 div('#app', [
					Sidebar({ res$ }).DOM,
					Editor({ res$ }).DOM
				])
		)

	return {
		DOM: vtree$
	}
}

// components

function Sidebar ({ res$ }) {
	const vtree$ = res$
			.map(payload => aside('.sidebar', Dir(payload)))
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

function Editor ({ res$ }) {
	const vtree$ = res$
		.map(payload => div('.editor', 'Editor'))
	return {
		DOM: vtree$
	}
}

Cycle.run(main, {
	DOM: makeDOMDriver('#root'),
	socketIO: createSocketIODriver(socket)
})
