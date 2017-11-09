import { a, aside, div, h1 } from '@cycle/dom'
import { Observable } from 'rx'

import Octicon from './Octicon'
import Dir from './Dir'
import SidebarFooter from './SidebarFooter'

const view = (props$) =>
	Observable.combineLatest([props$])
	.map(([ [ tree, sel, , , collapsed, conn, hlTheme, sidebarWidth ] ]) =>
		aside('.sidebar', { style: { width: `${sidebarWidth}px` } }, [
			h1('.logo', [
				a({ href: 'https://github.com/byteclubfr/copycast' }, 'copycast'),
				a({ href: '/' + tree.name + '.zip', title: 'Download zip archive' }, Octicon('file-zip'))
			]),
			div('.tree', Dir({ root: true, path: tree.name, tree, sel, collapsed })),
			SidebarFooter({ conn, hlTheme })
		])
	)

export default ({ props$ }) => {
	const vtree$ = view(props$)

	return {
		DOM: vtree$,
	}
}
