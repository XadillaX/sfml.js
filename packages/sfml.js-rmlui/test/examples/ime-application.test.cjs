'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const sfml = require('sfml.js');
const rmlui = require('../../dist');
const { createIme, fonts } =
  require('../../examples/official/basic/ime/main.cjs');
const root = path.resolve(__dirname, '../../third_party/rmlui/Samples');
const window = new sfml.RenderWindow(
  new sfml.VideoMode(new sfml.Vector2u(1024, 768)), 'IME application',
  { settings: { stencilBits: 8 } });

try {
  assert.ok(rmlui.initialise(window, { highDpi: false, fileRoot: root }));
  assert.equal(fonts.length, 10);
  assert.deepEqual(fonts.slice(0, 4).map(face => face.fallback),
    [ false, false, false, false ]);
  for (const [ index, face ] of fonts.entries()) {
    if (index >= 4) {
      assert.equal(face.fallback, true);
      assert.equal(face.weight, rmlui.FontWeight.Normal);
    }
    assert.ok(rmlui.loadFontFace(face.file, face.fallback, face.weight),
      `original face ${face.file}`);
  }
  const context = rmlui.createContext('ime-application', 1024, 768);
  assert.ok(rmlui.Debugger.initialise(context));
  const retainedDocuments = context.getNumDocuments();
  const application = createIme(context);
  context.update();
  const input = application.document.getElementById('text');
  const textarea = application.document.getElementById('text_area');
  const source = fs.readFileSync(path.join(root,
    'basic/ime/data/ime.rml'), 'utf8');
  const originalText = source.match(/<textarea[^>]*>([\s\S]*?)<\/textarea>/)[1];
  assert.ok(input instanceof rmlui.ElementFormControlInput);
  assert.ok(textarea instanceof rmlui.ElementFormControlTextArea);
  assert.equal(input.getValue(), '😁');
  assert.equal(input.getAttribute('maxlength'), '100');
  assert.equal(textarea.getValue(), originalText);
  assert.ok(application.document.isVisible());
  console.log('PASS original IME form, emoji and eight-language textarea');

  const engine = rmlui.getFontEngineInterface();
  const face = textarea.getFontFaceHandle();
  const manager = new rmlui.RenderManager(rmlui.getRenderInterface());
  for (const text of [ 'あ', '한', '界', '嗎', 'ส', 'ش', '😁' ]) {
    const output = engine.generateString(manager, face, null, text,
      { x: 0, y: 30 }, { red: 255, green: 255, blue: 255, alpha: 255 }, 1);
    assert.ok(output.width > 0);
    assert.ok(output.meshes.some(item => item.mesh.vertexCount > 0));
  }
  window.clear(sfml.Color.Black);
  window.flush();
  context.render();
  console.log('PASS original Noto fallback fonts generate native glyph meshes');

  assert.ok(input.focus());
  input.setSelectionRange(0, 1);
  context.processTextInput('日本語');
  assert.equal(input.getValue(), '日本語');
  assert.equal(textarea.getValue(), originalText);
  assert.ok(textarea.focus());
  textarea.setSelectionRange(0, 7);
  context.processTextInput('中文');
  assert.equal(textarea.getValue(), '中文' + originalText.slice(7));
  assert.equal(input.getValue(), '日本語');
  application.close();
  context.update();
  assert.equal(context.getNumDocuments(), retainedDocuments);
  assert.throws(() => textarea.getValue(), /valid/i);
  console.log('PASS native Unicode replacement, focus switching and close');
} finally {
  rmlui.shutdown();
  window.close();
}
