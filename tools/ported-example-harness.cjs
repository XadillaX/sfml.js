'use strict';

// Test-only preload; normal examples do not load this file.
const assert = require('node:assert/strict');
const { basename, join } = require('node:path');
const sf = require('..');

sf.PlaybackDevice.setDeviceToNull();
const saveImage = sf.Image.prototype.saveToFile;
sf.Image.prototype.saveToFile = function(filename) {
  return saveImage.call(this, filename === '/tmp/xxx.png'
    ? join(process.env.SFML_PORTED_OUTPUT, 'xxx.png') : filename);
};

if (basename(process.argv[1]) === 'render_window.cjs') {
  // 虚拟显示器可能不足四种模式；测试使用桌面模式补齐示例选项。
  if (!sf.VideoMode.getFullscreenModes()[3]) {
    const mode = sf.VideoMode.getDesktopMode();
    sf.VideoMode.getFullscreenModes = () =>
      Array.from({ length: 4 }, () => new sf.VideoMode(mode));
  }
  sf.Keyboard.isKeyPressed = () => false;
  let mouseWrites = 0;
  sf.Mouse.setPosition = (position, window) => {
    assert.ok(window instanceof sf.RenderWindow);
    assert.ok(position.x >= 0 && position.y >= 0);
    mouseWrites++;
  };
  const draw = sf.RenderWindow.prototype.draw;
  const display = sf.RenderWindow.prototype.display;
  const clear = sf.RenderWindow.prototype.clear;
  let drawables = [];
  let frames = 0;
  sf.RenderWindow.prototype.clear = function(color, ...args) {
    assert.equal(color.toInteger(), 0xff0000ff);
    return clear.call(this, color, ...args);
  };
  sf.RenderWindow.prototype.draw = function(drawable, ...args) {
    drawables.push(drawable);
    return draw.call(this, drawable, ...args);
  };
  sf.RenderWindow.prototype.display = function() {
    const frame = frames + 1;
    assert.equal(drawables.length, 12);
    const positions = [
      [ 100, 150 ], [ 400, 450 ], [ 700, 550 ], [ 750, 550 ], [ 80, 90 ],
      [ frame, frame ], [ 0, 0 ], [ 0, 0 ], [ 200, 300 ],
      [ 300, 400 ], [ 500, 600 ],
    ];
    for (let i = 0; i < positions.length; i++) {
      const position = drawables[i].getPosition();
      assert.deepEqual([ position.x, position.y ], positions[i]);
    }
    const circle = drawables[5];
    assert.equal(circle.getRadius(), 100);
    assert.equal(circle.getPointCount(), frame + 1);
    assert.equal(circle.getScale().x, (1 + frame) % 5);
    assert.equal(circle.getFillColor().toInteger(), frame * 65536 + 255);
    assert.equal(circle.getOutlineColor().toInteger(), frame * 256 + 255);
    assert.equal(drawables[8].getCharacterSize(), 30);
    assert.match(drawables[8].getString(), /^你好 FPS: /);
    const lines = drawables[11];
    for (const [ i, x, y ] of [
      [ 0, 10, 0 ], [ 1, 20, 0 ], [ 2, 30, 5 ], [ 3, 40, 2 ],
    ]) {
      const vertex = lines.getVertex(i);
      assert.deepEqual([ vertex.position.x, vertex.position.y ], [ x, y ]);
      assert.equal(vertex.color.toInteger(), 0x00ff00ff);
    }
    assert.ok(sf.equal(this.getSize(),
      sf.VideoMode.getFullscreenModes()[3].size));
    drawables = [];
    display.call(this);
    if (++frames === 8) {
      assert.equal(mouseWrites, 8);
      this.close();
      console.log('VERIFIED: original scene parameters and 8 rendered frames');
    }
  };
  process.on('beforeExit', () => {
    assert.equal(frames, 8, 'The original scene must actually render');
  });
}
