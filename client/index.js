import { Observable } from 'rx'
import { run } from '@cycle/core'
import {aside, div, ul, li, pre, makeDOMDriver} from '@cycle/dom'

import createSocketIODriver from './drivers/cycle-socket.io'

var socket = io.connect()

socket.on('connect', () => console.log('connected'))
socket.on('disconnect', (err) => console.error('disconnected', err))
socket.on('error', (err) => console.error('error', err))
socket.on('tree', (tree) => console.debug(tree))

// tree walking

const getChildren = (payload, path) => {
	let children = payload.children
	path.forEach((dir) => {
		const child = children.find(c => c.name === dir)
		if (child) children = child.children
	})
	return children
}

const getContent = (payload, selected) => {
	if (!selected) return null

	let path = selected.split('-')
	// remove 'root'
	path.shift()
	path.shift()
	let ext = path.pop()
	let filename = `${path.pop()}.${ext}`

	const file = getChildren(payload, path).find(c => c.name === filename)
	return file ? file.content : null
}

function main({ DOM, socketIO }) {
	// from server's watcher
	const res$ = socketIO.get('tree')

	const selected$ = DOM.select('.sidebar .filename').events('click')
		.map(ev => ev.target.id)
		.startWith(null)

	const state$ = Observable.combineLatest(
		res$, selected$,
		(payload, selected) => {
			const content = getContent(payload, selected)
			return { payload, selected, content }
		})

	const vtree$ = state$.map(
		({ payload, selected, content }) => {
			return div('#app', [
				Sidebar({ DOM, payload, selected }).DOM,
				Editor({ content }).DOM
			])
		}
	)

	return {
		DOM: vtree$
	}
}

// components

function Sidebar ({ DOM, payload, selected }) {
	return {
		DOM: aside('.sidebar', Dir({ DOM, path: 'root', tree: payload, selected }).DOM)
	}
}

function Dir ({ DOM, path, tree, selected }) {
	if (!tree || !tree.children) return

	path = `${path}-${tree.name}`
	const trees = tree.children.map((child) => {
		return (child.children)
			? Dir({ DOM, path, tree: child, selected }).DOM
			: File({ DOM, path, name: child.name, selected }).DOM
	})
	return {
		DOM: ul('.dir', [li('.dirname', tree.name), ...trees])
	}
}

function File ({ DOM, path, name, selected }) {
	const id = `${path}-${name.replace('.', '-')}`
	return {
		DOM: li(`#${id}.filename${ selected === id ? '.selected' : '' }`, name)
	}
}

function Editor ({ content }) {
	const vtree$ = div('.editor', pre(content))
	return {
		DOM: vtree$
	}
}

run(main, {
	DOM: makeDOMDriver('#root'),
	socketIO: createSocketIODriver(socket)
})
