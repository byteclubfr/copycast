import { writeFileSync, readdirSync } from 'fs'

const files = readdirSync('./client/hl-themes').filter(f => f.match(/\.css$/))
const json = JSON.stringify(files, null, '  ')

writeFileSync('./client/hl-themes/list.json', json + '\n')
