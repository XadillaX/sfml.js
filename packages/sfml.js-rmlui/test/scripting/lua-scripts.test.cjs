'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const cases = {
  'nested-document-loads-from-original-menu-events': ({ rmlui, context }) => {
    const file = '/tmp/rmlui-63-completion/lua-nested-document.rml';
    fs.writeFileSync(file, '<rml><head><title>Nested</title></head>' +
      '<body id="nested" onload="loads = (loads or 0) + 1"/></rml>');
    const host = new rmlui.LuaScriptHost({ allowInline: true });
    host.setGlobal('next_file', file);
    context.setScriptHost(host);
    const menu = context.loadDocumentFromMemory(
      '<rml><head/><body id="menu" ' +
      'onload="loaded = context:LoadDocument(next_file)">' +
      '<button id="next" onclick="' +
      'loaded = context:LoadDocument(next_file); loaded:Show(); ' +
      'created = context:CreateDocument(); created.title = \'Created\'; ' +
      'document:Close()"/></body></rml>');
    assert.equal(host.getGlobal('loads'), 1n);
    assert.equal(context.getNumDocuments(), 2);
    menu.getElementById('next').click();
    assert.equal(host.getGlobal('loads'), 2n);
    context.update();
    assert.equal(context.getNumDocuments(), 3);
    host.execute('assert(loaded.title == "Nested"); ' +
      'assert(created.title == "Created"); ' +
      'assert(document == nil and event == nil)');
  },

  'real-lua-state-and-typed-calls': ({ rmlui }) => {
    const host = new rmlui.LuaScriptHost();
    const other = new rmlui.LuaScriptHost();
    host.execute('function add(a,b) return a+b end\nvalue = 42');
    assert.equal(host.call('add', 9007199254740993n, 2n), 9007199254740995n);
    assert.equal(host.call('add', 1.25, 2.5), 3.75);
    assert.equal(host.getGlobal('value'), 42n);
    assert.equal(other.getGlobal('value'), null);
    host.setGlobal('text', 'zero\0suffix');
    host.setGlobal('flag', true);
    assert.equal(host.getGlobal('text'), 'zero\0suffix');
    assert.equal(host.getGlobal('flag'), true);
    host.execute('function echo(value) return value end');
    assert.equal(host.call('echo', 'zero\0suffix'), 'zero\0suffix');
    assert.throws(() => host.setGlobal('large', 2n ** 64n), /64-bit/);
    assert.throws(() => host.call('add', Infinity, 1), /finite/);
    host.execute('function nonfinite() return 0/0 end; overflow=math.huge');
    assert.throws(() => host.call('nonfinite'), /finite/);
    assert.throws(() => host.getGlobal('overflow'), /finite/);
    assert.throws(() => host.call('missing'), /named.*function/i);
    assert.throws(() => host.getGlobal('value.bad'), /identifier/);
    assert.throws(() => host.setGlobal('document', null), /reserved/i);
  },

  'accurate-sources-and-stack-recovery': ({ rmlui, context }) => {
    const host = new rmlui.LuaScriptHost({ allowInline: true });
    assert.throws(() => host.execute('error("origin")', 'original.lua', 7),
      /original.lua:7.*origin/s);
    host.execute('function alive() return 9 end');
    assert.equal(host.call('alive'), 9n);
    context.setScriptHost(host);
    assert.throws(() => context.loadDocumentFromMemory(
      '<rml>\n<head>\n<script>\nerror("head")\n</script>' +
      '</head><body/></rml>', 'exact.rml'), /exact.rml:4.*head/s);
    assert.equal(context.getNumDocuments(), 0);
    const document = context.loadDocumentFromMemory(
      '<rml><head><script>document.title = "recovered"</script>' +
      '</head><body/></rml>');
    assert.equal(document.title, 'recovered');
  },

  'head-order-and-shared-document-globals': ({ rmlui, context }) => {
    const host = new rmlui.LuaScriptHost({ allowInline: true });
    context.setScriptHost(host);
    const source = '<rml><head><script>' +
      'count = (count or 0) + 1;' +
      'assert(document:GetElementById("later") == nil);' +
      'document.title = tostring(count)' +
      '</script><script>document.title = document.title .. "-second"</script>' +
      '</head><body><div id="later"/></body></rml>';
    const first = context.loadDocumentFromMemory(source);
    const second = context.loadDocumentFromMemory(source);
    assert.equal(first.title, '1-second');
    assert.equal(second.title, '2-second');
    assert.equal(host.getGlobal('count'), 2n);
    assert.equal(host.getGlobal('document'), null);
  },

  'named-handler-and-expired-event': ({ rmlui, context }) => {
    const host = new rmlui.LuaScriptHost();
    host.execute('function cancel(e, target, doc) saved = e;' +
      'savedParameters = e.parameters;' +
      'assert(doc == document); assert(target == element);' +
      'doc.title = e.type; e:StopImmediatePropagation() end');
    context.setScriptHost(host);
    const document = context.loadDocumentFromMemory(
      '<rml><head/><body><button id="go" onclick="cancel"/></body></rml>');
    let bubbles = 0;
    document.addEventListener('click', () => ++bubbles);
    document.getElementById('go').click();
    assert.equal(document.title, 'click');
    assert.equal(bubbles, 0);
    assert.throws(() => host.execute('saved:StopPropagation()'),
      /no longer valid/);
    assert.throws(() => host.execute(
      'for k,v in pairs(savedParameters) do end'),
    /no longer valid/);
  },

  'nested-event-globals-and-lua-attached-functions': ({ rmlui, context }) => {
    const host = new rmlui.LuaScriptHost({ allowInline: true });
    host.execute('trace = ""; function run(e, target, doc)' +
      'trace = trace .. event.type .. ",";' +
      'if event.type == "click" then target:DispatchEvent("nested", {}) end;' +
      'trace = trace .. event.type .. "," end');
    context.setScriptHost(host);
    const document = context.loadDocumentFromMemory(
      '<rml><head/><body><button id="go" onclick="run" onnested="run"/>' +
      '</body></rml>');
    document.getElementById('go').click();
    assert.equal(host.getGlobal('trace'), 'click,nested,nested,click,');
    document.loadInlineScript(
      'document:GetElementById("go"):AddEventListener(' +
      '"function-event", function(e) document.title = e.type end)',
      'attach.lua');
    document.getElementById('go').dispatchEvent('function-event', {});
    assert.equal(document.title, 'function-event');
    assert.equal(host.getGlobal('event'), null);
  },

  'lua-node-context-selection-and-direct-factory': ({ rmlui, context }) => {
    const lua = new rmlui.LuaScriptHost();
    lua.execute('function run(e, target, doc) doc.title = "Lua" end');
    const node = new rmlui.NodeScriptHost({
      handlers: {
        run(_event, document) {
          document.title = 'Node';
        },
      },
    });
    const body = rmlui.Factory.getElementInstancer('body');
    const source = '<rml><head/><body><button id="go" onclick="run"/>' +
      '</body></rml>';
    context.setScriptHost(lua);
    const first = context.loadDocumentFromMemory(source);
    context.setScriptHost(node);
    const second = context.loadDocumentFromMemory(source);
    context.setScriptHost(null);
    first.getElementById('go').click();
    second.getElementById('go').click();
    assert.equal(first.title, 'Lua');
    assert.equal(second.title, 'Node');
    assert.strictEqual(rmlui.Factory.getElementInstancer('body'), body);
    const listener = rmlui.Factory.instanceEventListener(
      'run', first.getElementById('go'));
    assert.ok(listener instanceof rmlui.EventListener);
    const target = second.getElementById('go');
    target.addEventListener('probe', listener);
    target.dispatchEvent('probe', {});
    assert.equal(first.title, 'Lua');
    target.removeEventListener('probe', listener);
    listener.release();
  },

  'source-policy-and-external-files': ({ rmlui, context }) => {
    const directory = fs.mkdtempSync(
      path.join(os.tmpdir(), 'rmlui-lua-sources-'));
    try {
      const disabled = new rmlui.LuaScriptHost();
      context.setScriptHost(disabled);
      assert.throws(() => context.loadDocumentFromMemory(
        '<rml><head><script>error("disabled")</script></head><body/></rml>'),
      /inline.*disabled/i);
      assert.throws(() => context.loadDocumentFromMemory(
        '<rml><head/><body onclick="missing()"/></rml>'), /unknown.*handler/i);
      fs.writeFileSync(path.join(directory, 'empty.lua'), '');
      fs.writeFileSync(path.join(directory, 'first.lua'),
        'document.title = "external"');
      context.setScriptHost(new rmlui.LuaScriptHost({
        allowInline: true, allowExternal: true,
      }));
      const document = context.loadDocumentFromMemory(
        '<rml><head><script src="empty.lua"/><script src="first.lua"/>' +
        '<script>document.title = document.title .. "-inline"</script>' +
        '</head><body/></rml>', path.join(directory, 'panel.rml'));
      assert.equal(document.title, 'external-inline');
      fs.writeFileSync(path.join(directory, 'bad.lua'), '\nerror("external")');
      assert.throws(() => document.loadExternalScript(
        path.join(directory, 'bad.lua')), /bad.lua:2.*external/s);
    } finally {
      fs.rmSync(directory, { recursive: true, force: true });
    }
  },

  'checked-dom-proxies-and-invalid-casts': ({ rmlui, context }) => {
    const host = new rmlui.LuaScriptHost({ allowInline: true });
    context.setScriptHost(host);
    const document = context.loadDocumentFromMemory(
      '<rml><head/><body><div id="go" data-value="value"/></body></rml>');
    document.loadInlineScript('saved = document:GetElementById("go");' +
      'attributes = saved.attributes; style = saved.style;' +
      'children = saved.child_nodes; savedContext = document.context;' +
      'assert(Element.As.ElementFormControlInput(saved) == nil);' +
      'keys = 0; for key,value in pairs(attributes) do keys = keys + 1 end',
    'proxies.lua');
    assert.ok(host.getGlobal('keys') > 0n);
    document.innerRML = '';
    for (const expression of [
      'value = saved.id', 'value = attributes.id',
      'value = style.width', 'value = children[1]',
    ]) {
      assert.throws(() => host.execute(expression), /no longer valid/);
    }
    context.remove();
    assert.throws(() => host.execute('value = savedContext.name'),
      /no longer valid/);
  },

  'active-subtree-guards-and-event-parameters': ({ rmlui, context }) => {
    const host = new rmlui.LuaScriptHost({ allowInline: true });
    host.execute('function remove(e, target, doc) doc.inner_rml = "" end;' +
      'function update(e, target, doc) doc.context:Update() end;' +
      'function inspect(e) exact = e.parameters.exact;' +
      'text = e.parameters.text end');
    context.setScriptHost(host);
    const document = context.loadDocumentFromMemory(
      '<rml><head/><body><button id="remove" onclick="remove"/>' +
      '<button id="update" onclick="update"/>' +
      '<div id="inspect" onvalues="inspect"/>' +
      '</body></rml>');
    assert.throws(() => document.getElementById('remove').click(),
      /active|target|subtree/);
    assert.throws(() => document.getElementById('update').click(), /callback/);
    document.loadInlineScript(
      'document:GetElementById("inspect"):DispatchEvent(' +
      '"values", {exact=9007199254740993, text="zero\\0suffix"})',
      'parameters.lua');
    assert.equal(host.getGlobal('exact'), 9007199254740993n);
    assert.equal(host.getGlobal('text'), 'zero\0suffix');
    document.loadInlineScript(
      'assert(pcall(function() document:AppendChild(nil) end))',
      'nil-child.lua');
  },

  'moved-listener-and-shutdown-invalidation': ({ rmlui, context, window }) => {
    const host = new rmlui.LuaScriptHost({ allowInline: true });
    host.execute('calls = 0; function run() calls = calls + 1 end');
    context.setScriptHost(host);
    const source = '<rml><head/><body><div id="go"/></body></rml>';
    const first = context.loadDocumentFromMemory(source);
    const second = context.loadDocumentFromMemory(source);
    const listener = rmlui.Factory.instanceEventListener(
      'run', first.getElementById('go'));
    const target = second.getElementById('go');
    target.addEventListener('probe', listener);
    context.unloadDocument(first);
    context.update();
    assert.throws(() => target.dispatchEvent('probe', {}), /no longer valid/);
    assert.equal(host.getGlobal('calls'), 0n);
    target.removeEventListener('probe', listener);
    listener.release();
    second.loadInlineScript(
      'retained = document; contextRef = document.context', 'retain.lua');
    rmlui.shutdown();
    assert.ok(rmlui.initialise(window, { highDpi: false }));
    assert.throws(() => host.execute('return'), /no longer valid/);
    assert.throws(() => rmlui.createContext('restart', 180, 120)
      .setScriptHost(host), /no longer valid/);
  },

  'static-frames-and-native-only-dispatch': ({ rmlui, context }) => {
    const native = require('../../build/Release/rmlui.node');
    const host = new rmlui.LuaScriptHost();
    host.execute('calls = 0; function run() calls = calls + 1 end');
    context.setScriptHost(host);
    const document = context.loadDocumentFromMemory(
      '<rml><head><style>body{display:block;width:180px;height:120px;}' +
      'div{display:block;width:20px;height:20px;background-color:#f00;}' +
      '</style></head><body><div id="go" onclick="run"/></body></rml>');
    document.show();
    context.update();
    context.render();
    native.beginDataDiagnostics(false);
    for (let i = 0; i < 20; ++i) {
      context.update();
      context.render();
    }
    const counters = native.endDataDiagnostics();
    assert.equal(counters.runtimeEntries, 40);
    assert.equal(counters.nativeCallbacks, 0);
    assert.equal(counters.geometryUploads, 0);
    assert.equal(counters.typedListenerOwnershipVisits, 0);
    const target = document.getElementById('go');
    native.beginDataDiagnostics(false);
    target.click();
    const click = native.endDataDiagnostics();
    assert.equal(click.nativeCallbacks, 0);
    assert.equal(click.runtimeEntries, 1);
    assert.equal(host.getGlobal('calls'), 1n);
  },

  'global-metamethods-cannot-escape-native-boundaries':
    ({ rmlui, context }) => {
      const host = new rmlui.LuaScriptHost({ allowInline: true });
      host.execute('setmetatable(_G, {' +
        '__index=function() error("global getter") end,' +
        '__newindex=function() error("global setter") end})');
      assert.equal(host.getGlobal('missing'), null);
      host.setGlobal('injected', 3n);
      assert.equal(host.getGlobal('injected'), 3n);
      assert.throws(() => host.call('missing'), /named.*function/i);
      context.setScriptHost(host);
      const document = context.loadDocumentFromMemory(
        '<rml><head><script>document.title = "raw scope"</script>' +
        '</head><body/></rml>');
      assert.equal(document.title, 'raw scope');
    },

  'native-call-getters-must-revalidate-the-vm': ({ rmlui }) => {
    const native = require('../../build/Release/rmlui.node');
    const handle = native.createLuaScriptHost(false, false);
    native.executeLuaScript(handle, 'function echo(v) return v end', '', 1);
    const args = [];
    Object.defineProperty(args, 0, {
      get() {
        rmlui.shutdown();
        return 1;
      },
    });
    assert.throws(() => native.callLuaFunction(handle, 'echo', args),
      /no longer valid/);
  },

  'owned-elements-and-listeners-survive-gc-and-shutdown': ({ rmlui }) => {
    const host = new rmlui.LuaScriptHost();
    host.execute('owned = Element.new("div"); calls = 0;' +
      'owned:AddEventListener("probe", function() calls = calls + 1 end);' +
      'collectgarbage(); owned:DispatchEvent("probe", {});' +
      'owned:AddEventListener("collect", function()' +
      'local ok = pcall(debug.getmetatable(owned).__gc, owned);' +
      'assert(not ok) end); owned:DispatchEvent("collect", {})');
    assert.equal(host.getGlobal('calls'), 1n);
    rmlui.shutdown();
    assert.throws(() => host.getGlobal('calls'), /initiali[sz]|valid/);
  },

  'lua-data-model-context-identity-and-expired-proxies':
    ({ rmlui, context }) => {
      const host = new rmlui.LuaScriptHost({ allowInline: true });
      const other = rmlui.createContext('lua-other', 180, 120);
      context.setScriptHost(host);
      other.setScriptHost(host);
      const source = '<rml><head/><body/></rml>';
      const first = context.loadDocumentFromMemory(source);
      const second = other.loadDocumentFromMemory(source);
      first.loadInlineScript(
        'firstContext = context;' +
        'firstModel = context:OpenDataModel("shared", {rows={{value=1}}});' +
        'firstProxy = firstModel.rows[1]', 'first-model.lua');
      second.loadInlineScript(
        'secondModel = context:OpenDataModel("shared", {rows={{value=2}}});' +
        'secondProxy = secondModel.rows[1];' +
        'assert(firstModel.rows[1].value == 1);' +
        'assert(secondModel.rows[1].value == 2)', 'second-model.lua');
      host.execute(
        'firstContext:CloseDataModel("shared");' +
        'assert(not pcall(function() return firstProxy.value end));' +
        'assert(not pcall(function() firstProxy.value = 8 end));' +
        'assert(secondProxy.value == 2)', 'close-model.lua');
      other.removeDataModel('shared');
      assert.throws(() => host.execute('value = secondModel.rows'),
        /closed|valid/i);
      assert.throws(() => host.execute('secondProxy.value = 9'),
        /closed|valid/i);
      host.execute('collectgarbage(); alive = true');
      assert.equal(host.getGlobal('alive'), true);
    },

  'lua-data-model-arrays-replacement-and-events': ({ rmlui, context }) => {
    const host = new rmlui.LuaScriptHost({ allowInline: true });
    context.setScriptHost(host);
    const setup = context.loadDocumentFromMemory(
      '<rml><head/><body/></rml>');
    setup.loadInlineScript(
      'modelContext = context; calls = 0;' +
      'model = context:OpenDataModel("values", {' +
      'rows={{value=3},{value=4}}, enabled=true, exact=9007199254740993,' +
      'run=function(e, v) calls=calls+1; model.rows[1].value=v;' +
      'savedDataEvent=e;' +
      'assert(event==e and document~=nil and context==modelContext);' +
      'assert(element.id=="go");' +
      'assert(not pcall(function() ' +
      'modelContext:CloseDataModel("values") end))' +
      ';assert(not pcall(function() ' +
      'modelContext:OpenDataModel("forbidden", {}) end))' +
      'end});' +
      'assert(model.exact == 9007199254740993);' +
      'assert(context:OpenDataModel("values", {}) == model)',
      'data-setup.lua');
    const document = context.loadDocumentFromMemory(
      '<rml><head/><body data-model="values">' +
      '<div id="rows"><span data-for="row : rows">{{row.value}}</span></div>' +
      '<button id="go" data-event-click="run(11)"/>' +
      '</body></rml>');
    document.show();
    context.update();
    assert.match(document.getElementById('rows').innerRML, /3.*4/s);
    document.getElementById('go').click();
    assert.equal(host.getGlobal('calls'), 1n);
    assert.throws(() => host.execute('value = savedDataEvent.type'),
      /no longer valid/);
    context.update();
    assert.match(document.getElementById('rows').innerRML, /11.*4/s);
    host.execute('model.rows = {{value=7},{value=8},{value=9}}');
    context.update();
    assert.match(document.getElementById('rows').innerRML, /7.*8.*9/s);
    host.execute('model.rows[2] = {value=12}; model.rows[4] = {value=13}');
    context.update();
    assert.match(document.getElementById('rows').innerRML, /7.*12.*9.*13/s);
    context.remove();
    assert.throws(() => host.execute('value = model.rows'), /closed|valid/i);
  },

  'lua-data-model-gc-errors-and-static-native-path': ({ rmlui, context }) => {
    const native = require('../../build/Release/rmlui.node');
    const host = new rmlui.LuaScriptHost({ allowInline: true });
    context.setScriptHost(host);
    const setup = context.loadDocumentFromMemory(
      '<rml><head/><body/></rml>');
    setup.loadInlineScript(
      'model = context:OpenDataModel("guarded", {rows={{value=1}}});' +
      'assert(not pcall(debug.getmetatable(model).__gc, model));' +
      'proxy = model.rows; local gc = debug.getmetatable(proxy).__gc;' +
      'gc(proxy); assert(pcall(gc, proxy));' +
      'assert(not pcall(function() return proxy[1] end))',
      'model-gc.lua');
    const document = context.loadDocumentFromMemory(
      '<rml><head/><body data-model="guarded">' +
      '<span id="value">{{rows[0].value}}</span></body></rml>');
    document.show();
    context.update();
    assert.match(document.getElementById('value').innerRML, /1/);
    host.execute('model.rows = {setmetatable({}, {' +
      '__index=function() error("data getter") end})}');
    assert.throws(() => context.update(), /data getter/);
    host.execute('model.rows = {{value=6}}');
    context.update();
    assert.match(document.getElementById('value').innerRML, /6/);
    context.render();
    native.beginDataDiagnostics(false);
    for (let i = 0; i < 20; ++i) {
      context.update();
      context.render();
    }
    const counters = native.endDataDiagnostics();
    assert.equal(counters.runtimeEntries, 40);
    assert.equal(counters.nativeCallbacks, 0);
    assert.equal(counters.geometryUploads, 0);
    context.removeDataModel('guarded');
    host.execute('local gc = debug.getmetatable(model).__gc;' +
      'gc(model); assert(pcall(gc, model)); collectgarbage()');
  },

  'lua-native-model-retains-vm-after-host-gc': async ({ rmlui, context }) => {
    let destroyed = 0;
    rmlui.registerPlugin(new rmlui.Plugin({
      getEventClasses: () => rmlui.PluginEventClasses.Element,
      onElementDestroy(element) {
        if (element.tagName === 'model-vm-gc') {
          ++destroyed;
        }
      },
    }));
    let weak;
    (() => {
      const host = new rmlui.LuaScriptHost({ allowInline: true });
      host.execute('owned = Element.new("model-vm-gc")');
      context.setScriptHost(host);
      const document = context.loadDocumentFromMemory(
        '<rml><head><script>' +
        'model=context:OpenDataModel("retained", {value=5})' +
        '</script></head><body/></rml>');
      context.setScriptHost(null);
      context.unloadDocument(document);
      weak = new WeakRef(host);
    })();
    for (let i = 0; i < 12; ++i) {
      await new Promise(resolve => setImmediate(resolve));
      global.gc();
      context.update();
    }
    assert.equal(weak.deref(), undefined);
    assert.equal(destroyed, 0);
    context.removeDataModel('retained');
    assert.equal(destroyed, 1);
  },

  'lua-data-proxy-metamethods-cannot-destroy-active-storage':
    ({ rmlui, context }) => {
      const host = new rmlui.LuaScriptHost({ allowInline: true });
      context.setScriptHost(host);
      const setup = context.loadDocumentFromMemory(
        '<rml><head/><body/></rml>');
      setup.loadInlineScript(
        'modelContext=context; model=context:OpenDataModel("active", {' +
        'rows=setmetatable({}, {__index=function()' +
        'assert(not pcall(debug.getmetatable(proxy).__gc, proxy));' +
        'assert(not pcall(function() ' +
        'modelContext:CloseDataModel("active") end));' +
        'return 5 end})})', 'active-model.lua');
      host.execute('proxy=model.rows; assert(proxy[1] == 5);' +
        'assert(proxy[2] == 5); modelContext:CloseDataModel("active");' +
        'assert(not pcall(function() return proxy[1] end))');
    },

  'lua-element-instancer-registration-and-direct-factory':
    ({ rmlui, context }) => {
      const host = new rmlui.LuaScriptHost();
      host.execute('calls=0; instancer=ElementInstancer.new(function(tag)' +
        'calls=calls+1; return Element.new(tag) end);' +
        'rmlui:RegisterTag("lua-tag", instancer); instancer=nil;' +
        'collectgarbage()');
      const document = context.loadDocumentFromMemory(
        '<rml><head/><body><lua-tag id="custom"/></body></rml>');
      assert.equal(document.getElementById('custom').tagName, 'lua-tag');
      assert.equal(host.getGlobal('calls'), 1n);
      const factory = rmlui.Factory.getElementInstancer('lua-tag');
      const element = factory.instanceElement(null, 'lua-direct', {});
      assert.equal(element.tagName, 'lua-direct');
      assert.equal(host.getGlobal('calls'), 2n);
      factory.releaseElement(element);
      assert.throws(() => element.tagName, /valid|released/);
      rmlui.Factory.registerElementInstancer('lua-tag', null);
      context.remove();
      rmlui.shutdown();
    },

  'lua-instancer-errors-replacement-and-original-allocator':
    ({ rmlui, context }) => {
      const host = new rmlui.LuaScriptHost({ allowInline: true });
      context.setScriptHost(host);
      const setup = context.loadDocumentFromMemory(
        '<rml><head/><body/></rml>');
      setup.loadInlineScript(
        'pooled = document:CreateElement("div");' +
        'first = ElementInstancer.new(function() return pooled end);' +
        'bad = ElementInstancer.new(function() return "wrong" end);' +
        'empty = ElementInstancer.new(nil)', 'pooled.lua');
      host.execute('rmlui:RegisterTag("lua-first", first);' +
        'rmlui:RegisterTag("lua-bad", bad); ' +
        'rmlui:RegisterTag("lua-empty", empty)');
      const first = rmlui.Factory.getElementInstancer('lua-first');
      const pooled = first.instanceElement(null, 'unused', {});
      assert.equal(pooled.tagName, 'div');
      const bad = rmlui.Factory.getElementInstancer('lua-bad');
      assert.throws(() => bad.instanceElement(null, 'bad', {}),
        /userdata|owned Element/);
      assert.equal(rmlui.Factory.getElementInstancer('lua-empty')
        .instanceElement(null, 'empty', {}), null);
      host.execute('bad.InstanceElement = function() ' +
        'return Element.new("ok") end');
      const recovered = bad.instanceElement(null, 'ok', {});
      assert.equal(recovered.tagName, 'ok');
      bad.releaseElement(recovered);
      host.execute('second = ElementInstancer.new(function()' +
        'return Element.new("second") end);' +
        'rmlui:RegisterTag("lua-first", second); first=nil; collectgarbage()');
      const second = rmlui.Factory.getElementInstancer('lua-first');
      const newer = second.instanceElement(null, 'newer', {});
      assert.equal(newer.tagName, 'second');
      assert.throws(() => second.releaseElement(pooled), /another instancer/);
      first.releaseElement(pooled);
      second.releaseElement(newer);
      context.remove();
    },

  'lua-instancer-vm-retention-and-facade-after-unregistration':
    async ({ rmlui, context }) => {
      let destroyed = 0;
      rmlui.registerPlugin(new rmlui.Plugin({
        getEventClasses: () => rmlui.PluginEventClasses.Element,
        onElementDestroy(element) {
          if (element.tagName === 'instancer-vm-gc') {
            ++destroyed;
          }
        },
      }));
      let weak;
      let facade;
      (() => {
        const host = new rmlui.LuaScriptHost();
        host.execute('owned=Element.new("instancer-vm-gc");' +
          'allocator=ElementInstancer.new(function(tag)' +
          'return Element.new(tag) end); ' +
          'rmlui:RegisterTag("vm-tag", allocator)');
        facade = rmlui.Factory.getElementInstancer('vm-tag');
        weak = new WeakRef(host);
      })();
      const element = facade.instanceElement(null, 'alive', {});
      rmlui.Factory.registerElementInstancer('vm-tag', null);
      for (let i = 0; i < 12; ++i) {
        await new Promise(resolve => setImmediate(resolve));
        global.gc();
        context.update();
      }
      assert.equal(weak.deref(), undefined);
      assert.equal(destroyed, 0);
      const next = facade.instanceElement(null, 'next', {});
      facade.releaseElement(next);
      facade.releaseElement(element);
      facade = null;
      for (let i = 0; i < 12; ++i) {
        await new Promise(resolve => setImmediate(resolve));
        global.gc();
        context.update();
      }
      assert.equal(destroyed, 1);
    },

  'lua-created-context-inherits-the-active-host': ({ rmlui }) => {
    const directory = fs.mkdtempSync(
      path.join(os.tmpdir(), 'rmlui-lua-owned-'));
    try {
      const file = path.join(directory, 'owned.rml');
      fs.writeFileSync(file, '<rml><head><script>' +
        'document.title="loaded"; function go(e, target, doc)' +
        'doc.title="Lua-owned" end</script></head>' +
        '<body><button id="go" onclick="go"/></body></rml>');
      const host = new rmlui.LuaScriptHost({ allowInline: true });
      host.setGlobal('sourceFile', file);
      host.execute('ownedContext=rmlui:CreateContext(' +
        '"created-in-lua", Vector2i.new(180,120));' +
        'ownedDocument=ownedContext:LoadDocument(sourceFile);' +
        'assert(ownedDocument.title=="loaded");' +
        'ownedDocument:GetElementById("go"):Click();' +
        'assert(ownedDocument.title=="Lua-owned");' +
        'assert(not pcall(function() ownedContext:UnloadDocument(nil) end))');
    } finally {
      fs.rmSync(directory, { recursive: true, force: true });
    }
  },

  'lua-coroutines-share-the-managed-vm-and-own-call-stacks':
    ({ rmlui, context }) => {
      const host = new rmlui.LuaScriptHost({ allowInline: true });
      context.setScriptHost(host);
      const document = context.loadDocumentFromMemory(
        '<rml><head/><body/></rml>');
      document.loadInlineScript('savedContext=context', 'coroutines.lua');
      host.execute(
        'calls=0; local co=coroutine.create(function()' +
        'owned=Element.new("co"); owned:AddEventListener("probe", ' +
        'function() calls=calls+1 end);' +
        'model=savedContext:OpenDataModel("co", {rows={{value=5}},' +
        'run=function() calls=calls+10 end});' +
        'allocator=ElementInstancer.new(function(tag) ' +
        'return Element.new(tag) end);' +
        'rmlui:RegisterTag("co-tag", allocator);' +
        'coroutine.yield(); model.rows[1].value=9;' +
        'owned:DispatchEvent("probe", {}) end);' +
        'assert(coroutine.resume(co)); assert(model.rows[1].value==5);' +
        'assert(coroutine.resume(co)); assert(model.rows[1].value==9);' +
        'owned:DispatchEvent("probe", {}); assert(calls==2);' +
        'collectgarbage()');
      const element = rmlui.Factory.getElementInstancer('co-tag')
        .instanceElement(null, 'co-result', {});
      assert.equal(element.tagName, 'co-result');
      element.release();
      const data = context.loadDocumentFromMemory(
        '<rml><head/><body data-model="co"><span id="value">' +
        '{{rows[0].value}}</span><button id="go" data-event-click="run()"/>' +
        '</body></rml>');
      context.update();
      assert.match(data.getElementById('value').innerRML, /9/);
      data.getElementById('go').click();
      assert.equal(host.getGlobal('calls'), 12n);
      context.removeDataModel('co');
      host.execute('local co=coroutine.create(function()' +
        'local ok=pcall(function() return model.rows end);' +
        'assert(not ok) end); assert(coroutine.resume(co))');
    },

  'lua-data-events-reject-recursion-and-restore-globals':
    ({ rmlui, context }) => {
      const host = new rmlui.LuaScriptHost({ allowInline: true });
      context.setScriptHost(host);
      const setup = context.loadDocumentFromMemory(
        '<rml><head/><body/></rml>');
      setup.loadInlineScript(
        'calls=0; model=context:OpenDataModel("recursive", {' +
        'run=function(e) calls=calls+1; ' +
        'element:DispatchEvent("click", {}) end})', 'recursion.lua');
      const document = context.loadDocumentFromMemory(
        '<rml><head/><body data-model="recursive">' +
        '<button id="go" data-event-click="run()"/></body></rml>');
      context.update();
      assert.throws(() => document.getElementById('go').click(),
        /recursively.*Lua data event/);
      assert.equal(host.getGlobal('calls'), 1n);
      assert.equal(host.getGlobal('event'), null);
      assert.equal(host.getGlobal('document'), null);
      host.execute('model.run=function() calls=calls+1 end');
      document.getElementById('go').click();
      assert.equal(host.getGlobal('calls'), 2n);
    },

  'lua-widget-mutations-preserve-active-targets': ({ rmlui, context }) => {
    const host = new rmlui.LuaScriptHost({ allowInline: true });
    host.execute('function remove(e, target, doc)' +
      'Element.As.ElementFormControlSelect(' +
      'doc:GetElementById("select")):RemoveAll() end;' +
      'function inspect(e, target, doc)' +
      'local options=Element.As.ElementFormControlSelect(' +
      'doc:GetElementById("select")).options;' +
      'assert(not pcall(function() return options[1] end)) end;' +
      'function replace(e, target, doc)' +
      'Element.As.ElementTabSet(doc:GetElementById("tabs")):' +
      'SetPanel(1,"replaced") end');
    context.setScriptHost(host);
    const document = context.loadDocumentFromMemory(
      '<rml><head/><body>' +
      '<select id="select"><option value="1">One</option></select>' +
      '<tabset id="tabs"><tabs><tab>Tab</tab></tabs>' +
      '<panels><panel><button id="panel-button" onclick="replace"/></panel>' +
      '</panels></tabset></body></rml>');
    document.loadInlineScript(
      'local select=Element.As.ElementFormControlSelect(' +
      'document:GetElementById("select"));' +
      'assert(select.options[1].value=="1");' +
      'select:AddEventListener("click", remove)', 'widget-listeners.lua');
    assert.throws(() => document.getElementById('select').click(),
      /active|target|callback/);
    assert.throws(() => document.getElementById('panel-button').click(),
      /active|target|callback/);
    document.loadInlineScript(
      'document:GetElementById("select"):AddEventListener("inspect", inspect)',
      'inspect-options.lua');
    document.getElementById('select').dispatchEvent('inspect', {});
  },

  'lua-finalizers-cannot-reenter-context-creation':
    async ({ rmlui, context }) => {
      const directory = fs.mkdtempSync(
        path.join(os.tmpdir(), 'rmlui-lua-finalizer-'));
      try {
        const resultFile = path.join(directory, 'result.txt');
        let weak;
        (() => {
          const host = new rmlui.LuaScriptHost();
          host.setGlobal('resultFile', resultFile);
          host.execute('finalizer=setmetatable({}, {__gc=function()' +
            'local ok=pcall(function() rmlui:CreateContext(' +
            '"forbidden-finalizer", Vector2i.new(180,120)) end);' +
            'local file=assert(io.open(resultFile,"w"));' +
            'file:write(tostring(ok)); file:close() end})');
          weak = new WeakRef(host);
        })();
        for (let i = 0; i < 12; ++i) {
          await new Promise(resolve => setImmediate(resolve));
          global.gc();
          context.update();
        }
        assert.equal(weak.deref(), undefined);
        assert.equal(fs.readFileSync(resultFile, 'utf8'), 'false');
      } finally {
        fs.rmSync(directory, { recursive: true, force: true });
      }
    },

  'unused-vm-closes-outside-v8-gc': async ({ rmlui, context }) => {
    let destroyed = 0;
    rmlui.registerPlugin(new rmlui.Plugin({
      getEventClasses: () => rmlui.PluginEventClasses.Element,
      onElementDestroy(element) {
        if (element.tagName === 'lua-gc') {
          ++destroyed;
        }
      },
    }));
    let weak;
    (() => {
      const host = new rmlui.LuaScriptHost();
      host.execute('owned = Element.new("lua-gc")');
      weak = new WeakRef(host);
    })();
    for (let i = 0; i < 12; ++i) {
      await new Promise(resolve => setImmediate(resolve));
      global.gc();
      context.update();
    }
    assert.equal(weak.deref(), undefined);
    assert.equal(destroyed, 1);
  },
};

async function run(name) {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(180, 120)), 'Lua scripts');
  assert.ok(rmlui.initialise(window, { highDpi: false }));
  try {
    await cases[name]({
      rmlui, window, context: rmlui.createContext('lua-scripts', 180, 120),
    });
  } finally {
    rmlui.shutdown();
    window.close();
  }
}

if (process.argv[2]) {
  run(process.argv[2]).catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
} else {
  let failures = 0;
  for (const name of Object.keys(cases)) {
    const result = spawnSync(
      process.execPath, [ '--expose-gc', __filename, name ], {
        encoding: 'utf8', timeout: 20000,
      });
    if (result.status !== 0) {
      ++failures;
      console.error(`FAIL ${name}: ${result.signal ?? result.status}`,
        result.error ?? '', result.stdout, result.stderr);
    } else {
      console.log(`PASS ${name}`);
    }
  }
  assert.equal(failures, 0, `${failures} Lua script failures`);
}
