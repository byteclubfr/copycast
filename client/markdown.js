// dedicated to mardown + virtual-dom handling
import { VNode, VText } from 'virtual-dom'
import HTMLToVdom from 'html-to-vdom'
import showdown from 'showdown'

// showdown converter
const converter = new showdown.Converter()

const convertHTML = HTMLToVdom({ VNode: VNode, VText })
const markdown = (str) => convertHTML(converter.makeHtml(str))

export default markdown
