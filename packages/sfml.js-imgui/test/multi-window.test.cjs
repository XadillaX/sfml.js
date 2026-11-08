'use strict';

const assert = require('node:assert');
const sfml = require('sfml.js');
const imgui = require('../dist');

const { ImGui, SFML } = imgui;
const first = new sfml.RenderWindow(
  new sfml.VideoMode(new sfml.Vector2u(320, 240)), 'sfml.js-imgui first');
const second = new sfml.RenderWindow(
  new sfml.VideoMode(new sfml.Vector2u(400, 300)), 'sfml.js-imgui second');

assert.ok(SFML.Init(first));
assert.ok(SFML.Init(second));

const windows = [ first, second ];
for (let frame = 0; frame < 2; frame++) {
  for (const window of windows) {
    let event;
    while ((event = window.pollEvent()) !== undefined) {
      if (event.is('Closed')) {
        window.close();
      }
      SFML.ProcessEvent(window, event);
    }
    SFML.Update(window, 0.016);
    const io = SFML.GetIO();
    assert.strictEqual(io.displayWidth, window.getSize().x);
    assert.strictEqual(io.displayHeight, window.getSize().y);

    if (ImGui.Begin(window === first ? 'first' : 'second')) {
      ImGui.TextUnformatted('multi-window');
    }
    ImGui.End();
    window.clear(sfml.Color.Black);
    SFML.Render(window);
    window.display();
  }
}

assert.strictEqual(SFML.GetIO().displayWidth, 400);
SFML.SetCurrentWindow(first);
assert.strictEqual(SFML.GetIO().displayWidth, 320);
SFML.SetCurrentWindow(second);
assert.strictEqual(SFML.GetIO().displayWidth, 400);

SFML.Shutdown(first);
SFML.Shutdown(second);
first.close();
second.close();
console.log('[sfml.js-imgui] multi-window ok');
