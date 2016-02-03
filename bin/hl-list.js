import { writeFileSync, readdirSync } from 'fs'

const files = readdirSync('./client/hl-themes').filter(f => f.match(/\.css$/))
const json = JSON.stringify(files, null, '  ')

writeFileSync('list.json', json + '\n')
