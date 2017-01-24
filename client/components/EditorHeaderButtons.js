import { a } from '@cycle/dom'
import mime from 'mime-types'

import Octicon from './Octicon'

export default ({ sel, filename, markdownPreview }) => {
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

