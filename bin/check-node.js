// Check node's version ≥ 6.0.0
// Warning: don't use any dependency here as it's preinstall
// Don't use any fancy ES6 features either, as it should work with any old V8
/* eslint no-var:0, quotes:0 */

var version = process.versions.node
var major = Number(version.split('.')[0])
var parsed = !isNaN(major)
var invalid = parsed && major < 6

if (invalid) {
	process.stderr.write("+---------------------------------------------------------+\n")
	process.stderr.write("| ERROR - NODE VERSION NOT SUPPORTED                      |\n")
	process.stderr.write("+---------------------------------------------------------+\n")

	if (!parsed) {
		// I can't imagine how this could happen but anything can happen I guess
		process.stderr.write("| Oops! could not parse node's version                    |\n")
		process.stderr.write("|                                                         |\n")
	}

	process.stderr.write("| copycast uses ES6 features unavailable for node < 6.0.0 |\n")
	process.stderr.write("| please install copycast@4 or upgrade node               |\n")
	process.stderr.write("+---------------------------------------------------------+\n")

	process.exit(42)
}
