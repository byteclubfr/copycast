import {
	a, aside, code, div, footer, header, h1, h2,
	input, label, li, main, option, pre, select, span, ul
} from '@cycle/dom'
import mime from 'mime-types'
import last from 'lodash.last'

import { PATH_SEP } from './utils/tree-walker'
import { hl, hlThemes } from './renderers/hl'
import markdown from './renderers/markdown'


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

export const Sidebar = ({ tree, sel, collapsed, conn, hlTheme, sidebarWidth }) =>
	aside('.sidebar', { style: { width: `${sidebarWidth}px` } }, [
		h1('.logo', [
			a({ href: 'https://github.com/byteclubfr/copycast' }, 'copycast'),
			a({ href: '/' + tree.name + '.zip', title: 'Download zip archive' }, Octicon('file-zip'))
		]),
		div('.tree', Dir({ root: true, path: tree.name, tree, sel, collapsed })),
		SidebarFooter({ conn, hlTheme })
	])

const Dir = ({ root, path, tree, sel, collapsed }) => {
	if (!tree || !tree.children) return

	path = root ? tree.name : `${path}${PATH_SEP}${tree.name}`
	let klass = '.dirname'
	let trees = []
	if (collapsed.has(path)) {
		klass += '.collapsed'
	} else {
		trees = tree.children.map((child) => {
			return (child.children)
				? Dir({ path, tree: child, sel, collapsed })
				: File({ path, file: child, sel })
		})
	}
	return ul('.dir', [li(klass, { data: { id: path } }, tree.name), ...trees])
}

const File = ({ path, file, sel }) => {
	const { name, updatedAt } = file
	const id = `${path}${PATH_SEP}${name}`
	let elapsed = ''
	if (updatedAt) {
		let ago = Math.round((Date.now() - updatedAt) / 1000)
		if (ago <= 180) {
			elapsed = `${ago}s`
		}
	}
	return li(`.file${ sel === id ? '.selected' : '' }`, [
		span('.filename', { data: { id } }, name),
		span('.elapsed', { data: { id } }, elapsed)
	])
}

const SidebarFooter = ({ conn, hlTheme }) =>
	footer('.sidebar-footer', [
		div('.status', [
			span(`.conn-${ conn ? 'on' : 'off' }`, { title: 'Socket connection status' }, Octicon('plug')),
			a({ href: 'https://github.com/byteclubfr/copycast' }, Octicon('mark-github'))
		]),
		div(select('.hl-themes', hlThemes.map(t => option({ sel: t === hlTheme }, t))))
	])

export const Resizer = () => div('.resizer')

export const Editor = ({ sel, contents, markdownPreview, selRev }) => {
	const content = selRev == null ? last(contents) : contents[selRev]
	return main('.main', [
		EditorHeader({ sel, contents, markdownPreview, selRev }),
		div('.editor', content
			? ( markdownPreview && mime.lookup(sel) === 'text/x-markdown'
				? div(markdown(content))
				: pre(code('.editor-code.hljs', hl(content)))
			)
			: div('.editor-no-content', '⇐ Select a file on the left'))
	])
}

const EditorHeader = ({ sel, contents, markdownPreview, selRev }) => {
	const parts = sel ? sel.split('|') : []
	const filename = parts[parts.length - 1]

	return header('.editor-header', [
		h2('.crumbs', parts.join(' ❭ ')),
		EditorHeaderButtons({ sel, contents, filename, markdownPreview }),
		EditorTimeline({ contents, selRev })
	])
}

const EditorHeaderButtons = ({ sel, filename, markdownPreview }) => {
	if (!sel) return null

	return [
		a('.download', {
			download: filename,
			href: '/download/' + sel.split('|').slice(1).join('/'),
			title: 'Download file'
		}, [Octicon('cloud-download')]),
		a('.clipboard', {
			attributes: { 'data-clipboard-target': '.editor-code' },
			title: 'Copy file'
		}, [Octicon('clippy')]),
		mime.lookup(sel) === 'text/x-markdown'
			? a(`.markdown-preview.${ markdownPreview ? 'on' : 'off' }`,
					{ title: 'Preview (Markdown)' },
					[Octicon('markdown')])
			: null
	]
}

const EditorTimeline = ({ contents, selRev }) => {
	// only display timeline if the file has changed at least once
	if (contents.length < 2) return null

	const timeline = selRev != null ? input({
		className: 'timeline',
		type: 'range',
		min: 0,
		max: contents.length - 1,
		value: selRev
	}) : null

	const cb = input({
		className: 'last',
		type: 'checkbox',
		checked: selRev == null
	})

	return span('.editor-timeline', [
		`${contents.length} Revisions`,
		timeline,
		label('.last-label', [cb, 'Last'])
	])
}
