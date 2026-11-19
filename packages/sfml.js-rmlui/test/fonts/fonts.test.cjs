'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const assets = path.resolve(__dirname,
  '../../third_party/rmlui/Samples/assets');
const lato = path.join(assets, 'LatoLatin-Regular.ttf');
const mono = path.join(assets, 'RobotoMono-Regular.ttf');
const emoji = path.join(assets, 'NotoEmoji-Regular.ttf');

// Build a two-face TTC from the pinned upstream fonts. Table offsets in a TTC
// are absolute; each copied sfnt directory must point into the collection.
function collection() {
  const fonts = [ fs.readFileSync(lato), fs.readFileSync(mono) ];
  let offset = 20;
  const header = Buffer.alloc(offset);
  header.write('ttcf');
  header.writeUInt32BE(0x00010000, 4);
  header.writeUInt32BE(2, 8);
  const parts = [ header ];
  for (const [ index, font ] of fonts.entries()) {
    header.writeUInt32BE(offset, 12 + index * 4);
    for (let table = 0; table < font.readUInt16BE(4); table++) {
      const position = 12 + table * 16 + 8;
      font.writeUInt32BE(font.readUInt32BE(position) + offset, position);
    }
    const padding = Buffer.alloc((4 - font.length % 4) % 4);
    parts.push(font, padding);
    offset += font.length + padding.length;
  }
  return Buffer.concat(parts);
}

function scene(context, family, style = 'normal', weight = 400) {
  const document = context.loadDocumentFromMemory(`
<rml><head><style>
body { width: 300px; font-family: ${family}; font-size: 20px;
       font-style: ${style}; font-weight: ${weight}; color: white; }
</style></head><body><p id="text">iiiiWWWW</p></body></rml>`);
  document.show();
  context.update();
  const text = document.querySelector('#text').getChild(0);
  const width = value => {
    text.setText(value);
    return text.generateLine(0, Infinity, 0, true, false, false).lineWidth;
  };
  return { document, text, width };
}

