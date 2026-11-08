'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');

if (!global.gc) {
  const result = spawnSync(process.execPath, [ '--expose-gc', __filename ], {
    stdio: 'inherit',
  });
  if (result.signal) {
    console.error(`[sfml.js-imgui] clone test child signal: ${result.signal}`);
  }
  if (result.error) {
    console.error(result.error);
  }
  process.exit(result.status ?? 1);
}

const sfml = require('sfml.js');
const { ImGui, SFML } = require('../dist');

function createWindow(title) {
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(320, 240)), title);
  assert.ok(SFML.Init(window));
  return window;
}

async function collect() {
  for (let attempt = 0; attempt < 4; attempt++) {
    await new Promise(resolve => setImmediate(resolve));
    global.gc();
  }
}

function callbackClone(callback, userData = 17n) {
  const source = ImGui.GetBackgroundDrawList();
  ImGui.AddCallbackEx(source, callback, userData);
  const clone = ImGui.ImDrawList_CloneOutput(source);
  assert.ok(clone);
  return clone;
}

async function main() {
  const first = createWindow('clone lifetime');
  const second = createWindow('clone other context');
  let secondActive = true;
  try {
    // AddDrawList must retain native ownership, not the JS wrapper.
    SFML.Update(first, 0.016);
    let calls = 0;
    let clone = callbackClone((_list, _command, userData) => {
      assert.equal(userData, 17n);
      calls++;
    });
    const weakClone = new WeakRef(clone);
    ImGui.Render();
    let data = ImGui.GetDrawData();
    assert.ok(data);
    ImGui.ImDrawData_AddDrawList(data, clone);
    clone = null;
    data = null;
    await collect();
    assert.equal(weakClone.deref(), undefined);
    SFML.Render(first);
    assert.equal(calls, 2);
    // Render may be repeated before NewFrame; callbacks remain valid.
    SFML.Render(first);
    assert.equal(calls, 4);

    // A clone of a clone retains callbacks after the source frame is reset.
    SFML.Update(first, 0.016);
    calls = 0;
    clone = callbackClone(() => {
      calls++;
    });
    let nested = ImGui.ImDrawList_CloneOutput(clone);
    clone = null;
    ImGui.Render();
    ImGui.NewFrame();
    ImGui.Render();
    data = ImGui.GetDrawData();
    ImGui.ImDrawData_AddDrawList(data, nested);
    nested = null;
    await collect();
    SFML.Render(first);
    assert.equal(calls, 1);

    // Callbacks appended to a clone also survive cloning and source clearing.
    SFML.Update(first, 0.016);
    calls = 0;
    let appendedCalls = 0;
    clone = callbackClone(() => {
      calls++;
    });
    ImGui.AddCallbackEx(clone, () => {
      appendedCalls++;
    });
    nested = ImGui.ImDrawList_CloneOutput(clone);
    ImGui.ImDrawList__ClearFreeMemory(clone);
    clone = null;
    ImGui.Render();
    SFML.Update(first, 0.016);
    ImGui.Render();
    data = ImGui.GetDrawData();
    ImGui.ImDrawData_AddDrawList(data, nested);
    nested = null;
    await collect();
    SFML.Render(first);
    assert.equal(calls, 1);
    assert.equal(appendedCalls, 1);

    // Clearing draw data releases its retention without clearing a held clone.
    SFML.Update(first, 0.016);
    calls = 0;
    clone = callbackClone(() => {
      calls++;
    });
    ImGui.Render();
    data = ImGui.GetDrawData();
    ImGui.ImDrawData_AddDrawList(data, clone);
    ImGui.ImDrawData_Clear(data);
    assert.equal(ImGui.viewImDrawData(data).CmdListsCount, 0);
    SFML.Update(first, 0.016);
    ImGui.Render();
    data = ImGui.GetDrawData();
    ImGui.ImDrawData_AddDrawList(data, clone);
    clone = null;
    await collect();
    SFML.Render(first);
    assert.equal(calls, 1);

    // Using a handle while another context is current must use its owner.
    SFML.Update(first, 0.016);
    calls = 0;
    clone = callbackClone(() => {
      calls++;
    });
    ImGui.Render();
    data = ImGui.GetDrawData();
    SFML.Update(second, 0.016);
    ImGui.ImDrawData_AddDrawList(data, clone);
    clone = null;
    SFML.Render(second);
    SFML.Update(second, 0.016);
    SFML.Render(second);
    SFML.Shutdown(second);
    second.close();
    secondActive = false;
    await collect();
    SFML.Render(first);
    assert.equal(calls, 2);

    // Callback handles and their mapped buffers retain clone storage too.
    SFML.Update(first, 0.016);
    let commandView;
    let listView;
    let savedList;
    clone = callbackClone((list, command) => {
      savedList = list;
      commandView = ImGui.viewImDrawCmd(command);
      listView = ImGui.viewImDrawList(list);
    });
    ImGui.Render();
    SFML.Update(first, 0.016);
    ImGui.Render();
    data = ImGui.GetDrawData();
    ImGui.ImDrawData_AddDrawList(data, clone);
    clone = null;
    await collect();
    SFML.Render(first);
    assert.ok(commandView);
    ImGui.ImDrawData_Clear(data);
    SFML.Update(first, 0.016);
    await collect();
    assert.equal(commandView.UserCallbackDataSize, 0);
    listView._FringeScale = 2.5;
    assert.equal(ImGui.viewImDrawList(savedList)._FringeScale, 2.5);
    savedList = null;
    await collect();
    listView._FringeScale = 3.5;
    assert.equal(listView._FringeScale, 3.5);
    assert.equal(commandView.UserCallbackDataSize, 0);
    ImGui.Render();
  } finally {
    if (secondActive) {
      SFML.Shutdown(second);
      second.close();
    }
    SFML.Shutdown(first);
    first.close();
  }
}

main().then(() => {
  console.log('[sfml.js-imgui] clone lifetime ok');
}, error => {
  console.error(error);
  process.exitCode = 1;
});
