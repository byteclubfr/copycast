import { run } from '@cycle/core'
import { makeDOMDriver } from '@cycle/dom'
import storageDriver from '@cycle/storage'
import createSocketIODriver from './drivers/cycle-socket.io'
import Clipboard from 'clipboard'
new Clipboard('.clipboard')

import App from './components/App'

run(App, {
	DOM: makeDOMDriver('#root'),
	socket: createSocketIODriver(),
	storage: storageDriver
})
