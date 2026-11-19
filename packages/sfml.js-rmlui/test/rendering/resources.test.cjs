'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const sfml = require('sfml.js');
const rmlui = require('../../dist');

// Root-relative RCSS must resolve without changing the process directory.
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'rmlui-resources-'));
fs.writeFileSync(path.join(root, 'theme.rcss'), `
body { width: 640px; height: 480px; --panel-left: 10px; }
#panel {
  display: block; position: absolute;
  left: var(--panel-left); top: 10px;
  width: 60px; height: 60px; background: white;
}
@media (theme: dark) { body { --panel-left: 200px; } }
`);
fs.writeFileSync(path.join(root, 'document.rml'), `
<rml>
  <head><title>Rooted resources</title>
    <link type="text/rcss" href="/theme.rcss"/>
  </head>
  <body><div id="panel"/></body>
</rml>
`);

const window = new sfml.RenderWindow(
  new sfml.VideoMode(new sfml.Vector2u(640, 480)),
  'sfml.js-rmlui resources test',
  { settings: { stencilBits: 8 } });

try {
  assert.ok(rmlui.initialise(window, { fileRoot: root }));
  const context = rmlui.createContext('resources', 640, 480);
  const document = context.loadDocument('/document.rml');
  assert.equal(document.title, 'Rooted resources');
  document.show();
  const panel = document.getElementById('panel');
  let clicks = 0;
  panel.addEventListener('click', () => {
    clicks += 1;
  });

  const click = x => {
    context.update();
    const position = { x, y: 30 };
    context.processEvent({ kind: 'MouseMoved', position });
    context.processEvent({ kind: 'MouseButtonPressed', button: 0, position });
    context.processEvent({ kind: 'MouseButtonReleased', button: 0, position });
  };

  click(30);
  assert.equal(clicks, 1, 'root-relative stylesheet controls layout');
  assert.equal(context.isThemeActive('dark'), false);
  context.activateTheme('dark', true);
  assert.equal(context.isThemeActive('dark'), true);
  click(230);
  assert.equal(clicks, 2, 'theme activation updates the variable and layout');
  document.setProperty('--panel-left', '400px');
  click(430);
  assert.equal(clicks, 3, 'local variable overrides the theme');
  document.removeProperty('--panel-left');
  click(230);
  assert.equal(clicks, 4, 'removing the override restores the theme');
  context.activateTheme('dark', false);
  click(30);
  assert.equal(clicks, 5, 'deactivating the theme restores the default');

  // Absolute paths outside fileRoot still use the normal file fallback.
  assert.ok(rmlui.loadFontFace(path.resolve(
    __dirname,
    '../../third_party/rmlui/Samples/assets/LatoLatin-Regular.ttf')));
  document.unload();
  context.remove();
  rmlui.shutdown();

  // A later initialisation must not retain a freed custom file interface.
  fs.writeFileSync(path.join(root, 'absolute.rml'),
    '<rml><head><title>Absolute path</title></head><body/></rml>');
  assert.ok(rmlui.initialise(window));
  const next = rmlui.createContext('default-files', 640, 480);
  const absolute = next.loadDocument(path.join(root, 'absolute.rml'));
  assert.equal(absolute.title, 'Absolute path');
  absolute.unload();
  next.remove();
} finally {
  rmlui.shutdown();
  window.close();
  fs.rmSync(root, { recursive: true, force: true });
}

console.log('[sfml.js-rmlui] resource root and theme interaction passed');
