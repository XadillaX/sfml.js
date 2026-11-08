'use strict';

// Port of SFML/examples/keyboard/Keyboard.cpp; see ../README.md.
const assert = require('node:assert/strict');
const path = require('node:path');
const sf = require('../../..');

const keySize = 54;
const padding = 4;

/**
 * Describe one physical key using the original size and right margin.
 * @param {string} name - Scancode name.
 * @param {number[]} size - Width and height in key units.
 * @param {number} margin - Right margin in key units.
 */
function cell(name, size = [ 1, 1 ], margin = 0) {
  return { code: sf.Keyboard.Scan[name], size, margin };
}

// The nine rows contain every scancode exactly once, as in the C++ example.
const matrix = [{
  margin: 0.5,
  cells: [
    cell('Escape', [ 1, 1 ], 1),
    cell('F1'), cell('F2'), cell('F3'), cell('F4', [ 1, 1 ], 0.5),
    cell('F5'), cell('F6'), cell('F7'), cell('F8', [ 1, 1 ], 0.5),
    cell('F9'), cell('F10'), cell('F11'), cell('F12', [ 1, 1 ], 0.5),
    cell('PrintScreen'), cell('ScrollLock'), cell('Pause'),
  ],
}, {
  cells: [
    cell('Grave'), cell('Num1'), cell('Num2'), cell('Num3'), cell('Num4'),
    cell('Num5'), cell('Num6'), cell('Num7'), cell('Num8'), cell('Num9'),
    cell('Num0'), cell('Hyphen'), cell('Equal'),
    cell('Backspace', [ 2, 1 ], 0.5),
    cell('Insert'), cell('Home'), cell('PageUp', [ 1, 1 ], 0.5),
    cell('NumLock'), cell('NumpadDivide'), cell('NumpadMultiply'),
    cell('NumpadMinus'),
  ],
}, {
  cells: [
    cell('Tab', [ 1.5, 1 ]), cell('Q'), cell('W'), cell('E'), cell('R'),
    cell('T'), cell('Y'), cell('U'), cell('I'), cell('O'), cell('P'),
    cell('LBracket'), cell('RBracket'), cell('Backslash', [ 1.5, 1 ], 0.5),
    cell('Delete'), cell('End'), cell('PageDown', [ 1, 1 ], 0.5),
    cell('Numpad7'), cell('Numpad8'), cell('Numpad9'), cell('NumpadPlus'),
  ],
}, {
  cells: [
    cell('CapsLock', [ 1.75, 1 ]), cell('A'), cell('S'), cell('D'), cell('F'),
    cell('G'), cell('H'), cell('J'), cell('K'), cell('L'), cell('Semicolon'),
    cell('Apostrophe'), cell('Enter', [ 2.25, 1 ], 4),
    cell('Numpad4'), cell('Numpad5'), cell('Numpad6'), cell('NumpadEqual'),
  ],
}, {
  cells: [
    cell('LShift', [ 1.25, 1 ]), cell('NonUsBackslash'), cell('Z'), cell('X'),
    cell('C'), cell('V'), cell('B'), cell('N'), cell('M'), cell('Comma'),
    cell('Period'), cell('Slash'), cell('RShift', [ 2.75, 1 ], 1.5),
    cell('Up', [ 1, 1 ], 1.5), cell('Numpad1'), cell('Numpad2'),
    cell('Numpad3'), cell('NumpadEnter', [ 1, 2 ]),
  ],
}, {
  margin: 0.5,
  cells: [
    cell('LControl', [ 1.5, 1 ]), cell('LSystem', [ 1.25, 1 ]),
    cell('LAlt', [ 1.5, 1 ]), cell('Space', [ 5.75, 1 ]),
    cell('RAlt', [ 1.25, 1 ]), cell('RSystem', [ 1.25, 1 ]),
    cell('Menu', [ 1.25, 1 ]), cell('RControl', [ 1.25, 1 ], 0.5),
    cell('Left'), cell('Down'), cell('Right', [ 1, 1 ], 0.5),
    cell('Numpad0', [ 2, 1 ]), cell('NumpadDecimal'),
  ],
}, {
  cells: [
    cell('F13'), cell('F14'), cell('F15'), cell('F16'), cell('F17'),
    cell('F18'), cell('F19'), cell('F20'), cell('F21'), cell('F22'),
    cell('F23'), cell('F24'),
  ],
}, {
  cells: [
    cell('Application'), cell('Execute'), cell('ModeChange'), cell('Help'),
    cell('Select'), cell('Redo'), cell('Undo'), cell('Cut'), cell('Copy'),
    cell('Paste'), cell('VolumeMute'), cell('VolumeUp'), cell('VolumeDown'),
    cell('MediaPlayPause'), cell('MediaStop'), cell('MediaNextTrack'),
    cell('MediaPreviousTrack'),
  ],
}, {
  cells: [
    cell('Back'), cell('Forward'), cell('Refresh'), cell('Stop'),
    cell('Search'), cell('Favorites'), cell('HomePage'),
    cell('LaunchApplication1'), cell('LaunchApplication2'),
    cell('LaunchMail'), cell('LaunchMediaSelect'),
  ],
}];

