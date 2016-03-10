#!/usr/bin/env node

var argv = require('minimist')(process.argv.slice(2))
var copycast = require('../server')

copycast.start({
	dir: argv.d,
	port: argv.p,
	localtunnel: argv.l
})
