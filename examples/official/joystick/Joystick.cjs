'use strict';

// Port of SFML/examples/joystick/Joystick.cpp; see ../README.md.
const path = require('node:path');
const sf = require('../../..');

const axisLabels = [ 'X', 'Y', 'Z', 'R', 'U', 'V', 'PovX', 'PovY' ];
const displaySize = new sf.Vector2f(800, 400);

/**
 * Center an object on the same local bounds used by the upstream layout.
 * @param {object} object - Object with local bounds and an origin.
 * @param {boolean} includePosition - Include the bounds offset.
 */
function center(object, includePosition = true) {
  const b = object.getLocalBounds();
  object.setOrigin(
    new sf.Vector2f(
      b.size.x / 2 + (includePosition ? b.position.x : 0),
      b.size.y / 2 + (includePosition ? b.position.y : 0)
    )
  );
}

/** Display one joystick axis as a vertical bar. */
class AxisDisplay extends sf.Drawable {
  constructor(font, axis) {
    super();

    this.axis = axis;
    this.transform = new sf.Transformable();

    this.bounds = new sf.RectangleShape(new sf.Vector2f(20, 50));
    this.indicator = new sf.RectangleShape(new sf.Vector2f(20, 1));
    this.bounds.setFillColor(sf.Color.Transparent);
    this.bounds.setOutlineColor(sf.Color.White);
    this.bounds.setOutlineThickness(1);
    this.bounds.setOrigin(
      new sf.Vector2f(this.bounds.getLocalBounds().size.x / 2, 0)
    );

    this.indicator.setFillColor(sf.Color.Red);
    this.indicator.setOrigin(new sf.Vector2f(10, 0));

    this.label = new sf.Text({
      font,
      string: axisLabels[axis],
      characterSize: 20,
    });
    this.label.setPosition(new sf.Vector2f(0, 25));
    center(this.label, false);
  }

  setValue(value) {
    this.indicator.setScale(
      new sf.Vector2f(
        1,
        ((100 + value) * this.bounds.getLocalBounds().size.y) / 200
      )
    );
  }

  draw(target, states) {
    states.transform.combine(this.transform.getTransform());
    target.draw(this.bounds, states);
    target.draw(this.indicator, states);
    target.draw(this.label, states);
  }
}

/** Display a pair of axes and optional stick button. */
class JoystickDisplay extends sf.Drawable {
  constructor(font, xAxis, yAxis, button) {
    super();

    Object.assign(this, {
      xAxis,
      yAxis,
      button,
      xValue: 0,
      yValue: 0,
    });
    this.transform = new sf.Transformable();

    this.bounds = new sf.CircleShape({ radius: 50 });
    this.indicator = new sf.CircleShape({ radius: 5 });
    center(this.bounds, false);
    this.bounds.setFillColor(sf.Color.Transparent);
    this.bounds.setOutlineColor(sf.Color.White);
    this.bounds.setOutlineThickness(1);

    this.indicator.setFillColor(sf.Color.Red);
    center(this.indicator, false);

    this.label = new sf.Text({
      font,
      characterSize: 20,
      string: axisLabels[xAxis] + '/' + axisLabels[yAxis],
    });
    center(this.label);
  }

  setX(x) {
    this.xValue = x;
    this.updatePos();
  }

  setY(y) {
    this.yValue = y;
    this.updatePos();
  }

  updatePos() {
    const radius = this.bounds.getRadius();

    this.indicator.setPosition(
      new sf.Vector2f(
        (this.xValue * radius) / 100,
        (this.yValue * radius) / 100
      )
    );
  }

  pressed(pressed) {
    this.bounds.setFillColor(
      pressed ? sf.Color.Red : sf.Color.Transparent
    );
  }

  draw(target, states) {
    states.transform.combine(this.transform.getTransform());
    target.draw(this.bounds, states);
    target.draw(this.indicator, states);
    target.draw(this.label, states);
  }
}

/** Display a single controller button. */
class ButtonDisplay extends sf.Drawable {
  constructor(font, button) {
    super();

    this.button = button;
    this.transform = new sf.Transformable();
    this.indicator = new sf.CircleShape({ radius: 10 });
    this.label = new sf.Text({
      font,
      string: String(button),
      characterSize: Math.trunc(
        this.indicator.getLocalBounds().size.y
      ),
    });
    center(this.label);
    center(this.indicator, false);
    this.indicator.setFillColor(sf.Color.Transparent);
    this.indicator.setOutlineColor(sf.Color.White);
    this.indicator.setOutlineThickness(1);
  }

  pressed(pressed) {
    this.indicator.setFillColor(
      pressed ? sf.Color.Red : sf.Color.Transparent
    );
  }

