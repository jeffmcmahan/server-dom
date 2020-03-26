# Server DOM

Create mutable DOM on the server-side for flexible imperative manipulation.

```
npm install @jeffmcmahan/server-dom
```

## Why? 

The age-old paradigm of getting all content and state together before producing any HTML is a result of the fact that once a bit of HTML is produced it cannot be edited without parsing. For example: `<div class="foo">...</div>` ... revisiting that markup to add new content or new attributes is not doable *cleanly* by string manipulation. This encourages a template-driven workflow, where we accumulate state and dump it into a template at the end.

It's often much better to do things like this:

```js
import {dom} from '@jeffmcmahan/server-dom'
import {primaryNav} from './navs.mjs'

export const getHomepage = () => {

	// Produce the HTML for the main content area.
	const view = dom`<main>
		${primaryNav}
		...
	</main>`

	// Highlight the active page link.
	const homeLink = view.querySelector('#home-link')
	homeLink.classList.add('active')
}
```

Why is that better? Because here I can manipulate the state of the page without knowing anything about where it came from; I don't have to change the code that generates the core stuff in the document in order to make such changes as are needed.

## Example 1: Basic

Create a virtual DOM fragment as follows:

```js
import {dom} from '@jeffmcmahan/server-dom'

const fragment = dom`<header>
	<h2 class="huge">Hello World!</h2>
</header>`
```

You can imperatively interact with the DOM using a limited browser-compatible API:

```js
fragment.querySelector('header').classList.add('blue')

console.log(fragment.toString()) // <header class="blue">...
```

## Example 2: Nesting

It is possible to embed fragments within one another without incurring any redundant parsing overhead (because the trees are not reduced to strings). As shown here:

```js
import {dom} from '@jeffmcmahan/server-dom'

const getHeader = () => dom`<h2 class="huge">
	Hello World!
</h2>`

const fragment = dom`<header>
	${getHeader()}
</header>`
```

## Caveats

- No support for many browser API conveniences like `innerHTML` or `innerText`.
- Only valid XML is permitted; bad code won't work (not suitable for scraping).