import { Observable } from 'rx'
import { run } from '@cycle/core'
import {
	a, aside, code, div, footer, header, h1, h2,
	li, pre, section, span, ul,
	makeDOMDriver
} from '@cycle/dom'

import getClickIds$ from './utils/dom'
import { PATH_SEP, getChildren, getContent } from './utils/tree-walker'
import createSocketIODriver from './drivers/cycle-socket.io'
import hl from './hl'
import Clipboard from 'clipboard'

// protection for files with UTF-8 chars like ❭ in this one
const toDataUri = (content) =>
	`data:text/plain;base64,${btoa(unescape(encodeURIComponent(content)))}`

new Clipboard('.clipboard')

function main({ DOM, socketIO }) {
	// to refresh elapsed counter regularly
	const elapsed$ = Observable.timer(0, 5000)
	// from server's watcher
	const tree$ = socketIO.get('tree')
	// to add visual indicator
	const connect$ = socketIO.get('connect').map(() => true)
	const disconnect$ = socketIO.get('disconnect').map(() => false)
	const conn$ = Observable.merge(connect$, disconnect$)

	const selected$ = getClickIds$(DOM, 'file')
	const collapsed$ = getClickIds$(DOM, 'dirname')
		.scan((set, v) => {
			if (!v) return set
			set.has(v) ? set.delete(v) : set.add(v)
			return set
		}, new Set)

	const state$ = Observable.combineLatest(
		tree$, selected$, collapsed$, conn$, elapsed$,
		(tree, selected, collapsed, conn) => {
			const content = getContent(tree, selected)
			return { tree, selected, collapsed, conn, content }
		})

	const vtree$ = state$.map(
		({ tree, selected, collapsed, conn, content }) => {
			return div('#app', [
				Header({ selected, content }),
				section([
					Sidebar({ tree, selected, collapsed }),
					Editor({ content })
				]),
				Footer({ conn })
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

function Footer ({ conn }) {
	return footer(div(`.status`, [
		span(`.conn-${ conn ? 'on' : 'off' }`, { title: 'Socket connection status' }, Octicon('plug')),
		a({ href: 'https://github.com/lmtm/copycast' }, Octicon('mark-github'))
	]))
}

run(main, {
	DOM: makeDOMDriver('#root'),
	socketIO: createSocketIODriver()
})