  draw(target, states) {
    states.transform.combine(this.transform.getTransform());
    target.draw(this.indicator, states);
    target.draw(this.label, states);
  }
}

/** Retain the original typical gamepad arrangement. */
class GamepadDisplay extends sf.Drawable {
  constructor(font, id) {
    super();
    this.id = id;
    this.transform = new sf.Transformable();
    this.label = new sf.Text({
      font,
      characterSize: 20,
      string: id + ': ' + sf.Joystick.getIdentification(id).name,
    });

    const a = sf.Joystick.Axis;
    this.joysticks = [
      new JoystickDisplay(font, a.X, a.Y, 10),
      new JoystickDisplay(font, a.Z, a.R, 11),
      new JoystickDisplay(font, a.PovX, a.PovY),
    ];
    for (const [ i, x, y ] of [
      [ 0, 300, 350 ],
      [ 1, 500, 350 ],
      [ 2, 150, 150 ],
    ]) {
      this.joysticks[i].transform.setPosition(
        new sf.Vector2f(x, y)
      );
    }

    this.triggers = [
      new AxisDisplay(font, a.V),
      new AxisDisplay(font, a.U),
    ];
    this.triggers[0].transform.setPosition(
      new sf.Vector2f(500, 80)
    );
    this.triggers[1].transform.setPosition(
      new sf.Vector2f(300, 80)
    );
    this.buttons = [];
    for (const [ number, x, y ] of [
      [ 3, 650, 130 ],
      [ 1, 650, 170 ],
      [ 2, 670, 150 ],
      [ 0, 630, 150 ],
      [ 7, 500, 50 ],
      [ 6, 300, 50 ],
      [ 5, 500, 160 ],
      [ 4, 300, 160 ],
      [ 8, 380, 200 ],
      [ 9, 420, 200 ],
      [ 12, 400, 230 ],
    ]) {
      const button = new ButtonDisplay(font, number);
      button.transform.setPosition(new sf.Vector2f(x, y));
      this.buttons.push(button);
    }
  }

  handleEvent(event) {
    const data = event.data;
    if (data.joystickId !== this.id) {
      return;
    }

    if (
      event.is('JoystickButtonPressed') ||
      event.is('JoystickButtonReleased')
    ) {
      for (const item of [ ...this.buttons, ...this.joysticks ]) {
        if (item.button === data.button) {
          item.pressed(event.is('JoystickButtonPressed'));

          return;
        }
      }
    } else if (event.is('JoystickMoved')) {
      for (const joystick of this.joysticks) {
        if (joystick.xAxis === data.axis) {
          joystick.setX(data.position);

          return;
        }

        if (joystick.yAxis === data.axis) {
          joystick.setY(data.position);

          return;
        }
      }

      for (const trigger of this.triggers) {
        if (trigger.axis === data.axis) {
          trigger.setValue(data.position);

          return;
        }
      }
    }
  }

  draw(target, states) {
    states.transform.combine(this.transform.getTransform());
    for (const item of [
      ...this.joysticks,
      ...this.triggers,
      ...this.buttons,
    ]) {
      target.draw(item, states);
    }

    target.draw(this.label, states);
  }
}

/** Display all eight axes and 32 buttons. */
class GenericDisplay extends sf.Drawable {
  constructor(font, id) {
    super();
    this.id = id;
    this.transform = new sf.Transformable();
    this.label = new sf.Text({
      font,
      characterSize: 20,
      string: id + ': ' + sf.Joystick.getIdentification(id).name,
    });
    this.axisDisplays = [];

    const axisSpacing = displaySize.x / (sf.Joystick.AxisCount + 1);
    for (let i = 0; i < sf.Joystick.AxisCount; ++i) {
      const display = new AxisDisplay(font, i);
      display.transform.setPosition(
        new sf.Vector2f(
          axisSpacing + i * axisSpacing,
          displaySize.y * 0.25
        )
      );
      this.axisDisplays.push(display);
    }

    this.buttonDisplays = [];

    const buttonSpacing =
      displaySize.x / (sf.Joystick.ButtonCount / 2 + 1);
    for (let i = 0; i < sf.Joystick.ButtonCount; ++i) {
      const display = new ButtonDisplay(font, i);
      display.transform.setPosition(
        new sf.Vector2f(
          buttonSpacing +
            ((i % sf.Joystick.ButtonCount) / 2) * buttonSpacing,
          displaySize.y * 0.75 + (i % 2) * 50
        )
      );
      this.buttonDisplays.push(display);
    }
  }

  handleEvent(event) {
    const data = event.data;
    if (data.joystickId !== this.id) {
      return;
    }

    if (
      event.is('JoystickButtonPressed') ||
      event.is('JoystickButtonReleased')
    ) {
      this.buttonDisplays[data.button]?.pressed(
        event.is('JoystickButtonPressed')
      );
    } else if (event.is('JoystickMoved')) {
      this.axisDisplays[data.axis]?.setValue(data.position);
    }
  }

