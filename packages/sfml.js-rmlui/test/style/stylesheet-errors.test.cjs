'use strict';

const assert = require('node:assert/strict');
const sfml = require('sfml.js');
const rmlui = require('../../dist');

const window = new sfml.RenderWindow(
  new sfml.VideoMode(new sfml.Vector2u(160, 120)), 'Stylesheet diagnostics');
const diagnostics = [];
const system = new rmlui.SystemInterface(window, {
  logMessage(type, message) {
    diagnostics.push({ type, message });
    return true;
  },
});
rmlui.setSystemInterface(system);
assert.equal(rmlui.initialise(window, { highDpi: false }), true);

try {
  const context = rmlui.createContext('stylesheet-errors', 160, 120);
  const document = context.loadDocumentFromMemory(
    '<rml><body><div id="target"/></body></rml>');
  const target = document.getElementById('target');

  for (const [ startLine, expectedLine ] of [[ 1, 2 ], [ 40, 41 ]]) {
    diagnostics.length = 0;
    const container = new rmlui.StyleSheetContainer();
    const source = 'styles/解析-error.rcss';
    // The Native parser reports and ignores the invalid decorator block,
    // then continues parsing the following valid rule.
    assert.equal(container.loadStyleSheetContainer(
      '\n@decorator broken {}\ndiv { width:17px; }',
      source, startLine), true);
    assert.deepEqual(diagnostics, [{
      type: rmlui.LogType.Warning,
      message: `Decorator syntax error at ${source}:${expectedLine}. ` +
        "Use syntax: '@decorator name : type { ... }'.",
    }, {
      type: rmlui.LogType.Warning,
      message: "Invalid character '}' found while parsing stylesheet at " +
        `${source}:${expectedLine}. Trying to proceed.`,
    }]);
    assert.equal(container.updateCompiledStyleSheet(context), true);
    const sheet = container.getCompiledStyleSheet();
    assert.equal(sheet.getNamedDecorator('broken'), null);
    assert.equal(sheet.getElementDefinition(target)
      .getProperty(rmlui.PropertyId.Width).get(0), 17);
    console.log(`PASS malformed-rcss-source-and-start-line-${startLine}`);
  }
} finally {
  rmlui.shutdown();
  window.close();
}
