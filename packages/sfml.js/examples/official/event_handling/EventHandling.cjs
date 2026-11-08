'use strict';

// Port of SFML/examples/event_handling/EventHandling.cpp; see ../README.md.
const path = require('node:path');
const sf = require('../../..');

/** Compare the five original forms of event dispatch. */
class Application {
  constructor(font) {
    this.window = new sf.RenderWindow(
      new sf.VideoMode(new sf.Vector2u(800, 600)),
      'SFML Event Handling',
      { style: sf.Style.Titlebar + sf.Style.Close }
    );
    this.window.setVerticalSyncEnabled(true);

    this.logText = new sf.Text({ font, string: '', characterSize: 20 });
    this.handlerText = new sf.Text({
      font,
      characterSize: 24,
      string: 'Current Handler: Classic',
    });
    this.instructions = new sf.Text({
      font,
      characterSize: 24,
      string: 'Press Enter to change handler type',
    });

    this.log = [];
    this.handlerType = 0;
    this.activeHandlerType = 0;
    this.handlerNames = [
      'Classic', 'Visitor', 'Overload', 'Generic', 'Forward',
    ];

    for (const text of [
      this.logText, this.handlerText, this.instructions,
    ]) {
      text.setFillColor(sf.Color.White);
    }

    this.handlerText.setStyle(sf.TextStyle.Bold);
    this.handlerText.setPosition(new sf.Vector2f(380, 260));
    this.instructions.setStyle(sf.TextStyle.Bold);
    this.instructions.setPosition(new sf.Vector2f(380, 310));
  }

  /**
   * Advance to the next handler on Enter, retaining upstream ordering.
   * @param {object} event - Event payload.
   */
  nextHandler(event) {
    if (event.code === sf.Keyboard.Key.Enter) {
      this.handlerType = (this.activeHandlerType + 1) % 5;
      this.handlerText.setString(
        'Current Handler: ' + this.handlerNames[this.handlerType]
      );
    }
  }

  /**
   * Return the original log message; unhandled events are ignored.
   * @param {object} event - Event payload.
   */
  message(event) {
    const vector = value => `(${value.x}, ${value.y})`;

    switch (event.kind) {
      case 'Closed':
        this.window.close();
        return undefined;
      case 'KeyPressed':
        this.nextHandler(event);
        return 'Key Pressed: ' + sf.Keyboard.getDescription(event.scancode);
      case 'KeyReleased':
        return 'Key Released: ' + sf.Keyboard.getDescription(event.scancode);
      case 'MouseMoved':
        return 'Mouse Moved: ' + vector(event.position);
      case 'MouseButtonPressed':
        return 'Mouse Pressed';
      case 'TouchBegan':
        return 'Touch Began: ' + vector(event.position);
      case 'TouchEnded':
        return 'Touch Ended: ' + vector(event.position);
      case 'TouchMoved':
        return 'Touch Moved: ' + vector(event.position);
      case 'Resized':
        return 'Resized: ' + vector(event.size);
      case 'FocusLost':
        return 'Focus Lost';
      case 'FocusGained':
        return 'Focus Gained';
      default:
        return undefined;
    }
  }

  /**
   * Forward concrete event data to the application member handler.
   * @param {object} event - Event payload.
   */
  handle(event) {
    const message = this.message(event);
    if (message !== undefined) {
      this.log.push(message);
    }
  }

  /** Render after polling through the currently selected dispatch form. */
  frame() {
    this.activeHandlerType = this.handlerType;
    if (this.handlerType === 0) {
      for (let event; (event = this.window.pollEvent());) {
        // Classical dispatch uses is/getIf before selecting event data.
        for (const kind of [
          'Closed', 'KeyPressed', 'KeyReleased', 'MouseMoved',
          'MouseButtonPressed', 'TouchBegan', 'TouchEnded', 'TouchMoved',
          'Resized', 'FocusLost', 'FocusGained',
        ]) {
          if (event.is(kind)) {
            this.handle(event.getIf(kind));
            break;
          }
        }
      }
    } else if (this.handlerType === 1) {
      for (let event; (event = this.window.pollEvent());) {
        const message = event.visit(data => this.message(data));
        if (message !== undefined) {
          this.log.push(message);
        }
      }
    } else if (this.handlerType === 2) {
      const handlers = {};
      for (const kind of [
        'Closed', 'KeyPressed', 'KeyReleased', 'MouseMoved',
        'MouseButtonPressed', 'TouchBegan', 'TouchEnded', 'TouchMoved',
        'Resized', 'FocusLost', 'FocusGained',
      ]) {
        handlers[kind] = event => this.handle(event);
      }

      this.window.handleEvents(handlers);
    } else if (this.handlerType === 3) {
      this.window.handleEvents(event => {
        const message = this.message(event);
        if (message !== undefined) {
          this.log.push(message);
        }
      });
    } else {
      this.window.handleEvents(event => this.handle(event));
    }

    if (!this.window.isOpen()) {
      return;
    }
    if (this.log.length > 24) {
      this.log.splice(0, this.log.length - 24);
    }

    this.window.clear();
    for (let i = 0; i < this.log.length; ++i) {
      this.logText.setPosition(new sf.Vector2f(50, i * 20 + 50));
      this.logText.setString(this.log[i]);
      this.window.draw(this.logText);
    }

    this.window.draw(this.handlerText);
    this.window.draw(this.instructions);
    this.window.display();

    if (this.window.isOpen()) {
      setImmediate(() => this.frame());
    }
  }
}

/** Load the font before creating the application. */
async function main() {
  const font = new sf.Font();
  const fontPath = path.join(__dirname, 'resources/tuffy.ttf');
  if (!await font.openFromFile(fontPath)) {
    throw new Error('font');
  }

  new Application(font).frame();
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
