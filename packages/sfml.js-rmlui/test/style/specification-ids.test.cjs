'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');

const cases = {
  'local-specification-enums-have-zero-bridge-access': ({ rmlui, window }) => {
    const native = require('../../build/Release/rmlui.node');
    assert.ok(rmlui.MediaQueryId);
    assert.ok(rmlui.FontFaceId);
    assert.ok(rmlui.initialise(window, { highDpi: false }));

    native.beginDataDiagnostics(false);
    let checksum = 0;
    let counts;
    try {
      for (let i = 0; i < 100000; ++i) {
        checksum += rmlui.MediaQueryId.Theme + rmlui.FontFaceId.FaceIndex;
      }
    } finally {
      counts = native.endDataDiagnostics();
    }

    assert.equal(checksum, 2000000);
    assert.equal(counts.runtimeEntries, 0);
    assert.equal(counts.nativeCallbacks, 0);
    assert.equal(rmlui.MediaQueryId.Invalid, 0);
    assert.equal(rmlui.MediaQueryId.NumDefinedIds, 15);
    assert.equal(rmlui.FontFaceId.Invalid, 0);
    assert.equal(rmlui.FontFaceId.NumDefinedIds, 7);
  },

  'all-media-features-follow-context-state': ({ rmlui, window }) => {
    assert.ok(rmlui.initialise(window, { highDpi: false }));
    const context = rmlui.createContext('media-ids', 320, 240);
    context.setDensityIndependentPixelRatio(2);
    context.activateTheme('night', true);

    const queries = [
      [ 'width', '320px' ], [ 'min-width', '320px' ],
      [ 'max-width', '320px' ], [ 'height', '240px' ],
      [ 'min-height', '240px' ], [ 'max-height', '240px' ],
      [ 'aspect-ratio', '4/3' ], [ 'min-aspect-ratio', '4/3' ],
      [ 'max-aspect-ratio', '4/3' ], [ 'resolution', '2x' ],
      [ 'min-resolution', '2x' ], [ 'max-resolution', '2x' ],
      [ 'orientation', 'landscape' ], [ 'theme', 'night' ],
    ];
    const containers = queries.map(([ feature, value ], index) => {
      const container = new rmlui.StyleSheetContainer();
      assert.equal(container.loadStyleSheetContainer(
        `@media (${feature}: ${value}) {
          @spritesheet sheet-${index} {
            src: media.png; match: 1px 2px 3px 4px;
          }
        }`, 'media.rcss'), true);
      assert.equal(container.updateCompiledStyleSheet(context), true);
      assert.ok(container.getCompiledStyleSheet().getSprite('match'), feature);
      assert.equal(container.updateCompiledStyleSheet(context), false);
      return container;
    });

    context.setDimensions(240, 320);
    context.setDensityIndependentPixelRatio(1);
    context.activateTheme('night', false);
    const matching = new Set([ 2, 4, 8, 11 ]);
    containers.forEach((container, index) => {
      container.updateCompiledStyleSheet(context);
      const sprite = container.getCompiledStyleSheet().getSprite('match');
      assert.equal(Boolean(sprite), matching.has(index), queries[index][0]);
    });
  },

  'font-face-local-fields-preserve-defaults-and-source-order':
    ({ rmlui, window }) => {
      const calls = [];
      const engine = new rmlui.FontEngineInterface({
        loadFontFaceNamed(...args) {
          calls.push(args);
          return true;
        },
      });
      rmlui.setFontEngineInterface(engine);
      assert.ok(rmlui.initialise(window, { highDpi: false }));

      const container = new rmlui.StyleSheetContainer();
      assert.equal(container.loadStyleSheetContainer(`
        @font-face {
          font-family: default-family;
          src: first.ttf;
        }
        @font-face {
          font-family: explicit-family;
          font-style: italic;
          font-weight: 650;
          src: second.ttf, third.ttf;
          -rmlui-fallback-face: true;
          -rmlui-face-index: 2;
        }`, 'fonts.rcss'), true);

      assert.deepEqual(calls, [
        [ 'first.ttf', 0, 'default-family', 0, 0, false ],
        [ 'second.ttf', 2, 'explicit-family', 1, 650, true ],
        [ 'third.ttf', 2, 'explicit-family', 1, 650, true ],
      ]);
    },
};

function run(name) {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(320, 240)), 'Specification IDs');

  try {
    cases[name]({ rmlui, window });
  } finally {
    rmlui.shutdown();
    rmlui.setFontEngineInterface(null);
    window.close();
  }
}

if (process.argv[2]) {
  run(process.argv[2]);
} else {
  let failures = 0;
  for (const name of Object.keys(cases)) {
    const result = spawnSync(process.execPath, [ __filename, name ], {
      encoding: 'utf8', timeout: 20000,
    });
    if (result.status !== 0) {
      ++failures;
      console.error(`FAIL ${name}: ${result.signal ?? result.status}`,
        result.error ?? '', result.stdout, result.stderr);
    } else {
      console.log(`PASS ${name}`);
    }
  }

  assert.equal(failures, 0,
    `${failures} local specification regressions failed`);
}
