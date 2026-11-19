'use strict';

// Explicit native consumer acceptance; the ordinary runtime suite is portable.
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const os = require('node:os');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const extension = process.env.SFML_RMLUI_LUA_FIXTURE ||
  path.join(os.tmpdir(), 'sfml-rmlui-lua-contracts.node');
const minimum = -(2n ** 31n);
const maximum = 2n ** 31n - 1n;

const cases = {
  'native-variant-utilities-and-null-contracts': ({ fixture, handle }) => {
    assert.equal(fixture.checkVariantUtilities(handle), true);
  },

  'native-index-push-full-int-domain': ({ fixture, handle }) => {
    for (const value of [ minimum, minimum + 1n, -1n, 0n, 1n, maximum ]) {
      assert.equal(fixture.pushIndex(handle, value), value + 1n);
    }
  },

  'native-index-read-full-int-domain-and-sentinel': ({ fixture, handle }) => {
    for (const value of [ minimum + 1n, -1n, 0n, 1n, maximum, maximum + 1n ]) {
      assert.equal(fixture.getIndex(handle, value), value - 1n);
    }
  },

  'native-index-rejects-before-narrowing': ({ fixture, handle }) => {
    for (const value of [
      -(2n ** 63n), minimum - 1n, minimum, maximum + 2n,
      2n ** 32n + 1n, 2n ** 63n - 1n,
    ]) {
      assert.throws(() => fixture.getIndex(handle, value),
        /index.*range|range.*index/i);
    }

    assert.throws(() => fixture.getIndex(handle, 1.5), /integer/i);
    assert.throws(() => fixture.getIndex(handle, false), /number|integer/i);
    assert.throws(() => fixture.getIndex(handle, null), /number|integer/i);
    assert.equal(fixture.getIndex(handle, '2'), 1n);
    assert.equal(fixture.getIndex(handle, 1), 0n);
  },

  'generic-descriptors-register-and-dispatch': ({ fixture, host, handle }) => {
    assert.equal(fixture.registerTypes(handle), true);
    host.execute(`
      assert(type(ContractValue) == "table")
      assert(type(ContractValue.__getters.value) == "function")
      assert(type(ContractValue.__setters.value) == "function")
      assert(nullValue == nil)
      assert(borrowed.value == 7)
      assert(borrowed:Increment(2) == 9)
      borrowed.value = 11
      assert(borrowed.value == 11)
      assert(getmetatable(borrowed) == ContractValue)
    `);
  },

  'generic-extra-init-inherits-and-overrides': ({ fixture, host, handle }) => {
    assert.equal(fixture.registerTypes(handle), true);
    host.execute(`
      assert(ownedElement:HasChildNodes() == "custom-override")
      assert(ownedElement.tag_name == "custom-tag")
      ownedElement.id = "inherited-setter"
      assert(ownedElement.id == "inherited-setter")
      ownedElement:SetAttribute("inherited-method", 42)
      assert(ownedElement:GetAttribute("inherited-method") == "42")
    `);
  },

  'generic-index-functions-and-fallbacks': ({ fixture, host, handle }) => {
    assert.equal(fixture.registerTypes(handle), true);
    host.execute(`
      ContractValue.Double = function(self) return self.value * 2 end
      assert(borrowed:Double() == 14)
      assert(borrowed.missing == nil)
      borrowed.missing = 9
      assert(borrowed.missing == nil)
      setmetatable(ContractValue, {__index = {inheritedConstant = 19}})
      assert(borrowed.inheritedConstant == 19)
      setmetatable(ContractValue, {
        __index = function(self, key)
          assert(self == borrowed)
          if key == "fallback" then return 23 end
        end
      })
      assert(borrowed.fallback == 23)
      ContractValue.bundle = {bundle = 31}
      assert(borrowed.bundle == 31)
    `);
  },

  'generic-check-errors-and-stack-recovery': ({ fixture, host, handle }) => {
    assert.equal(fixture.registerTypes(handle), true);
    for (const script of [
      'return borrowed[{}]',
      'return borrowed:Increment("bad")',
      'borrowed.value = "bad"',
      'return borrowed:Increment(1000)',
      'return ContractValue.Increment(Vector2i.new(1, 2), 1)',
    ]) {
      assert.throws(() => host.execute(script), /string|number|Contract/i);
      host.execute('assert(borrowed:Increment(0) == 7)');
    }

    host.execute('assert(ContractValue.Increment(nil, 1) == nil)');
  },

  'generic-equality-and-pointer-formatting': ({ fixture, host, handle }) => {
    assert.equal(fixture.registerTypes(handle), true);
    assert.equal(fixture.checkPointerFormatter(), true);
    host.execute(`
      assert(borrowed == sameBorrowed)
      local first = ContractValue.new(7)
      local second = ContractValue.new(7)
      assert(first ~= second)
      assert(tostring(borrowed):match("^ContractValue %(.+%)$"))
      local meta = debug.getmetatable(borrowed)
      assert(meta.__eq(borrowed, nil) == nil)
      assert(not pcall(meta.__eq, borrowed, Vector2i.new(1, 2)))
    `);
  },

  'generic-owned-and-borrowed-gc': ({ fixture, host, handle }) => {
    assert.equal(fixture.registerTypes(handle), true);
    assert.equal(fixture.destructionCount(), 0);
    host.execute(`
      local value = ContractValue.new(5)
      local meta = debug.getmetatable(value)
      meta.__gc(value)
      meta.__gc(value)
      assert(not pcall(function() return value.value end))
      value = nil
      borrowed = nil
      sameBorrowed = nil
      collectgarbage("collect")
    `);
    assert.equal(fixture.destructionCount(), 1);
    assert.equal(fixture.registerTypes(handle), true);
    host.execute('assert(borrowed.value == 7)');
    assert.equal(fixture.destructionCount(), 1);
  },

  'generic-method-error-unwinds-receiver': ({ fixture, host, handle }) => {
    assert.equal(fixture.registerTypes(handle), true);
    host.execute(`
      assert(not pcall(function() ContractValue.new(3):Fail() end))
      collectgarbage("collect")
      assert(borrowed:Increment(1) == 8)
    `);
    assert.equal(fixture.destructionCount(), 1);
  },

  'generic-element-casts-and-borrowed-expiry': ({ fixture, host, handle }) => {
    assert.equal(fixture.registerTypes(handle), true);
    host.execute(`
      local original = Element.As.ContractElement(ownedElement)
      assert(original == ownedElement)
      assert(Element.As.ContractElement(Element.new("div")) == nil)
      assert(Element.As.ContractElement(nil) == nil)
      assert(not pcall(Element.As.ContractElement, Vector2i.new(1, 2)))
      ownedElement = nil
      collectgarbage("collect")
      assert(not pcall(function() return original.id end))
    `);
  },

  'generic-registration-preserves-vm-isolation': ({
    fixture, host, handle, rmlui, luaScriptHostHandle,
  }) => {
    assert.equal(fixture.registerTypes(handle), true);
    const other = new rmlui.LuaScriptHost();
    assert.equal(other.getGlobal('ContractValue'), null);
    assert.equal(fixture.registerTypes(luaScriptHostHandle(other)), true);
    host.execute('ContractValue.localConstant = 7');
    other.execute('assert(ContractValue.localConstant == nil)');
    host.execute('assert(ContractValue.localConstant == 7)');
  },
};

