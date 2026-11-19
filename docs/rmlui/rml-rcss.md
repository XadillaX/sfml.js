# RML and RCSS basics

RML defines the elements in a RmlUi document. RCSS selects those elements and sets their layout and appearance. JavaScript loads the document and connects it to application state. This chapter uses the [counter example](../../packages/sfml.js-rmlui/examples/README.md#demo); complete the [quick start](getting-started.md) first.

## Follow the three files

| File | Responsibility |
| --- | --- |
| [tutorial.rml](../../packages/sfml.js-rmlui/examples/assets/tutorial.rml) | Element tree, IDs, text and the stylesheet link |
| [tutorial.rcss](../../packages/sfml.js-rmlui/examples/assets/tutorial.rcss) | Layout, fonts, colors and hover states |
| [demo.cjs](../../packages/sfml.js-rmlui/examples/demo.cjs) | Window, fonts, document loading, input, click handler and frame loop |

## Write the document

The following is a reduced version of `tutorial.rml`. It keeps the IDs used by `demo.cjs`, so you can try it with that launcher and the stylesheet below.

```xml
<rml>
  <head>
    <title>Counter</title>
    <link type="text/rcss" href="tutorial.rcss" />
  </head>
  <body>
    <div id="window">
      <div id="title">My counter</div>
      <div id="counter" class="muted">Clicks: 0</div>
      <button id="increment">Increment</button>
    </div>
  </body>
</rml>
```

`<rml>` is the root, `<head>` describes document resources, and `<body>` contains the visible interface. The stylesheet path is relative to the RML file. Use matching closing tags and quoted attribute values; self-close empty elements such as `<link />`. Escape literal `&` and `<` as `&amp;` and `&lt;`.

An `id` identifies one element for queries and styling. A `class` groups elements that share a style; multiple classes are separated by spaces. RML does not give arbitrary tag names their browser appearance: in particular, a `div` needs `display: block` for block layout.

## Style it with RCSS

Place these rules in `tutorial.rcss` beside the RML file. The launcher already loads the LatoLatin regular and bold fonts before loading the document.

```css
body {
  width: 100%;
  height: 100%;
  font-family: LatoLatin;
  font-size: 16dp;
  color: #f5f7fa;
  background: #1d2430;
}

div {
  display: block;
}

#window {
  width: 480dp;
  margin: auto;
  padding: 24dp;
  box-sizing: border-box;
  background: #2b3446;
  border: 1dp #46546e;
}

#title {
  font-size: 22dp;
  font-weight: bold;
  margin-bottom: 12dp;
}

.muted {
  color: #8fd3ff;
  margin-bottom: 18dp;
}

button {
  display: inline-block;
  padding: 10dp 24dp;
  background: #e84c88;
}

button:hover {
  background: #ff6aa2;
}
```

| Selector | Matches |
| --- | --- |
| `button` | Every button element |
| `#window` | The element with `id="window"` |
| `.muted` | Elements with the `muted` class |
| `#window button` | Buttons inside `#window` |
| `button:hover` | A button under the pointer |

`margin` is space outside the box; `padding` is space between its content and border. `box-sizing: border-box` includes padding and borders in the declared width. Font and text color inherit from the parent; more specific matching selectors can override a general rule. Hover styling changes appearance only; the click action still needs a listener.

Use `dp` for fixed UI sizes and fonts: at a density ratio of 2, `16dp` becomes 32 render pixels and keeps its logical size. `px` uses render pixels; `%` depends on the property's reference size. The binding initializes the context's density ratio; see [Retina sizing](rendering.md). `font-family` must match a loaded font's internal family name, not its filename.

RCSS has its own supported property set. For example, its border shorthand is `border: 1dp #46546e`; do not assume every browser CSS declaration is supported. Flexbox, templates and decorators have dedicated upstream documentation.

## Connect a click to state

The launcher queries the document after loading it and registers this handler once, outside the frame loop:

```js
const counter = document.getElementById('counter');
const button = document.getElementById('increment');

if (!counter || !button) {
  throw new Error('Counter elements are missing');
}

let clicks = 0;

function increment() {
  clicks += 1;
  counter.innerRML = `Clicks: ${clicks}`;
}

button.addEventListener('click', increment);
```

The frame loop forwards SFML events to `context.processEvent`, then calls `update` and `render`. A click updates the existing element; the next frame displays the value. `innerRML` parses markup, so escape untrusted text before assigning it. This package does not run `<script>` contents or inline `onclick` JavaScript from RML.

Before unloading the document, call `button.removeEventListener('click', increment)` with the same function. Continue with [documents and events](documents.md) for queries, class changes and native lifetimes.

## Try an edit

Change the title, the `.muted` color or the button padding, then restart the example from the monorepo root:

```sh
node packages/sfml.js-rmlui/examples/demo.cjs
```

RML and RCSS edits need no native rebuild. The launcher loads them at startup; it does not watch for changes. The reduced document shows a title, counter and button; Increment increases the count by one.

## Official syntax references

- [RML manual](https://mikke89.github.io/RmlUiDoc/pages/rml.html): [syntax](https://mikke89.github.io/RmlUiDoc/pages/rml/syntax.html), [elements](https://mikke89.github.io/RmlUiDoc/pages/rml/element_index.html), [templates](https://mikke89.github.io/RmlUiDoc/pages/rml/templates.html).
- [RCSS manual](https://mikke89.github.io/RmlUiDoc/pages/rcss.html): [syntax and units](https://mikke89.github.io/RmlUiDoc/pages/rcss/syntax.html), [selectors](https://mikke89.github.io/RmlUiDoc/pages/rcss/selectors.html), [property index](https://mikke89.github.io/RmlUiDoc/pages/rcss/property_index.html).
- [Core element style guide](https://mikke89.github.io/RmlUiDoc/pages/style_guide.html) and [flexbox](https://mikke89.github.io/RmlUiDoc/pages/rcss/flexboxes.html).

The upstream online manual follows its development branch. This binding targets RmlUi 6.3 and exposes a subset of its APIs and rendering features. Check the local [rendering coverage](rendering.md) and [API guide](api.md) before relying on an upstream feature.