const cases = {
  'file-face-index-and-weight': function({ rmlui, context, root }) {
    const file = path.join(root, 'faces.ttc');
    fs.writeFileSync(file, collection());
    assert.equal(rmlui.loadFontFace(file, false, 530, 1), true);
    const selected = scene(context, 'Roboto Mono', 'normal', 530);
    assert.ok(selected.width('iiii') > 0);
    assert.equal(selected.width('iiii'), selected.width('WWWW'));
    assert.equal(rmlui.loadFontFace(file, false, 400, 2), false);
  },

  'named-file-face': function({ rmlui, context }) {
    assert.equal(rmlui.loadFontFace(mono, 'renamed', 1, 650, false, 0), true);
    const selected = scene(context, 'renamed', 'italic', 650);
    assert.ok(selected.width('iiii') > 0);
    assert.equal(selected.width('iiii'), selected.width('WWWW'));
    assert.equal(rmlui.loadFontFace(lato, 'default-weight', 0), true);
    assert.ok(scene(context, 'default-weight').width('text') > 0);
  },

  'competing-weights': function({ rmlui, context }) {
    for (const fromMemory of [ false, true ]) {
      const family = fromMemory ? 'memory-weights' : 'file-weights';
      const source = file => (fromMemory ? fs.readFileSync(file) : file);
      assert.ok(rmlui.loadFontFace(source(lato), family, 0, 400));
      assert.ok(rmlui.loadFontFace(source(mono), family, 0, 700));
      const regular = scene(context, family, 'normal', 400);
      assert.ok(regular.width('iiii') < regular.width('WWWW'));
      const bold = scene(context, family, 'normal', 700);
      assert.ok(bold.width('iiii') > 0);
      assert.equal(bold.width('iiii'), bold.width('WWWW'));
    }
    const boldFile = path.join(assets, 'LatoLatin-Bold.ttf');
    assert.ok(rmlui.loadFontFace(lato, false, 700));
    assert.ok(rmlui.loadFontFace(boldFile, false, 400));
    assert.ok(rmlui.loadFontFace(lato, 'known-regular', 0));
    assert.ok(rmlui.loadFontFace(boldFile, 'known-bold', 0));
    const sample = 'abcdefghijklmnopqrstuvwxyz';
    const regularWidth = scene(context, 'known-regular').width(sample);
    const boldWidth = scene(context, 'known-bold').width(sample);
    assert.notEqual(regularWidth, boldWidth);
    assert.equal(scene(context, 'LatoLatin', 'normal', 700)
      .width(sample), regularWidth);
    assert.equal(scene(context, 'LatoLatin', 'normal', 400)
      .width(sample), boldWidth);
  },

  'memory-slice-and-snapshot': function({ rmlui, sfml, context, window }) {
    const file = fs.readFileSync(mono);
    const padded = new Uint8Array(file.length + 32);
    padded.set(file, 16);
    const view = padded.subarray(16, 16 + file.length);
    assert.equal(rmlui.loadFontFace(view, 'memory-copy', 0), true);
    padded.fill(0);
    structuredClone(padded.buffer, { transfer: [ padded.buffer ] });
    const selected = scene(context, 'memory-copy');
    assert.ok(selected.width('iiii') > 0);
    assert.equal(selected.width('iiii'), selected.width('WWWW'));
    selected.text.setText('Memory glyphs');
    const capture = () => {
      context.update();
      window.clear(sfml.Color.Black);
      window.flush();
      context.render();
      const texture = new sfml.Texture(new sfml.Vector2u(300, 160));
      texture.update(window);
      return texture.copyToImage().pixels;
    };
    const before = capture();
    assert.ok(before.some((value, index) => index % 4 === 0 && value > 0));
    assert.equal(rmlui.releaseFontResources(), undefined);
    assert.deepEqual(capture(), before);
    assert.ok(selected.width('a different glyph') > 0);
    context.render();
  },

  'memory-collection-index': function({ rmlui, context }) {
    assert.equal(rmlui.loadFontFace(collection(), 'collection', 1, 700,
      false, 1), true);
    const selected = scene(context, 'collection', 'italic', 700);
    assert.ok(selected.width('iiii') > 0);
    assert.equal(selected.width('iiii'), selected.width('WWWW'));
    assert.equal(rmlui.loadFontFace(collection(), 'invalid-index', 0, 400,
      false, 2), false);
    assert.equal(rmlui.loadFontFace(new Uint8Array([ 1, 2, 3 ]),
      'invalid-data', 0), false);
    assert.equal(rmlui.loadFontFace(new Uint8Array(), 'empty', 0), false);
  },

  'caller-buffer-collectible': async function({ rmlui, context }) {
    let bytes = new Uint8Array(fs.readFileSync(lato));
    const weak = new WeakRef(bytes);
    assert.ok(rmlui.loadFontFace(bytes, 'collected', 0));
    bytes = null;
    for (let attempt = 0; attempt < 8; attempt++) {
      await new Promise(resolve => setImmediate(resolve));
      global.gc();
    }
    assert.equal(weak.deref(), undefined);
    assert.ok(scene(context, 'collected').width('after collection') > 0);
    rmlui.releaseFontResources();
    context.render();
  },

  'invalid-arguments': function({ rmlui }) {
    for (const weight of [ -1, 1001, 0.5, NaN, Infinity, '400' ]) {
      assert.throws(() => rmlui.loadFontFace(lato, false, weight),
        /weight/i);
    }
    for (const index of [ -1, 0.5, 2 ** 31, NaN, '0' ]) {
      assert.throws(() => rmlui.loadFontFace(lato, false, 0, index),
        /index/i);
    }
    assert.throws(() => rmlui.loadFontFace(lato, 1), /fallback/i);
    assert.throws(() => rmlui.loadFontFace(mono, 'name'), /style/i);
    assert.throws(() => rmlui.loadFontFace(mono, 'name', 2), /style/i);
    assert.throws(() => rmlui.loadFontFace(mono, 'name', 0, 0, 1),
      /fallback/i);
    assert.throws(() => rmlui.loadFontFace(new Uint8Array([ 1 ])),
      /family/i);
    assert.throws(() => rmlui.loadFontFace(new Uint16Array(4), 'name', 0),
      /Uint8Array/i);
    const detached = new Uint8Array(4);
    structuredClone(detached.buffer, { transfer: [ detached.buffer ] });
    assert.throws(() => rmlui.loadFontFace(detached, 'name', 0),
      /detached/i);
    assert.throws(() => rmlui.loadFontFace(
      new Uint8Array(new SharedArrayBuffer(4)), 'name', 0), /shared/i);
  },

  'lifetime-and-reentrant-release': function({ rmlui, context, window }) {
    assert.ok(rmlui.loadFontFace(fs.readFileSync(lato), 'lifetime', 0));
    const selected = scene(context, 'lifetime');
    selected.document.addEventListener('probe', () => {
      assert.throws(() => rmlui.releaseFontResources(), /callback/i);
      assert.throws(() => rmlui.loadFontFace(lato), /callback/i);
    });
    selected.document.dispatchEvent('probe');
    rmlui.shutdown();
    assert.throws(() => rmlui.loadFontFace(lato), /initialised/i);
    assert.throws(() => rmlui.releaseFontResources(), /initialised/i);
    assert.ok(rmlui.initialise(window, { highDpi: false }));
    assert.ok(rmlui.loadFontFace(fs.readFileSync(mono), 'lifetime', 0));
    const next = rmlui.createContext('restarted', 300, 160);
    const replacement = scene(next, 'lifetime');
    assert.ok(replacement.width('iiii') > 0);
    assert.equal(replacement.width('iiii'), replacement.width('WWWW'));
  },
};

