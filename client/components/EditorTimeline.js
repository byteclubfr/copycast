import { input, span, label } from '@cycle/dom'

export default ({ contents, selRev }) => {
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

