#!/usr/bin/env node

const copycast = require('../server')
const argv = require('yargs')
	.alias('d', 'dir')
	.describe('d', 'dir to watch')
	.default('d', '.')

	.alias('p', 'port')
	.describe('p', 'web port')
	.default('p', 42000)

	.alias('l', 'localtunnel')
	.describe('l', 'enable localtunnel (public URL)')

	.describe('G', 'disable git support')
	.help('h')
	.alias('h', 'help')
	.argv

copycast.start({
	dir: argv.d,
	port: argv.p,
	localtunnel: argv.l,
	git: !argv.G
})