/** Display event animations and the real-time physical keyboard state. */
class KeyboardView extends sf.Drawable {
  constructor(font) {
    super();
    this.pose = new sf.Transformable();
    this.triangles = new sf.VertexArray(
      sf.PrimitiveType.Triangles, sf.Keyboard.ScancodeCount * 6
    );
    this.labels = [];
    this.moveFactors = new Float32Array(sf.Keyboard.ScancodeCount);

    const seen = new Set();
    this.forEachKey((code, rect) => {
      assert.ok(!seen.has(code));
      seen.add(code);

      const localized = sf.Keyboard.localize(code);
      const color = sf.Keyboard.delocalize(localized) !== code
        ? sf.Color.Red : sf.Color.White;
      for (let i = 0; i < 6; ++i) {
        this.triangles.getVertex(code * 6 + i).color = color;
      }

      const label = new sf.Text({
        font, string: sf.Keyboard.getDescription(code), characterSize: 14,
      });
      label.setPosition(rect.getCenter());

      if (rect.size.x < label.getLocalBounds().size.x + padding * 2 + 2) {
        label.setString(label.getString().replaceAll(' ', '\n'));
      }

      while (rect.size.x < label.getLocalBounds().size.x + padding * 2 + 2) {
        label.setCharacterSize(label.getCharacterSize() - 2);
      }

      const bounds = label.getLocalBounds();
      label.setOrigin(new sf.Vector2f(
        Math.round(bounds.position.x + bounds.size.x / 2),
        Math.round(label.getCharacterSize() / 2)
      ));
      this.labels[code] = label;
    });

    assert.equal(seen.size, sf.Keyboard.ScancodeCount);
  }

  /**
   * Visit each scancode and its rectangle in local coordinates.
   * @param {Function} callback - Receives the scancode and rectangle.
   */
  forEachKey(callback) {
    let y = 0;
    for (const row of matrix) {
      let x = 0;
      for (const { code, size, margin } of row.cells) {
        callback(code, new sf.FloatRect(
          new sf.Vector2f(x, y),
          new sf.Vector2f(size[0] * keySize, size[1] * keySize)
        ));
        x += (size[0] + margin) * keySize;
      }

      y += keySize * (1 + (row.margin || 0));
    }
  }

  /**
   * Start the press or release animation.
   * @param {object} event - Window event.
   */
  handle(event) {
    const pressed = event.getIf('KeyPressed');
    const released = event.getIf('KeyReleased');
    const key = pressed || released;
    if (key && key.scancode !== sf.Keyboard.Scan.Unknown) {
      this.moveFactors[key.scancode] = pressed ? 1 : -1;
    }
  }

  /**
   * Animate keys over the original 200 ms transition.
   * @param {object} frameTime - Time since the previous frame.
   */
  update(frameTime) {
    for (let i = 0; i < this.moveFactors.length; ++i) {
      const factor = this.moveFactors[i];
      const change = Math.min(Math.abs(factor), frameTime.asSeconds() / 0.2);
      this.moveFactors[i] += factor > 0 ? -change : change;
    }

    const square = [[ 0, 0 ], [ 1, 0 ], [ 1, 1 ], [ 0, 1 ]];
    const corners = [ 0, 1, 3, 3, 1, 2 ];
    this.forEachKey((code, rect) => {
      const factor = this.moveFactors[code];
      const move = 2 * factor * (1 - Math.abs(factor)) * padding;
      const pressed = sf.Keyboard.isKeyPressed(code, 'scancode');
      for (let i = 0; i < 6; ++i) {
        const vertex = this.triangles.getVertex(code * 6 + i);
        const corner = square[corners[i]];
        vertex.position.x = rect.position.x + padding +
          (rect.size.x - 2 * padding) * corner[0];
        vertex.position.y = rect.position.y + padding +
          (rect.size.y - 2 * padding) * corner[1] + move;
        vertex.color.a = pressed ? 96 : 48;
      }

      this.labels[code].setPosition(new sf.Vector2f(
        rect.position.x + rect.size.x / 2,
        rect.position.y + rect.size.y / 2 + move
      ));
    });
  }

  /**
   * Draw key triangles and labels using the same transform.
   * @param {object} target - Render target.
   * @param {object} states - Incoming drawing state.
   */
  draw(target, states) {
    states.transform.combine(this.pose.getTransform());
    target.draw(this.triangles, states);
    for (const label of this.labels) {
      target.draw(label, states);
    }
  }
}

/** Text with a fading outline after each input event. */
class ShinyText extends sf.Text {
  constructor(options) {
    super(options);
    this.remaining = 0;
  }

  /**
   * Restart the outline animation.
   * @param {object} color - Outline color.
   */
  shine(color = sf.Color.Yellow) {
    this.setOutlineColor(color);
    this.remaining = 0.15;
  }

