'use strict'

const fs = require('fs')

let conf = read()


exports.get = function (key, defolt) {
	return (key in conf) ? conf[key] : defolt
}

exports.set = function (options) {
	for (let key in options) {
		if (options[key] === undefined || options[key] === null) {
			delete conf[key]
		} else {
			conf[key] = options[key]
		}
	}
	write()
}


function write () {
	fs.writeFileSync('.copycast', JSON.stringify(conf, null, 2))
}

function read () {
	try {
		return JSON.parse(fs.readFileSync('.copycast'))
	} catch (e) {
		return {}
	}
}
