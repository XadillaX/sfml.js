'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { packageRoot, upstream, catalog, captures } = require('./catalog.cjs');
const { register } = require('./xml-handlers.cjs');
const interactions = require('./interactions/actions.cjs');
const sfml = require('sfml.js');
const rmlui = require('../../dist');

/**
 * Snapshot the same native box fields collected by the C++ reference.
 * @param {object} element Live native element.
 * @param {string} nodePath Stable child-index path.
 * @param {object[]} result Snapshot output.
 * @param {boolean} detailed Include live interaction state.
 */
function elements(element, nodePath = '0', result = [], detailed = false) {
  const offset = element.getAbsoluteOffset(rmlui.BoxArea.Border);
  const box = element.getBox();
  const size = box.getSize(rmlui.BoxArea.Border);
  const content = box.getSize(rmlui.BoxArea.Content);
  const boxes = Array.from({ length: element.getNumBoxes() }, (_, index) => {
    const positioned = element.getBox(index);
    const border = positioned.box.getSize(rmlui.BoxArea.Border);
    const inner = positioned.box.getSize(rmlui.BoxArea.Content);
    return [
      positioned.offset.x, positioned.offset.y,
      border.x, border.y, inner.x, inner.y,
    ];
  });
  const scroll = element.getElementScroll();
  const bounds = rmlui.ElementUtilities.getBoundingBox(
    element, rmlui.BoxArea.Auto);
  const snapshot = {
    path: nodePath, tag: element.tagName, id: element.id,
    classes: element.getClassNames(),
    rect: [ offset.x, offset.y, size.x, size.y ],
    content: [ content.x, content.y ],
    scroll: [ element.scrollWidth, element.scrollHeight ],
    boxes, baseline: element.baseline, visible: element.isVisible(),
    scrollbars: [
      scroll.getScrollbarSize(rmlui.ScrollOrientation.HORIZONTAL),
      scroll.getScrollbarSize(rmlui.ScrollOrientation.VERTICAL),
    ],
    inkBounds: bounds
      ? [ bounds.p0.x, bounds.p0.y, bounds.p1.x, bounds.p1.y ] : null,
  };
  if (detailed) {
    snapshot.value = [ 'input', 'textarea', 'select' ].includes(element.tagName)
      ? element.getValue() : null;
    snapshot.scrollOffset = [ element.scrollLeft, element.scrollTop ];
    snapshot.pseudo = Object.fromEntries(
      [ 'hover', 'active', 'checked', 'drag', 'focus', 'focus-visible' ]
        .map(name => [ name, element.isPseudoClassSet(name) ]));
  }
  result.push(snapshot);
  for (let index = 0; index < element.getNumChildren(); index++) {
    elements(element.getChild(index), `${nodePath}/${index}`, result, detailed);
  }
  return result;
}

async function main() {
  const output = path.resolve(process.argv[2]);
  const actions = process.argv[3] ? interactions.load(process.argv[3]) : null;
  assert.ok(fs.statSync(output).isDirectory());
  assert.ok(!output.startsWith(`${packageRoot}${path.sep}`));
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(1024, 768)),
    'SFML VisualTests capture',
    { settings: { stencilBits: 8, antiAliasingLevel: 0 } }
  );
  window.setVisible(false);
  let warnings = [];
  let errors = [];
  const system = new rmlui.SystemInterface(window, {
    logMessage(type, message) {
      if (type === rmlui.LogType.Warning) {
        warnings.push(message);
      }
      if (type === rmlui.LogType.Error) {
        errors.push(message);
      }
      return true;
    },
  });
  rmlui.setSystemInterface(system);
  try {
    assert.ok(rmlui.initialise(window, {
      highDpi: false, fileRoot: path.join(upstream, 'Samples'),
    }));
    const size = window.getSize();
    assert.deepEqual([ size.x, size.y ], [ 1024, 768 ]);
    register(rmlui);
    for (const font of [
      'LatoLatin-Regular', 'LatoLatin-Italic', 'LatoLatin-Bold',
      'LatoLatin-BoldItalic', 'NotoEmoji-Regular', 'RobotoMono-Regular',
      'RobotoMono-Italic', 'RobotoMono-Bold', 'RobotoMono-BoldItalic',
    ]) {
      assert.ok(rmlui.loadFontFace(`/assets/${font}.ttf`,
        font === 'NotoEmoji-Regular'));
    }
    const context = rmlui.createContext('visual', 1024, 768);
    assert.ok(rmlui.Debugger.initialise(context));
    context.setDensityIndependentPixelRatio(1);
    const capture = new sfml.Texture(window.getSize());
    const scenes = actions ? catalog().filter(page => actions.has(page.name))
      : captures(catalog());
    for (const scene of scenes) {
      warnings = [];
      errors = [];
      system.clock[0] = 0;
      if (actions) {
        context.setDimensions(1024, 768);
        context.setDensityIndependentPixelRatio(1);
        context.processMouseMove(-1, -1);
      }
      const document = context.loadDocument(scene.file);
      assert.ok(document, scene.name);
      document.show(rmlui.ModalFlag.None, rmlui.FocusFlag.None);
      assert.ok(context.update());
      system.clock[0] = 1;
      assert.ok(context.update());
      const sceneWarnings = warnings;
      const sceneErrors = errors;
      const captureFrame = async (frame, pointer = [ -1, -1 ]) => {
        window.clear(sfml.Color.Black);
        window.flush();
        assert.ok(context.render());
        capture.update(window);
        assert.ok(await capture.copyToImage().saveToFile(
          path.join(output, `${frame}.png`)));
        const snapshot = {
          title: document.title,
          scrollPosition: [ document.scrollLeft, document.scrollTop ],
          elements: elements(document, '0', [], Boolean(actions)),
          warnings: sceneWarnings, errors: sceneErrors,
        };
        if (actions) {
          snapshot.pointer = pointer;
          snapshot.dimensions = [
            context.dimensions.width, context.dimensions.height,
          ];
          snapshot.density = context.densityIndependentPixelRatio;
          snapshot.time = system.clock[0];
          snapshot.focus =
            context.getFocusElement()?.getAddress(false, true) ?? '';
          snapshot.hover =
            context.getHoverElement()?.getAddress(false, true) ?? '';
        }
        fs.writeFileSync(path.join(output, `${frame}.json`),
          JSON.stringify(snapshot, null, 2) + '\n');
        console.log(`CAPTURE SFML ${frame} warnings=${sceneWarnings.length}` +
          ` errors=${sceneErrors.length}`);
      };
      if (actions) {
        await captureFrame(scene.name);
        await interactions.run({
          context, document, system, actions: actions.get(scene.name),
          capture: (checkpoint, pointer) => captureFrame(
            `${scene.name}--${checkpoint}`, pointer),
        });
        document.close();
        assert.ok(context.update());
        continue;
      }
      const maxX = Math.max(0, document.scrollWidth - document.clientWidth);
      const maxY = Math.max(0, document.scrollHeight - document.clientHeight);
      let row = 0;
      for (let y = 0; ; y = Math.min(y + 600, maxY), row++) {
        let column = 0;
        for (let x = 0; ; x = Math.min(x + 600, maxX), column++) {
          document.scrollLeft = x;
          document.scrollTop = y;
          assert.ok(context.update());
          const frame = row === 0 && column === 0
            ? scene.name : `${scene.name}--scroll-${column}-${row}`;
          await captureFrame(frame);
          if (x === maxX) {
            break;
          }
        }
        if (y === maxY) {
          break;
        }
      }
      document.close();
      assert.ok(context.update());
    }
  } finally {
    rmlui.shutdown();
    window.close();
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
