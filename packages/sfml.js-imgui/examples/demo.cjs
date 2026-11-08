'use strict';

const sfml = require('sfml.js');
const imgui = require('../dist');
const { ImGui, SFML } = imgui;

const window = new sfml.RenderWindow(
  new sfml.VideoMode(new sfml.Vector2u(1280, 720)), 'sfml.js-imgui');
window.setFramerateLimit(60);

console.log(`ImGui ${SFML.Version}`);
const clock = new sfml.Clock();
let frames = 0;
let running = true;

try {
  if (!SFML.Init(window)) {
    throw new Error('ImGui initialization failed');
  }
  while (running && window.isOpen()) {
    let event;
    while ((event = window.pollEvent()) !== undefined) {
      SFML.ProcessEvent(window, event);
      if (event.is('Closed')) {
        running = false;
      }
    }
    if (!running) {
      break;
    }

    SFML.Update(window, clock.restart().asSeconds());
    ImGui.ShowDemoWindow();
    ImGui.SetNextWindowSize([ 260, 120 ], ImGui.ImGuiCond.Once);
    if (ImGui.Begin('sfml.js-imgui')) {
      ImGui.TextUnformatted(`frame ${frames++}`);
      if (ImGui.Button('Reset')) {
        frames = 0;
      }
    }
    ImGui.End();

    window.clear(sfml.Color.Black);
    SFML.Render(window);
    window.display();
  }
} finally {
  SFML.Shutdown(window);
  window.close();
}
