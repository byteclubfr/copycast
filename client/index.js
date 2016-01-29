import { Observable } from 'rx'
import { run } from '@cycle/core'
import {
	a, aside, code, div, header, h1, h2,
	li, pre, section, span, ul,
	makeDOMDriver
} from '@cycle/dom'
import createSocketIODriver from './drivers/cycle-socket.io'
import hl from './hl'
import Clipboard from 'clipboard'

const socket = io.connect() // eslint-disable-line

socket.on('connect', () => console.log('connected'))
socket.on('disconnect', (err) => console.error('disconnected', err))
socket.on('error', (err) => console.error('error', err))
socket.on('tree', (tree) => console.debug(tree))

// protection for files with UTF-8 chars like ❭ in this one
const toDataUri = (content) =>
	`data:text/plain;base64,${btoa(unescape(encodeURIComponent(content)))}`

new Clipboard('.clipboard')

// tree walking

const PATH_SEP = '|'

const getChildren = (tree, path) => {
	let children = tree.children
	path.forEach((dir) => {
		const child = children.find(c => c.name === dir)
		if (child) children = child.children
	})
	return children
}

const getContent = (tree, selected) => {
	if (!selected) return null

	let path = selected.split(PATH_SEP)
	path.shift()
	let filename = path.pop()

	const file = getChildren(tree, path).find(c => c.name === filename)
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

	const collapsed$ = DOM.select('.sidebar .dirname').events('click')
		.map(ev => ev.target.data.id)
		.startWith(null)
		.scan((set, v) => {
			if (!v) return set
			set.has(v) ? set.delete(v) : set.add(v)
			return set
		}, new Set)

	const state$ = Observable.combineLatest(
		res$, selected$, collapsed$, elapsed$,
		(tree, selected, collapsed) => {
			const content = getContent(tree, selected)
			return { tree, selected, collapsed, content }
		})

	const vtree$ = state$.map(
		({ tree, selected, collapsed, content }) => {
			return div('#app', [
				Header({ selected, content }),
				section([
					Sidebar({ tree, selected, collapsed }),
					Editor({ content })
				])
			])
		}
	)

	return {
		DOM: vtree$
	}
}

// components

function Header ({ selected, content }) {
	const parts = selected ? selected.split('|') : []

	return header([
		h1('.logo', a({ href: 'https://github.com/lmtm/copycast' }, 'copycast')),
		h2('.crumbs', parts.join(' ❭ ')),
		selected
			? a('.download', {
				download: parts[parts.length - 1],
				href: toDataUri(content)
			}, [Octicon('cloud-download'), 'Download file'])
			: null,
		selected
			? a('.clipboard', {
				attributes: { 'data-clipboard-target': '.editor-code' }
			}, [Octicon('clippy'), 'Copy file'])
			: null
	])
}

function Octicon (name) {
	return span(`.octicon.octicon-${name}`)
}

function Sidebar ({ tree, selected, collapsed }) {
	return aside('.sidebar', Dir({ root: true, path: tree.name, tree, selected, collapsed }))
}

function Dir ({ root, path, tree, selected, collapsed }) {
	if (!tree || !tree.children) return

	path = root ? tree.name : `${path}${PATH_SEP}${tree.name}`
	let klass = '.dirname'
	let trees = []
	if (collapsed.has(path)) {
		klass += '.collapsed'
	} else {
		trees = tree.children.map((child) => {
			return (child.children)
				? Dir({ path, tree: child, selected, collapsed })
				: File({ path, file: child, selected })
		})
	}
	return ul('.dir', [li(klass, { data: { id: path } }, tree.name), ...trees])
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
	return li(`.file${ selected === id ? '.selected' : '' }`, [
		span('.filename', { data: { id } }, name),
		span('.elapsed', { data: { id } }, elapsed)
	])
}

function Editor ({ content }) {
	return div('.editor', content
		? pre(code('.editor-code', hl(content)))
		: div('.editor-no-content', '⇐ Select a file on the left'))
}

run(main, {
	DOM: makeDOMDriver('#root'),
	socketIO: createSocketIODriver(socket)
})
