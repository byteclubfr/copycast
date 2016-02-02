import { Observable } from 'rx'
import { run } from '@cycle/core'
import {
	a, aside, code, div, footer, header, h1, h2,
	li, link, option, pre, select, span, ul,
	makeDOMDriver
} from '@cycle/dom'

import getClickIds$ from './utils/dom'
import { PATH_SEP, getContent } from './utils/tree-walker'
import createSocketIODriver from './drivers/cycle-socket.io'
import { hl, hlThemes } from './hl'
import Clipboard from 'clipboard'

// protection for files with UTF-8 chars like ❭ in this one
const toDataUri = (content) =>
	`data:text/plain;base64,${btoa(unescape(encodeURIComponent(content)))}`

new Clipboard('.clipboard')

function main({ DOM, socket }) {
	// intents

	// to refresh elapsed counter regularly
	const elapsed$ = Observable.timer(0, 5000)

	// from server's watcher
	const tree$ = socket.get('tree')
	// to add visual indicator
	const conn$ = Observable.merge(
		socket.get('connect').map(() => true),
		socket.get('disconnect').map(() => false)
	)

	// sidebar tree
	const selected$ = getClickIds$(DOM, 'file')
	const collapsed$ = getClickIds$(DOM, 'dirname')
		.scan((set, v) => {
			if (!v) return set
			set.has(v) ? set.delete(v) : set.add(v)
			return set
		}, new Set)

	// sidebar <select>
	const hlTheme$ = DOM.select('.hl-themes').events('change')
		.map(ev => ev.target.value)
		.startWith(hlThemes[34]) // github theme

	// resizer
	const mouseMove$ = Observable.fromEvent(document, 'mousemove')
	const mouseDown$ =  DOM.select('.resizer').events('mousedown')
	const mouseUp$ =  DOM.select('#app').events('mouseup')
	const sidebarWidth$ = mouseDown$.flatMap(() =>
		mouseMove$.map(({ clientX }) => clientX)
			.takeUntil(mouseUp$)
	).startWith(230)

	// model

	const state$ = Observable.combineLatest(
		tree$, selected$, collapsed$, conn$, hlTheme$, sidebarWidth$, elapsed$,
		(tree, selected, collapsed, conn, hlTheme, sidebarWidth) =>
			({ tree, selected, collapsed, conn, hlTheme, sidebarWidth, content: getContent(tree, selected) })
	)

	// view

	const vtree$ = state$.map(
		({ tree, selected, collapsed, conn, hlTheme, sidebarWidth, content }) =>
			div('#app', [
				Sidebar({ tree, selected, collapsed, conn, hlTheme, sidebarWidth }),
				Resizer(),
				Editor({ selected, content }),
				link({ rel: 'stylesheet', href: `hl-themes/${hlTheme}.css` })
			])
	)

	return {
		DOM: vtree$
	}
}

// components

function Octicon (name) {
	return span(`.octicon.octicon-${name}`)
}

function Sidebar ({ tree, selected, collapsed, conn, hlTheme, sidebarWidth }) {
	return aside('.sidebar', { style: { width: `${sidebarWidth}px` } }, [
		h1('.logo', a({ href: 'https://github.com/lmtm/copycast' }, 'copycast')),
		div('.tree',
			Dir({ root: true, path: tree.name, tree, selected, collapsed })
		),
		Footer({ conn, hlTheme })
	])
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

function Footer ({ conn, hlTheme }) {
	return footer([
		div('.status', [
			span(`.conn-${ conn ? 'on' : 'off' }`, { title: 'Socket connection status' }, Octicon('plug')),
			a({ href: 'https://github.com/lmtm/copycast' }, Octicon('mark-github'))
		]),
		div(select('.hl-themes', hlThemes.map(t => option({ selected: t === hlTheme }, t))))
	])
}

function Resizer () {
	return div('.resizer')
}

function Editor ({ selected, content }) {
	return div('.main', [
		Header({ selected, content }),
		div('.editor', content
			? pre(code('.editor-code.hljs', hl(content)))
			: div('.editor-no-content', '⇐ Select a file on the left'))
	])
}

function Header ({ selected, content }) {
	const parts = selected ? selected.split('|') : []

	return header([
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

run(main, {
	DOM: makeDOMDriver('#root'),
	socket: createSocketIODriver()
})