for (const mode of [ 'file', 'named-file', 'memory' ]) {
  cases[`fallback-${mode}`] = function({ rmlui, context }) {
    assert.ok(rmlui.loadFontFace(lato));
    const primary = scene(context, 'LatoLatin');
    const missing = primary.width('🌙');
    assert.ok(rmlui.loadFontFace(emoji, 'emoji-reference', 0));
    const reference = scene(context, 'emoji-reference').width('🌙');
    assert.notEqual(reference, missing);
    // A face registered without fallback must not supply missing glyphs.
    assert.equal(primary.width('🌙'), missing);
    if (mode === 'file') {
      assert.ok(rmlui.loadFontFace(emoji, true));
    } else {
      const source = mode === 'memory' ? fs.readFileSync(emoji) : emoji;
      assert.ok(rmlui.loadFontFace(source, 'fallback-face', 0, 0, true));
    }
    assert.equal(primary.width('🌙'), reference);
  };
}

async function run(name) {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'rmlui-fonts-'));
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(300, 160)), 'Font contracts');
  try {
    assert.ok(rmlui.initialise(window, { highDpi: false }));
    const context = rmlui.createContext('fonts', 300, 160);
    await cases[name]({ rmlui, sfml, context, window, root });
  } finally {
    rmlui.shutdown();
    window.close();
    fs.rmSync(root, { recursive: true, force: true });
  }
}

if (process.argv[2]) {
  run(process.argv[2]).catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
} else {
  let failures = 0;
  for (const name of Object.keys(cases)) {
    const result = spawnSync(process.execPath,
      [ '--expose-gc', __filename, name ], {
        encoding: 'utf8', timeout: 20000,
      });
    if (result.status !== 0) {
      failures++;
      console.error(`FAIL ${name}: ${result.signal ?? result.status}`,
        result.error ?? '', result.stdout, result.stderr);
    } else {
      console.log(`PASS ${name}`);
    }
  }
  assert.equal(failures, 0, `${failures} font regressions failed`);
}