  draw(target, states) {
    states.transform.combine(this.transform.getTransform());
    target.draw(this.label, states);
    for (const item of [
      ...this.axisDisplays,
      ...this.buttonDisplays,
    ]) {
      target.draw(item, states);
    }
  }
}

/** Select controllers with 0–7 and switch layouts with Tab. */
async function main() {
  const window = new sf.RenderWindow(
    new sf.VideoMode(new sf.Vector2u(800, 600)),
    'Joystick'
  );
  window.setVerticalSyncEnabled(true);

  const font = new sf.Font();
  if (
    !(await font.openFromFile(
      path.join(__dirname, 'resources/tuffy.ttf')
    ))
  ) {
    throw new Error('font');
  }

  let joystickIndex = 0;
  const indexIndicators = [];
  const spacer = displaySize.x / (sf.Joystick.Count + 1);
  for (let i = 0; i < sf.Joystick.Count; ++i) {
    const indicator = new sf.Text({ font, string: String(i) });
    indicator.setPosition(new sf.Vector2f(spacer + i * spacer, 60));
    center(indicator);
    indexIndicators.push(indicator);
  }

  const bounds = indexIndicators[0].getGlobalBounds();
  const selectedIndicator = new sf.RectangleShape(
    new sf.Vector2f(bounds.size.x * 2, bounds.size.y * 2)
  );
  selectedIndicator.setOutlineThickness(3);
  selectedIndicator.setFillColor(sf.Color.Transparent);
  center(selectedIndicator);

  const instructions = new sf.Text({
    font,
    characterSize: 20,
    string:
      'Press 0-7 to select joystick, tab to switch between ' +
      'gamepad/generic displays',
  });
  instructions.setPosition(new sf.Vector2f(displaySize.x / 2, 10));
  center(instructions);

  const notConnected = new sf.Text({
    font,
    string: 'Joystick not connected',
  });
  notConnected.setPosition(
    new sf.Vector2f(displaySize.x / 2, displaySize.y / 2)
  );
  center(notConnected);

  let showingGamepad = true;
  let gamepadDisplay;
  let genericDisplay;

  /** Rebuild the original displays when selection or connection changes. */
  function updateDisplay() {
    gamepadDisplay = new GamepadDisplay(font, joystickIndex);
    genericDisplay = new GenericDisplay(font, joystickIndex);
    gamepadDisplay.transform.setPosition(new sf.Vector2f(0, 150));
    genericDisplay.transform.setPosition(new sf.Vector2f(0, 150));
    for (let i = 0; i < indexIndicators.length; ++i) {
      indexIndicators[i].setFillColor(
        sf.Joystick.isConnected(i) ? sf.Color.Green : sf.Color.Red
      );
    }

    selectedIndicator.setPosition(
      indexIndicators[joystickIndex].getPosition()
    );
  }
  updateDisplay();

  /** Update the current controller display from joystick events. */
  function frame() {
    for (let event; (event = window.pollEvent());) {
      const key = event.getIf('KeyPressed');
      if (
        event.is('Closed') ||
        key?.code === sf.Keyboard.Key.Escape
      ) {
        window.close();

        return;
      }

      const resized = event.getIf('Resized');
      if (resized) {
        window.setView(
          new sf.View(
            new sf.FloatRect(
              new sf.Vector2f(),
              new sf.Vector2f(resized.size.x, resized.size.y)
            )
          )
        );
      } else if (
        event.is('JoystickConnected') ||
        event.is('JoystickDisconnected')
      ) {
        updateDisplay();
      } else if (key) {
        if (
          key.code >= sf.Keyboard.Key.Num0 &&
          key.code <= sf.Keyboard.Key.Num7
        ) {
          joystickIndex = key.code - sf.Keyboard.Key.Num0;
          updateDisplay();
        } else if (key.code === sf.Keyboard.Key.Tab) {
          showingGamepad = !showingGamepad;
        }
      } else if (
        event.is('JoystickButtonPressed') ||
        event.is('JoystickButtonReleased') ||
        event.is('JoystickMoved')
      ) {
        gamepadDisplay.handleEvent(event);

        genericDisplay.handleEvent(event);
      }
    }

    window.clear();
    window.draw(instructions);
    window.draw(selectedIndicator);
    for (const indicator of indexIndicators) {
      window.draw(indicator);
    }

    window.draw(
      !sf.Joystick.isConnected(joystickIndex)
        ? notConnected
        : showingGamepad
          ? gamepadDisplay
          : genericDisplay
    );

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
