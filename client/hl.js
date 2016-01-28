// dedicated to hightlight.js + virtual-dom handling
import { VNode, VText } from 'virtual-dom'
import HTMLToVdom from 'html-to-vdom'
import { highlightAuto } from 'highlight.js'

// used to help hightlight.js guessing the content of the parsed code
// beware, if content is markdown, it can start with a #
// which will be interpreted as a CSS id selector by virtual-dom
const langs = ['javascript', 'css', 'html', 'markdown']

const convertHTML = HTMLToVdom({ VNode: VNode, VText })
export default (str) => convertHTML(highlightAuto(str || '', langs).value || '<noscript />')
