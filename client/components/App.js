import { div, link } from '@cycle/dom'
import last from 'lodash.last'
import { Observable } from 'rx'

import { hlThemes } from '../renderers/hl'
import getClickIds$ from '../utils/dom'
import { getContents } from '../utils/tree-walker'

import Sidebar from './Sidebar'
import Resizer from './Resizer'
import Editor from './Editor'

// in ms
const REFRESH_TIMER = 5000
// number of previous trees kept in memory
const DIFF_COUNT = 5
// localStorage key
const LS_HL_THEME = 'copycast.hl-theme'


const intent = ({ DOM, socket, storage }) => {
	// from server's watcher
	const tree$ = socket.get('tree')
		.scan((acc, tree) => {
			acc.push(tree)
			// prune
			if (acc.length > DIFF_COUNT) acc.shift()
			return acc
		}, [])

	// to add visual indicator
	const conn$ = socket.status$
		.map(status => status.connected)

	const revClick$ = DOM.select('.editor-timeline .last').events('click')
		.map(ev => ev.target.checked)
		.startWith(true)

	const revChange$ = DOM.select('.editor-timeline .timeline').events('change')
		.map(ev => Number(ev.target.value))
		.startWith(0)

	const selRev$ = Observable.combineLatest([ revClick$, revChange$ ])
		.map(([click, change]) => !click ? change : null)

	// sidebar tree
	const sel$ = getClickIds$(DOM, 'file')
	const collapsed$ = getClickIds$(DOM, 'dirname')
		.scan((set, v) => {
			if (!v) return set
			set.has(v) ? set.delete(v) : set.add(v)
			return set
		}, new Set)

	// resizer
	const mouseMove$ = Observable.fromEvent(document, 'mousemove')
	const mouseDown$ =  DOM.select('.resizer').events('mousedown')
	const mouseUp$ =  DOM.select('#app').events('mouseup')
	const sidebarWidth$ = mouseDown$.flatMap(() =>
		mouseMove$.map(({ clientX }) => clientX).takeUntil(mouseUp$)
	).startWith(230)

	const hlTheme$ = storage.local.getItem(LS_HL_THEME)
		.map(v => v === null ? hlThemes[34] : v) // default to GitHub theme

	// to refresh elapsed counter regularly
	const elapsed$ = Observable.timer(0, REFRESH_TIMER)

	return [ tree$, sel$, selRev$,
		collapsed$, conn$, hlTheme$, sidebarWidth$, elapsed$ ]
}

const model = (actions$) => {
	return Observable.combineLatest(actions$)
		.map(([ tree, sel, ...x ]) => [ last(tree), sel, getContents(tree, sel), ...x ])
}

/*
+-----------------+---------------------------+
| .logo           | .editor-header            |
|                 |   .crumbs                 |
+-----------------+---------------------------+
| .tree           | .editor                   |
|   .dir          |                           |
|     .file       |                           |
|                 |                           |
|                 |                           |
+-----------------+                           |
| .sidebar-footer |                           |
+-----------------+---------------------------+
*/

const view = (state$, sidebarDOM, editorDOM) =>
	Observable.combineLatest([state$, sidebarDOM, editorDOM])
	.map(([ [ , , , , , , hlTheme ], sidebarVtree, editorVtree ]) =>
		div('#app', [
			sidebarVtree,
			Resizer(),
			editorVtree,
			link({ rel: 'stylesheet', href: `hl-themes/${hlTheme}.css` })
		]))

export default ({ DOM, socket, storage }) => {
	const actions$ = intent({ DOM, socket, storage })
	const state$ = model(actions$)

	const sidebar = Sidebar({ DOM, props$: state$ })
	const editor = Editor({ DOM, props$: state$ })

	const vtree$ = view(state$, sidebar.DOM, editor.DOM)

	return {
		DOM: vtree$,
		// save sidebar <select> value to localStorage
		storage: DOM.select('.hl-themes').events('change')
			.map(({ target }) => ({ key: LS_HL_THEME, value: target.value }))
	}
}
