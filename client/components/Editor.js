import { div, pre, main, code } from '@cycle/dom'
import last from 'lodash.last'
import mime from 'mime-types'

import { hl } from '../renderers/hl'
import markdown from '../renderers/markdown'
import EditorHeader from './EditorHeader'

export default ({ sel, contents, markdownPreview, selRev }) => {
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

