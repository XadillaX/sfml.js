'use strict';

const sf = require('sfml.js');
const {
  ImGui, SFML, getFontAtlas, getGlyphRangesDefault,
} = require('../dist');

const window = new sf.RenderWindow(
  new sf.VideoMode(new sf.Vector2u(960, 700)),
  'ImGui workbench');
window.setFramerateLimit(60);

// Persistent state belongs to the application, outside the frame loop.
const name = new Uint8Array(128);
const rows = [
  { id: 'player', label: 'Player', enabled: new Uint8Array([ 1 ]) },
  { id: 'light', label: 'Light', enabled: new Uint8Array([ 1 ]) },
  { id: 'camera', label: 'Camera', enabled: new Uint8Array([ 0 ]) },
];
const selected = new Int32Array([ 0 ]);
const samples = new Float32Array(90);
const clock = new sf.Clock();
let callbackBytes = 0;
let cursor = 0;
let running = true;
let font = null;
let ranges = null;

/**
 * Replace UTF-8 text without truncating a code point or its terminator.
 * @param {Uint8Array} target Fixed-capacity, zero-terminated buffer.
 * @param {string} value Application text.
 */
function writeText(target, value) {
  const bytes = Buffer.from(value, 'utf8');
  if (value.includes('\0') || bytes.length >= target.length) {
    throw new RangeError('Text needs room for one trailing zero byte');
  }
  target.fill(0);
  target.set(bytes);
}

/**
 * Decode only the occupied bytes, excluding the terminating zero.
 * @param {Uint8Array} source Zero-terminated UTF-8 buffer.
 * @return {string} Current text.
 */
function readText(source) {
  const end = source.indexOf(0);
  return Buffer.from(source.subarray(0, end < 0 ? source.length : end))
    .toString('utf8');
}

/** Restore editable values without replacing their backing arrays. */
function reset() {
  writeText(name, 'Scene');
  selected[0] = 0;
  rows.forEach((row, index) => {
    row.enabled[0] = index < 2 ? 1 : 0;
  });
}

/** Build a two-column table with stable IDs for repeated controls. */
function drawRows() {
  // These flag groups have disjoint bits, so their sum combines them.
  const flags =
    ImGui.ImGuiTableFlags.Borders +
    ImGui.ImGuiTableFlags.RowBg +
    ImGui.ImGuiTableFlags.Resizable;
  if (ImGui.BeginTable('objects', 2, flags)) {
    ImGui.TableSetupColumn('Object');
    ImGui.TableSetupColumn('Enabled');
    ImGui.TableHeadersRow();
    for (const row of rows) {
      ImGui.PushID(row.id);
      ImGui.TableNextRow();
      ImGui.TableNextColumn();
      ImGui.TextUnformatted(row.label);
      ImGui.TableNextColumn();
      ImGui.Checkbox('##enabled', row.enabled);
      ImGui.PopID();
    }
    ImGui.EndTable();
  }
}

/** Emit a custom primitive and reserve its area in normal widget layout. */
function drawPreview() {
  const origin = ImGui.GetCursorScreenPos();
  const list = ImGui.GetWindowDrawList();
  if (list) {
    ImGui.ImDrawList_AddCircleFilled(
      list,
      [ origin.x + 48, origin.y + 48 ],
      32,
      ImGui.GetColorU32(ImGui.ImGuiCol.PlotHistogram));
  }
  ImGui.Dummy([ 96, 96 ]);
  ImGui.SameLine();
  ImGui.TextUnformatted(`Selected: ${rows[selected[0]].label}`);
}

/** Declare the menu and popup in the same window ID scope. */
function drawMenu() {
  let requestReset = false;
  if (ImGui.BeginMenuBar()) {
    if (ImGui.BeginMenu('Scene')) {
      requestReset = ImGui.MenuItem('Reset...');
      ImGui.EndMenu();
    }
    ImGui.EndMenuBar();
  }
  // A popup's ID is relative to the current stack, not to its visible title.
  if (requestReset) {
    ImGui.OpenPopup('Reset scene?');
  }
  if (ImGui.BeginPopupModal(
    'Reset scene?',
    null,
    ImGui.ImGuiWindowFlags.AlwaysAutoResize)) {
    ImGui.TextUnformatted('Restore the name, selection and enabled flags?');
    if (ImGui.Button('Reset')) {
      reset();
      ImGui.CloseCurrentPopup();
    }
    ImGui.SameLine();
    if (ImGui.Button('Cancel')) {
      ImGui.CloseCurrentPopup();
    }
    ImGui.EndPopup();
  }
}

/**
 * Read transient callback data synchronously; retain only its scalar value.
 * @param {ImGui.ImGuiInputTextCallbackData} data Borrowed callback handle.
 * @return {number} Zero preserves default input processing.
 */
function inspectInput(data) {
  callbackBytes = ImGui.viewImGuiInputTextCallbackData(data).BufTextLen;
  return 0;
}

/** Build the complete panel between SFML.Update and SFML.Render. */
function drawControls() {
  ImGui.SetNextWindowSize([ 620, 620 ], ImGui.ImGuiCond.FirstUseEver);
  if (ImGui.Begin('Workbench', null, ImGui.ImGuiWindowFlags.MenuBar)) {
    drawMenu();
    ImGui.TextUnformatted('State, text input, tables and custom drawing');
    ImGui.Separator();
    ImGui.InputTextEx(
      'Name',
      name,
      name.length,
      ImGui.ImGuiInputTextFlags.CallbackAlways,
      inspectInput);
    ImGui.TextUnformatted(`Current name: ${readText(name)}`);
    ImGui.TextUnformatted(`Last active callback: ${callbackBytes} bytes`);
    ImGui.ListBoxCallbackEx(
      'Selection',
      selected,
      rows.length,
      index => rows[index].label);
    drawRows();
    ImGui.PlotLinesCallbackEx(
      'Frame ms',
      samples.length,
      index => samples[index],
      null,
      cursor,
      null,
      0,
      40,
      [ 0, 70 ]);
    drawPreview();
  }
  ImGui.End();
}

try {
  if (!SFML.Init(window)) {
    throw new Error('ImGui initialization failed');
  }
  // Optional Latin font preview: node workbench.cjs /absolute/font.ttf
  if (process.argv[2]) {
    const atlas = getFontAtlas(ImGui.GetIO());
    if (!atlas) {
      throw new Error('Missing font atlas');
    }
    const pairs = getGlyphRangesDefault(atlas);
    ranges = new Uint16Array(pairs.length + 1);
    ranges.set(pairs);
    font = ImGui.ImFontAtlas_AddFontFromFileTTF(
      atlas,
      process.argv[2],
      20,
      null,
      ranges);
    if (!font || !SFML.UpdateFontTexture()) {
      throw new Error('Font loading failed');
    }
  }
  const style = SFML.GetStyle();
  style.frameRounding = 4;
  style.itemSpacingY = 8;
  reset();

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
    const seconds = clock.restart().asSeconds();
    samples[cursor] = seconds * 1000;
    cursor = (cursor + 1) % samples.length;
    SFML.Update(window, seconds);
    if (font) {
      ImGui.PushFont(font);
    }
    try {
      drawControls();
    } finally {
      if (font) {
        ImGui.PopFont();
      }
    }
    window.clear(new sf.Color(24, 28, 38));
    SFML.Render(window);
    window.display();
  }
} finally {
  SFML.Shutdown(window);
  window.close();
}
