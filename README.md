# Server DOM

Create mutable DOM on the server-side for flexible imperative manipulation.

```sh
npm install @jeffmcmahan/server-dom
```

server-dom makes it easy to do things like this:

```js
const view = dom`<body><header>${primaryNav}</header> ...`

view.querySelector('#home-link').classList.add('active')
```

## Example

Create a virtual DOM fragment as follows:

```js
import {dom} from '@jeffmcmahan/server-dom'

const fragment = dom`<h1 class="title">Hello World!</h1>`
```

Interact with the DOM using a browser-compatible API:

```js
fragment.querySelector('.title').classList.add('blue')

console.log(fragment.outerHTML) // <h1 class="title blue">He...
```

## Properties & Methods

server-dom's core `AstNode` class implements a near-equivalent for all relevant DOM `Node` properties and methods. DOM `NodeList` and `DOMString` types are just native javascript equivalents.

### Properties

- `childNodes`
- `classList`
- `className`
- `firstChild`
- `id`
- `isConnected`
- `lastChild`
- `nextSibling`
- `nodeName`
- `nodeType`
- `ownerDocument` (resolves to parent `<html>` node, if any)
- `parent`
- `previousSibling`
- `nodeValue` (only defined for text nodes)

In general, attributes will remain `undefined` unless and until they are either specified in HTML or added by assignment.

### Methods

- `append(node)`
- `classList.add(className)`
- `classList.contains(className)`
- `classList.remove(className)`
- `cloneNode([deep])`
- `insertBefore(node, referenceNode)`
- `querySelector(selector)`†
- `querySelectorAll(selector)`†
- `remove()`
- `removeChild(node)`

† Selector support is currently limited to single tag names, ids, class names, and attributes; no descendants or other combinations (yet).

### Additions to `Node` API:

The DOM `Node` API does not provide for serialization to HTML, so these items have been added, using `HTMLElement` naming conventions:

- `innerHTML`
- `outerHTML`

### Why not jsdom or cheerio?

#### Performance

jsdom is huge and slow; cheerio is advertised to be 8 times faster. With its single-pass parser, server-dom is 5–7 times faster than cheerio.

As a basic benchmark, I took the massive HTML source of the cheerio project page at npm (425kb and ≈11,000 nodes) and after some warmup, I pass the HTML string to cheerio and to server-dom. I don't think statistical treatment is required to appreciate the difference:

| Project    | Time   |
| ---        | ---    |
| cheerio    | ≈150ms |
| server-dom | ≈25ms  |

#### Dependencies

jsdom installs ≈100 packages and cheerio installs ≈20. Server-dom has zero dependencies.

#### Requirements

Both cheerio and jsdom are aiming at creating something far more like the real DOM environment than is required for server-side document generation and manipulation for purposes of producing good quality, valid HTML output. Scraping is altogether more demanding, and not something server-dom aims to handle. 