import {
	a, aside, code, div, footer, header, h1, h2,
	li, main, option, pre, select, span, ul
} from '@cycle/dom'
import { PATH_SEP } from './utils/tree-walker'
import { hl, hlThemes } from './hl'

// protection for files with UTF-8 chars like ❭ in this one
const toDataUri = (content) =>
	`data:text/plain;base64,${btoa(unescape(encodeURIComponent(content)))}`

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
|                 |                           |
|                 |                           |
|                 |                           |
+-----------------+                           |
| .sidebar-footer |                           |
+-----------------+---------------------------+
*/

const Octicon = (name) => span(`.octicon.octicon-${name}`)

export const Sidebar = ({ tree, selected, collapsed, conn, hlTheme, sidebarWidth }) =>
	aside('.sidebar', { style: { width: `${sidebarWidth}px` } }, [
		h1('.logo', a({ href: 'https://github.com/lmtm/copycast' }, 'copycast')),
		div('.tree', Dir({ root: true, path: tree.name, tree, selected, collapsed })),
		SidebarFooter({ conn, hlTheme })
	])

const Dir = ({ root, path, tree, selected, collapsed }) => {
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

const File = ({ path, file, selected }) => {
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

const SidebarFooter = ({ conn, hlTheme }) =>
	footer('.sidebar-footer', [
		div('.status', [
			span(`.conn-${ conn ? 'on' : 'off' }`, { title: 'Socket connection status' }, Octicon('plug')),
			a({ href: 'https://github.com/lmtm/copycast' }, Octicon('mark-github'))
		]),
		div(select('.hl-themes', hlThemes.map(t => option({ selected: t === hlTheme }, t))))
	])

export const Resizer = () => div('.resizer')

export const Editor = ({ selected, content }) =>
	main('.main', [
		EditorHeader({ selected, content }),
		div('.editor', content
			? pre(code('.editor-code.hljs', hl(content)))
			: div('.editor-no-content', '⇐ Select a file on the left'))
	])

const EditorHeader = ({ selected, content }) => {
	const parts = selected ? selected.split('|') : []

	return header('.editor-header', [
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
