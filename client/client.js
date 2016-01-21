var socket = io.connect()

socket.on('connect', () => console.log('(re)connected'))
socket.on('disconnect', () => console.error('disconnected'))

socket.on('tree', (tree) => console.log(tree))
