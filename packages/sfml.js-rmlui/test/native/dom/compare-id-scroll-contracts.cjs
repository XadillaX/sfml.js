'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const rmlui = require('../../../dist');
const sfml = require('sfml.js');

const reference = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
for (const name of [
  'MediaQueryId', 'FontFaceId',
  'ScrollBehavior', 'ScrollAlignment', 'ScrollParentage',
]) {
  const members = Object.fromEntries(Object.entries(rmlui[name])
    .filter(([ , value ]) => typeof value === 'number'));
  assert.deepEqual(members, reference[name], name);
}
console.log('PASS native-managed-all-local-id-and-scroll-enum-members');

const window = new sfml.RenderWindow(
  new sfml.VideoMode(new sfml.Vector2u(320, 240)), 'Native scroll contracts');
try {
  assert.ok(rmlui.initialise(window, { highDpi: false }));
  const context = rmlui.createContext('scroll-reference', 320, 240);
  const document = context.loadDocumentFromMemory(`
    <rml><head><style>
      body { width: 320px; height: 240px; margin: 0; }
      div { display: block; }
      #scroller { width: 100px; height: 100px; overflow: auto; }
      #content { position: relative; width: 300px; height: 400px; }
      #item { position: absolute; left: 200px; top: 200px;
        width: 20px; height: 20px; }
      scrollbarvertical { width: 10px; }
      scrollbarhorizontal { height: 10px; }
    </style></head><body><div id="scroller"><div id="content">
      <div id="item"/>
    </div></div></body></rml>`);
  document.show();
  context.update();
  const scroller = document.getElementById('scroller');
  const item = document.getElementById('item');

  const positions = [];
  for (let alignment = 0; alignment < 5; ++alignment) {
    scroller.scrollTo({ x: 0, y: 0 });
    item.scrollIntoView({ vertical: alignment, horizontal: alignment });
    positions.push([ scroller.scrollLeft, scroller.scrollTop ]);
  }
  assert.deepEqual(positions, reference.scrollPositions);
  console.log('PASS native-managed-scroll-all-alignments-on-both-axes');

  const [ vertical, horizontal, behavior, parentage ] =
    reference.scrollDefaults;
  scroller.scrollTo({ x: 0, y: 0 });
  item.scrollIntoView({ vertical, horizontal, behavior, parentage });
  const explicit = [ scroller.scrollLeft, scroller.scrollTop ];
  scroller.scrollTo({ x: 0, y: 0 });
  item.scrollIntoView({});
  assert.deepEqual([ scroller.scrollLeft, scroller.scrollTop ], explicit);
  scroller.scrollTo({ x: 0, y: 0 });
  item.scrollIntoView();
  assert.deepEqual([ scroller.scrollLeft, scroller.scrollTop ], explicit);
  console.log('PASS native-managed-scroll-defaults-empty-and-boolean');
} finally {
  rmlui.shutdown();
  window.close();
}
