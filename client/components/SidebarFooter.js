import { div, span, a, footer, select, option } from '@cycle/dom'

import { hlThemes } from '../renderers/hl'
import Octicon from './Octicon'

export default ({ conn, hlTheme }) =>
	footer('.sidebar-footer', [
		div('.status', [
			span(`.conn-${ conn ? 'on' : 'off' }`, { title: 'Socket connection status' }, Octicon('plug')),
			a({ href: 'https://github.com/byteclubfr/copycast' }, Octicon('mark-github'))
		]),
		div(select('.hl-themes', hlThemes.map(t => option({ sel: t === hlTheme }, t))))
	])

