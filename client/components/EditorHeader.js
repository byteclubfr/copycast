import { header, h2 } from '@cycle/dom'
import { Observable } from 'rx'

import EditorHeaderButtons from './EditorHeaderButtons'
import EditorTimeline from './EditorTimeline'

const view = (props$, editorHeaderButtonsDOM) =>
	Observable.combineLatest([props$, editorHeaderButtonsDOM])
	.map(([ [ , sel, contents, markdownPreview, selRev ], editorHeaderButtonsVtree ]) => {
		const parts = sel ? sel.split('|') : []
		const filename = parts[parts.length - 1]

		return header('.editor-header', [
			h2('.crumbs', parts.join(' ❭ ')),
			editorHeaderButtonsVtree,
			EditorTimeline({ contents, selRev })
		])
	})

export default ({ DOM, props$ }) => {
	const editorHeaderButtons = EditorHeaderButtons({ DOM, props$ })
	const vtree$ = view(props$, editorHeaderButtons.DOM)

	return {
		DOM: vtree$
	}
}