function run(name) {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const { luaScriptHostHandle } = require(
    '../../dist/scripting/lua/lua-scripts');
  const fixture = require(extension);
  fixture.openNative(path.join(root, 'build/Release/rmlui.node'));
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(160, 120)), 'Lua native contracts');
  assert.ok(rmlui.initialise(window, { highDpi: false }));

  try {
    const host = new rmlui.LuaScriptHost();
    cases[name]({
      fixture, host, handle: luaScriptHostHandle(host),
      rmlui, luaScriptHostHandle,
    });
  } finally {
    rmlui.shutdown();
    window.close();
  }
}

if (process.argv[2]) {
  run(process.argv[2]);
} else {
  if (!process.env.SFML_RMLUI_LUA_FIXTURE) {
    const compiled = spawnSync('python3',
      [ path.join(root, 'test/native/scripting/build-lua-contracts.py'),
        extension ], { encoding: 'utf8', timeout: 60000 });
    assert.equal(compiled.status, 0, compiled.stderr);
  }

  let failures = 0;
  for (const name of Object.keys(cases)) {
    const result = spawnSync(process.execPath, [ __filename, name ],
      { encoding: 'utf8', timeout: 20000 });
    if (result.status !== 0) {
      ++failures;
      console.error(`FAIL ${name}: ${result.signal ?? result.status}`,
        result.error ?? '', result.stdout, result.stderr);
    } else {
      console.log(`PASS ${name}`);
    }
  }
  assert.equal(failures, 0, `${failures} native Lua contract failures`);
}
