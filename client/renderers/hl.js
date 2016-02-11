// dedicated to hightlight.js + virtual-dom handling
import { VNode, VText } from 'virtual-dom'
import HTMLToVdom from 'html-to-vdom'
import { highlightAuto } from 'highlight.js'

let hlThemes = require('./../hl-themes/list.json')
// remove jq garbage
hlThemes.pop()
hlThemes = hlThemes.map(f => f.substring(0, f.length -4))

// used to help hightlight.js guessing the content of the parsed code
// beware, if content is markdown, it can start with a #
// which will be interpreted as a CSS id selector by virtual-dom
const langs = ['javascript', 'json', 'css', 'html', 'markdown']

const convertHTML = HTMLToVdom({ VNode: VNode, VText })
const hl = (str) => convertHTML(highlightAuto(str || '', langs).value || '<noscript />')

export { hl, hlThemes }
