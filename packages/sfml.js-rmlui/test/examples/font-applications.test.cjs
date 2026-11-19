'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const samplesRoot = path.resolve(__dirname, '../../third_party/rmlui/Samples');
const white = { red: 255, green: 255, blue: 255, alpha: 255 };

const cases = {
  'bitmap-original-text-advance-kerning-and-atlas':
    ({ rmlui, context, app, engine }) => {
      const paragraphs = app.document.querySelectorAll('p');
      assert.equal(paragraphs.length, 3);
      assert.equal(paragraphs[2].isClassSet('custom_family'), true);
      const text = paragraphs[0].getFirstChild();
      const line = text.generateLine(0, Infinity, 0, true, false, false);
      assert.equal(line.line, 'This is a bitmap font sample!');
      const face = text.getFontFaceHandle();
      const xml = fs.readFileSync(path.join(samplesRoot,
        'basic/bitmap_font/data/Comfortaa_Regular_22.fnt'), 'utf8');
      const glyphs = new Map();
      const kernings = new Map();
      for (const match of xml.matchAll(/<char\s+([^>]+)\/>/g)) {
        const values = Object.fromEntries(Array.from(
          match[1].matchAll(/(\w+)="(-?\d+)"/g),
          entry => [ entry[1], Number(entry[2]) ]));
        glyphs.set(values.id, values);
      }
      for (const match of xml.matchAll(
        /<kerning first="(\d+)" second="(\d+)" amount="(-?\d+)"/g)) {
        kernings.set(`${match[1]},${match[2]}`, Number(match[3]));
      }

      let expected = 0;
      let previous = 0;
      for (const character of line.line) {
        const code = character.codePointAt(0);
        assert.ok(glyphs.has(code), `original atlas lacks ${character}`);
        expected += glyphs.get(code).xadvance +
          (kernings.get(`${previous},${code}`) ?? 0);
        previous = code;
      }
      assert.equal(line.lineWidth, expected);
      assert.equal(engine.getStringWidth(face, line.line), expected);
      const manager = new rmlui.RenderManager(rmlui.getRenderInterface());
      const output = engine.generateString(manager, face, null, line.line,
        { x: 0, y: 30 }, white, 1);
      assert.equal(output.width, expected);
      assert.equal(output.meshes.length, 1);
      const width = Number(xml.match(/scaleW="(\d+)"/)[1]);
      const height = Number(xml.match(/scaleH="(\d+)"/)[1]);
      assert.deepEqual(output.meshes[0].texture.getDimensions(),
        { x: width, y: height });
      const first = glyphs.get('T'.codePointAt(0));
      const uv = output.meshes[0].mesh.getVertex(0).texCoord;
      assert.ok(Math.abs(uv.x - first.x / width) < 1e-6);
      assert.ok(Math.abs(uv.y - first.y / height) < 1e-6);
      assert.equal(engine.getFontMetrics(face).size, 22);
      context.render();
    },

  'harfbuzz-original-language-controls-lines-and-conjuncts':
    ({ rmlui, context, app, engine }) => {
      const document = app.document;
      const languages = [
        [ 'english', 'en', 'ffi', 4 ],
        [ 'arabic', 'ar', 'لا', 4 ],
        [ 'hindi', 'hi', 'क्ष', 8 ],
      ];
      const paragraphs = languages.map(([ , language ]) =>
        document.getElementById(`lorem-ipsum-${language}`));
      for (const [ index, [ control, language, cluster, maxVertices ]]
        of languages.entries()) {
        document.getElementById(`set-${control}`).click();
        context.update();
        context.render();
        for (const [ other, paragraph ] of paragraphs.entries()) {
          assert.equal(paragraph.isVisible(), other === index);
        }
        const text = paragraphs[index].getFirstChild();
        const face = text.getFontFaceHandle();
        const shaping = new rmlui.TextShapingContext(language);
        const lines = text.getLines();
        assert.ok(lines.length > 1, `${language}: original paragraph layout`);
        for (const line of lines) {
          assert.equal(line.width,
            engine.getStringWidth(face, line.text, shaping),
            `${language}: native line width for ${line.text}`);
        }
        const manager = new rmlui.RenderManager(rmlui.getRenderInterface());
        const output = engine.generateString(manager, face, null, cluster,
          { x: 0, y: 30 }, white, 1, shaping);
        const vertices = output.meshes.reduce(
          (count, item) => count + item.mesh.vertexCount, 0);
        assert.ok(vertices > 0 && vertices <= maxVertices,
          `${language}: native cluster uses ${vertices} vertices`);
        assert.equal(output.width,
          engine.getStringWidth(face, cluster, shaping));
        assert.equal(engine.getFontMetrics(face).size, 22);
      }
    },
};

function run(name) {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const applicationModule = name.startsWith('bitmap')
    ? require('../../examples/official/basic/bitmap_font/main.cjs')
    : require('../../examples/official/basic/harfbuzz/main.cjs');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(1024, 768)),
    'Font application contracts',
    { settings: { stencilBits: 8 } });
  try {
    const { engine } = applicationModule.prepare();
    assert.ok(rmlui.initialise(window, {
      highDpi: false, fileRoot: samplesRoot,
    }));
    for (const font of applicationModule.fonts) {
      assert.ok(rmlui.loadFontFace(font));
    }
    const context = rmlui.createContext('font-applications', 1024, 768);
    const app = name.startsWith('bitmap')
      ? applicationModule.createBitmapFont(context)
      : applicationModule.createHarfBuzz(context);
    context.update();
    cases[name]({ rmlui, context, app, engine });
    app.close();
    context.update();
    assert.equal(context.getNumDocuments(), 0);
  } finally {
    rmlui.shutdown();
    window.close();
  }
}

if (process.argv[2]) {
  run(process.argv[2]);
} else {
  let failures = 0;
  for (const name of Object.keys(cases)) {
    const result = spawnSync(process.execPath, [ __filename, name ], {
      encoding: 'utf8', timeout: 25000,
    });
    if (result.status !== 0) {
      failures++;
      console.error(`FAIL ${name}: ${result.signal ?? result.status}`,
        result.error ?? '', result.stdout, result.stderr);
    } else {
      console.log(`PASS ${name}`);
    }
  }
  assert.equal(failures, 0, `${failures} original font application failures`);
}
