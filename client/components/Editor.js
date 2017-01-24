import { div, pre, main, code } from '@cycle/dom'
import last from 'lodash.last'
import mime from 'mime-types'
import { Observable } from 'rx'

import { hl } from '../renderers/hl'
import markdown from '../renderers/markdown'
import EditorHeader from './EditorHeader'

const view = (props$, editorHeaderDOM) =>
	Observable.combineLatest([props$, editorHeaderDOM])
	.map(([ [ , sel, contents, markdownPreview, selRev ], editorHeaderVtree ]) => {
		const content = selRev == null ? last(contents) : contents[selRev]
		return main('.main', [
			editorHeaderVtree,
			div('.editor', content
				? ( markdownPreview && mime.lookup(sel) === 'text/x-markdown'
					? div(markdown(content))
					: pre(code('.editor-code.hljs', hl(content)))
				)
				: div('.editor-no-content', '⇐ Select a file on the left'))
		])
	})

export default ({ DOM, props$ }) => {
	const editorHeader = EditorHeader({ DOM, props$ })
	const vtree$ = view(props$, editorHeader.DOM)

	return {
		DOM: vtree$
	}
}

