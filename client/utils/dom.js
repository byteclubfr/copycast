export default (DOM, klass) =>
	DOM.select(`.sidebar .${klass}`).events('click')
		.map(ev => ev.target.data.id)
		.startWith(null)
