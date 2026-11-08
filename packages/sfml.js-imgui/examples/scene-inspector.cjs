'use strict';

const sf = require('sfml.js');
const { ImGui, SFML } = require('../dist');

const window = new sf.RenderWindow(
  new sf.VideoMode(new sf.Vector2u(1100, 640)), 'ImGui scene inspector');
window.setFramerateLimit(60);
window.setKeyRepeatEnabled(false);

// ImGui writes directly into these arrays. Keep them alive across frames.
const animated = new Uint8Array([ 1 ]);
const radius = new Float32Array([ 64 ]);
const speed = new Float32Array([ 1 ]);
const color = new Float32Array([ 0.25, 0.75, 0.95 ]);
const circle = new sf.CircleShape({ radius: radius[0], pointCount: 64 });
const position = new sf.Vector2f();
const background = new sf.Color(24, 28, 38);
const clock = new sf.Clock();
let phase = 0;
let running = true;

/** Copy the editable geometry and RGB values into the SFML shape. */
function applyAppearance() {
  circle.setRadius(radius[0]);
  circle.setOrigin(new sf.Vector2f(radius[0], radius[0]));
  circle.setFillColor(new sf.Color(
    Math.round(color[0] * 255),
    Math.round(color[1] * 255),
    Math.round(color[2] * 255)));
}

/** Restore values in place so every widget keeps the same backing array. */
function resetScene() {
  animated[0] = 1;
  radius[0] = 64;
  speed[0] = 1;
  color.set([ 0.25, 0.75, 0.95 ]);
  phase = 0;
  applyAppearance();
}

/**
 * Build the panel once per frame, balancing Begin and End when collapsed.
 * @param {number} seconds Elapsed time since the previous frame.
 */
function drawControls(seconds) {
  ImGui.SetNextWindowPos([ 24, 24 ], ImGui.ImGuiCond.FirstUseEver);
  ImGui.SetNextWindowSize([ 370, 360 ], ImGui.ImGuiCond.FirstUseEver);
  if (ImGui.Begin('Scene inspector')) {
    ImGui.TextUnformatted('Edit the SFML circle in real time.');
    ImGui.Separator();
    ImGui.Checkbox('Animate', animated);
    ImGui.SliderFloatEx('Speed', speed, 0, 3, '%.2f',
      ImGui.ImGuiSliderFlags.AlwaysClamp);
    const resized = ImGui.SliderFloatEx('Radius', radius, 16, 100, '%.0f',
      ImGui.ImGuiSliderFlags.AlwaysClamp);
    const recolored = ImGui.ColorEdit3('Color', color);
    if (resized || recolored) {
      applyAppearance();
    }
    if (ImGui.Button('Reset scene')) {
      resetScene();
    }
    ImGui.Separator();
    ImGui.TextUnformatted(`Frame time: ${(seconds * 1000).toFixed(2)} ms`);
    ImGui.TextUnformatted(animated[0] ? 'Animation: running'
      : 'Animation: paused');
    ImGui.TextUnformatted('Click the scene, then Space to pause.');
    ImGui.TextUnformatted('Keyboard input stays with active widgets.');
  }
  ImGui.End();
}

try {
  if (!SFML.Init(window)) {
    throw new Error('ImGui initialization failed');
  }
  applyAppearance();

  while (running && window.isOpen()) {
    let event;
    while ((event = window.pollEvent()) !== undefined) {
      // Forward every event, including close events, before app shortcuts.
      SFML.ProcessEvent(window, event);
      if (event.is('Closed')) {
        running = false;
      }
      const key = event.getIf('KeyPressed');
      if (key?.code === sf.Keyboard.Key.Space &&
          !SFML.GetIO().wantCaptureKeyboard) {
        animated[0] = animated[0] ? 0 : 1;
      }
    }
    if (!running) {
      break;
    }

    const seconds = clock.restart().asSeconds();
    SFML.Update(window, seconds);
    drawControls(seconds);
    if (animated[0]) {
      phase = (phase + seconds * speed[0]) % (Math.PI * 2);
    }
    position.x = 760 + Math.cos(phase) * 170;
    position.y = 320 + Math.sin(phase) * 180;
    circle.setPosition(position);

    window.clear(background);
    window.draw(circle);
    SFML.Render(window);
    window.display();
  }
} finally {
  // ImGui must release its GPU resources while the SFML window still exists.
  SFML.Shutdown(window);
  window.close();
}
