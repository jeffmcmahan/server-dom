import {strict as assert} from 'assert'
import {dom} from './main.mjs'

console.time('tests')

// Parsing & Serialization ////////////////////////////////////////////////////

const testVar = String(0.5938800190254814)

const fragment = dom`${testVar}
	<html>
	<div>
		<!-- foo -->
		${dom`<ul id="embedded">${testVar}</ul>`}
		${testVar}
		<i class="bar">Hi</i>
		<link rel="stylesheet" href="/baz.css">
	</div>
</html>${testVar}`

const html = fragment.outerHTML

// Comment should be gone.
assert(!html.includes('<!--'))
assert(!html.includes('-->'))
assert(!html.includes(' foo '))

// General parsing check.
assert(html.includes('</div>'))
assert(html.includes('<i class="bar">'))
assert(html.includes('</i>'))
assert(html.includes('<link rel="stylesheet" href="/baz.css">'))

// Variables should be printed.
assert(html.startsWith(testVar))
assert(html.endsWith(testVar))
assert(html.includes('<div>'))

// The embedded DOM should appear.
assert(html.includes('<div>'))

// <script> are eaten.
assert(dom`<div><script>...this just eaten...</script></div>`)

// <styles> are eaten.
assert(dom`<div><style>...this just eaten...</style></div>`)

// <!doctype html>
const doctype = dom`<!doctype html><html></html>`
assert(doctype.childNodes[0].html == true)

// Should strip redundant linebreaks.
assert(!html.includes('\n\n'))

// Query & Manipulation ///////////////////////////////////////////////////////

// querySelector(nodeName)
assert.equal(fragment.querySelector('div').nodeName, 'DIV')

// querySelectorAll(nodeName)
assert.equal(fragment.querySelectorAll('div').length, 1)

// .querySelector(#id)
assert.equal(fragment.querySelector('#embedded').id, 'embedded')

// classList.contains()
assert(fragment.querySelector('.bar').classList.contains('bar'))

// classList.add()
fragment.querySelector('.bar').classList.add('baz')
assert(fragment.querySelector('.bar').classList.contains('baz'))

// classList.remove()
fragment.querySelector('.bar').classList.remove('baz')
assert(!fragment.querySelector('.bar').classList.contains('baz'))

// .remove()
fragment.querySelector('#embedded').remove()
assert.equal(fragment.querySelector('#embedded'), null)

console.timeEnd('tests')