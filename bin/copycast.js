#!/usr/bin/env node

const argv = require('minimist')(process.argv.slice(2))
const copycast = require('../server')

copycast.start({
	dir: argv.d,
	port: argv.p,
	localtunnel: argv.l
})
