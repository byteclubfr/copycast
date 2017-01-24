import { header, h2 } from '@cycle/dom'

import EditorHeaderButtons from './EditorHeaderButtons'
import EditorTimeline from './EditorTimeline'

export default ({ sel, contents, markdownPreview, selRev }) => {
	const parts = sel ? sel.split('|') : []
	const filename = parts[parts.length - 1]

	return header('.editor-header', [
		h2('.crumbs', parts.join(' ❭ ')),
		EditorHeaderButtons({ sel, contents, filename, markdownPreview }),
		EditorTimeline({ contents, selRev })
	])
}