  /**
   * Fade the outline over 150 ms.
   * @param {object} frameTime - Frame duration.
   */
  update(frameTime) {
    const ratio = this.remaining / 0.15;
    const color = this.getOutlineColor();
    color.a = Math.trunc(255 * Math.max(0, ratio * (2 - ratio)) * 0.5);
    this.setOutlineColor(color);

    if (this.remaining > 0) {
      this.remaining -= frameTime.asSeconds();
    }
  }
}

/**
 * Check mismatches between physical keys, localized codes and descriptions.
 * @param {object} event - Key event payload.
 */
function somethingIsOdd(event) {
  return event.code === sf.Keyboard.Key.Unknown ||
    event.scancode === sf.Keyboard.Scan.Unknown ||
    sf.Keyboard.getDescription(event.scancode) === '' ||
    sf.Keyboard.localize(event.scancode) !== event.code ||
    sf.Keyboard.delocalize(event.code) !== event.scancode;
}

/**
 * Format the original C++ enum identifiers for a key event.
 * @param {string} title - Event title.
 * @param {object} event - Key event payload.
 */
function keyEventDescription(title, event) {
  const key = code => 'Key::' + sf.Keyboard.Key[code];
  const scan = code => 'Scan::' + sf.Keyboard.Scan[code];
  let text = `${title}\n\n${key(event.code)}\n${scan(event.scancode)}`;

  if (somethingIsOdd(event)) {
    text += '\nLocalized:\t' + key(sf.Keyboard.localize(event.scancode));
    text += '\nDelocalized:\t' + scan(sf.Keyboard.delocalize(event.code));
  }

  return text;
}

/** Load resources and run the keyboard visualization. */
async function main() {
  const window = new sf.RenderWindow(
    new sf.VideoMode(new sf.Vector2u(1280, 720)), 'Keyboard',
    { style: sf.Style.Titlebar + sf.Style.Close }
  );
  window.setFramerateLimit(25);

  const sounds = [];
  for (const name of [
    'error_005.ogg', 'mouseclick1.ogg', 'mouserelease1.ogg',
  ]) {
    const buffer = new sf.SoundBuffer();
    if (!await buffer.loadFromFile(path.join(__dirname, 'resources', name))) {
      throw new Error(`Failed to load ${name}`);
    }

    sounds.push(new sf.Sound(buffer));
  }
  const [ errorSound, pressedSound, releasedSound ] = sounds;

  const font = new sf.Font();
  if (!await font.openFromFile(path.join(__dirname, 'resources/Tuffy.ttf'))) {
    throw new Error('Failed to load Tuffy.ttf');
  }

  const keyboard = new KeyboardView(font);
  keyboard.pose.setPosition(new sf.Vector2f(16, 16));

  const texts = [ 'Key Pressed', 'Key Released', 'Text Entered', '' ]
    .map((string, index) => {
      const Type = index < 3 ? ShinyText : sf.Text;
      const text = new Type({ font, string, characterSize: 18 });
      text.setLineSpacing(20 / font.getLineSpacing(18));
      text.setPosition(new sf.Vector2f([ 16, 300, 600, 900 ][index], 575));
      if (index < 3) {
        text.setOutlineThickness(2);
      }

      return text;
    });

  const clock = new sf.Clock();

  /** Poll input, update animation and yield to Node between frames. */
  function frame() {
    for (let event; (event = window.pollEvent());) {
      if (event.is('Closed')) {
        window.close();
        break;
      }

      const resized = event.getIf('Resized');
      if (resized) {
        window.setView(new sf.View(new sf.FloatRect(
          new sf.Vector2f(), new sf.Vector2f(resized.size)
        )));
      }

      for (const [ index, kind, sound ] of [
        [ 0, 'KeyPressed', pressedSound ], [ 1, 'KeyReleased', releasedSound ],
      ]) {
        const key = event.getIf(kind);
        if (key) {
          texts[index].setString(keyEventDescription(
            index === 0 ? 'Key Pressed' : 'Key Released', key
          ));

          const odd = somethingIsOdd(key);
          texts[index].shine(odd ? sf.Color.Red : sf.Color.Green);
          (odd ? errorSound : sound).play();
        }
      }

      const entered = event.getIf('TextEntered');
      if (entered) {
        const hex = entered.unicode.toString(16).padStart(4, '0');
        texts[2].setString(
          `Text Entered\n\n${String.fromCodePoint(entered.unicode)}\nU+${hex}`
        );
        texts[2].shine();
      }

      keyboard.handle(event);
    }

    if (!window.isOpen()) {
      return;
    }

    const elapsed = clock.restart();
    keyboard.update(elapsed);
    for (const text of texts.slice(0, 3)) {
      text.update(elapsed);
    }

    let pressed = 'isKeyPressed(sf::Keyboard::Key)\n\n';
    for (let i = 0; i < sf.Keyboard.KeyCount; ++i) {
      if (sf.Keyboard.isKeyPressed(i)) {
        pressed += 'Key::' + sf.Keyboard.Key[i] + '\n';
      }
    }
    texts[3].setString(pressed);

    window.clear();
    window.draw(keyboard);
    for (const text of texts) {
      window.draw(text);
    }
    window.display();

    if (window.isOpen()) {
      setImmediate(frame);
    }
  }

  frame();
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
