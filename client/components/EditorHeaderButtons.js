import { a } from '@cycle/dom'
import mime from 'mime-types'
import { Observable } from 'rx'

import Octicon from './Octicon'

const view = (props$) =>
	Observable.combineLatest([props$])
	.map(([ [ , sel, , markdownPreview ] ]) => {
		if (!sel) return null

		const parts = sel ? sel.split('|') : []
		const filename = parts[parts.length - 1]
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
	})

export default ({ DOM, props$ }) => {
	const vtree$ = view(props$)

	return {
		DOM: vtree$
	}
}
