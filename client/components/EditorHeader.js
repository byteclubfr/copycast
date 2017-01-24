import { header, h2 } from '@cycle/dom'
import { Observable } from 'rx'

import EditorHeaderButtons from './EditorHeaderButtons'
import EditorTimeline from './EditorTimeline'

const view = (props$) =>
	Observable.combineLatest([props$])
	.map(([ [ , sel, contents, markdownPreview, selRev ] ]) => {
		const parts = sel ? sel.split('|') : []
		const filename = parts[parts.length - 1]

		return header('.editor-header', [
			h2('.crumbs', parts.join(' ❭ ')),
			EditorHeaderButtons({ sel, contents, filename, markdownPreview }),
			EditorTimeline({ contents, selRev })
		])
	})

export default ({ DOM, props$ }) => {
	const vtree$ = view(props$)

	return {
		DOM: vtree$
	}
}

