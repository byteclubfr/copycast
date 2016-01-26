import { Observable } from 'rx'
import { run } from '@cycle/core'
import {
	aside, code, div, header, h1, h2,
	li, pre, section, span, ul,
	makeDOMDriver
} from '@cycle/dom'

import createSocketIODriver from './drivers/cycle-socket.io'

var socket = io.connect() // eslint-disable-line

socket.on('connect', () => console.log('connected'))
socket.on('disconnect', (err) => console.error('disconnected', err))
socket.on('error', (err) => console.error('error', err))
socket.on('tree', (tree) => console.debug(tree))

// tree walking

const PATH_SEP = '|'

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

	let path = selected.split(PATH_SEP)
	// remove 'root'
	path.shift()
	path.shift()
	let filename = path.pop()

	const file = getChildren(payload, path).find(c => c.name === filename)
	return file ? file.content : null
}

function main({ DOM, socketIO }) {
	// to refresh elapsed counter regularly
	const elapsed$ = Observable.timer(0, 5000)
	// from server's watcher
	const res$ = socketIO.get('tree')

	const selected$ = DOM.select('.sidebar .file').events('click')
		.map(ev => ev.target.data.id)
		.startWith(null)

	const state$ = Observable.combineLatest(
		res$, selected$, elapsed$,
		(payload, selected) => {
			const content = getContent(payload, selected)
			return { payload, selected, content }
		})

	const vtree$ = state$.map(
		({ payload, selected, content }) => {
			return div('#app', [
				Header({ selected }).DOM,
				section([
					Sidebar({ payload, selected }).DOM,
					Editor({ content }).DOM
				])
			])
		}
	)

	return {
		DOM: vtree$
	}
}

// components

function Header ({ selected }) {
	let crumbs = ''
	if (selected) {
		crumbs = selected.split('|')
		crumbs.shift()
		crumbs.shift()
		crumbs = crumbs.join(' > ')
	}
	return {
		DOM: header([
			h1('copycast'),
			h2('.crumbs', crumbs)
		])
	}
}

function Sidebar ({ payload, selected }) {
	return {
		DOM: aside('.sidebar', Dir({ path: 'root', tree: payload, selected }).DOM)
	}
}

function Dir ({ path, tree, selected }) {
	if (!tree || !tree.children) return

	path = `${path}${PATH_SEP}${tree.name}`
	const trees = tree.children.map((child) => {
		return (child.children)
			? Dir({ path, tree: child, selected }).DOM
			: File({ path, file: child, selected }).DOM
	})
	return {
		DOM: ul('.dir', [li('.dirname', tree.name), ...trees])
	}
}

function File ({ path, file, selected }) {
	const { name, updatedAt } = file
	const id = `${path}${PATH_SEP}${name}`
	let elapsed = ''
	if (updatedAt) {
		let ago = Math.round((Date.now() - updatedAt) / 1000)
		if (ago <= 180) {
			elapsed = `${ago}s`
		}
	}
	return {
		DOM: li(`.file${ selected === id ? '.selected' : '' }`, [
			span('.filename', { data: { id } }, name),
			span('.elapsed', { data: { id } }, elapsed)
		])
	}
}

// beware, if content is markdown, it can start with a #
// which will be interpreted as a CSS id selector
function Editor ({ content }) {
	const vtree$ = div('.editor', pre(
										code('.editor-code', content)))
	return {
		DOM: vtree$
	}
}

run(main, {
	DOM: makeDOMDriver('#root'),
	socketIO: createSocketIODriver(socket)
})
