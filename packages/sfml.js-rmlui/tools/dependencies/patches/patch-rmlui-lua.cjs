'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');

function replaceExact(source, before, after, file) {
  if (source.includes(after)) {
    return source;
  }
  if (source.split(before).length !== 2) {
    throw new Error(`RmlUi Lua patch mismatch: ${file}: ` +
      `${JSON.stringify(before.slice(0, 120))}`);
  }
  return source.replace(before, after);
}

function replaceSection(source, start, end, replacement, file) {
  if (source.includes(replacement)) {
    return source;
  }
  const first = source.indexOf(start);
  const last = source.indexOf(end, first + start.length);
  if (first < 0 || last < 0 ||
      source.indexOf(start, first + start.length) >= 0) {
    throw new Error(`RmlUi Lua section mismatch: ${file}`);
  }
  return source.slice(0, first) + replacement + source.slice(last);
}

/**
 * Adapt pinned Lua types without installing its process-global instancers.
 * @param {string} root Extracted RmlUi source tree.
 */
async function patchRmlUiLua(root) {
  const sources = new Map();
  const edit = async (file, transform) => {
    const full = path.join(root, file);
    const existing = sources.get(full) ?? await fs.readFile(full, 'utf8');
    // Upgrade includes from an already patched, earlier package layout.
    const source = existing
      .replace(/native\/rmlui-lua-([a-z]+)\.h/g,
        'native/scripting/lua/rmlui-lua-$1.h')
      .replace(/native\/rmlui-script-host\.h/g,
        'native/scripting/rmlui-script-host.h')
      .replace(/native\/rmlui-state\.h/g,
        'native/runtime/rmlui-state.h');

    sources.set(full, transform(source, file));
  };
  await edit('Include/RmlUi/Lua/Interpreter.h', (source, file) =>
    replaceExact(source, '#include <RmlUi/Core/Types.h>',
      '#include <RmlUi/Core/Types.h>\n\n' +
      '// Keep the Lua API name when windows.h defines LoadString.\n' +
      '#ifdef LoadString\n' +
      '\t#undef LoadString\n' +
      '#endif', file));
  await edit('Source/Lua/LuaDataModel.cpp', (source, file) => {
    const replacement = [
      '#include "LuaDataModel.h"',
      '#include <native/scripting/lua/rmlui-lua-model.h>',
      '',
      'namespace Rml {',
      'namespace Lua {',
      'bool OpenLuaDataModel(lua_State* L, Context* context,',
      '\tint name_index, int table_index)',
      '{',
      '\treturn sfmlrmlui::OpenLuaModel(L, context, name_index, table_index);',
      '}',
      'void CloseLuaDataModel(lua_State* L, Context* context, int name_index)',
      '{',
      '\tsfmlrmlui::CloseLuaModel(L, context, name_index);',
      '}',
      '} // namespace Lua',
      '} // namespace Rml',
      '',
    ].join('\n');
    if (source === replacement) {
      return source;
    }
    if (!source.startsWith('#include "LuaDataModel.h"\n') ||
        !source.includes('struct LuaDataModel {') ||
        !source.includes('context->RemoveDataModel(name);')) {
      throw new Error(`RmlUi Lua model patch mismatch: ${file}`);
    }
    return replacement;
  });
  await edit('Source/Core/Context.cpp', (source, file) => {
    source = replaceExact(source, '#include "DataModel.h"',
      '#include "DataModel.h"\n' +
      '#include <native/scripting/lua/rmlui-lua-model.h>', file);
    source = replaceExact(source,
      '\tfor (const auto& pair : data_models)\n' +
      '\t\tPluginRegistry::NotifyDataModelDestroy(this, pair.first);\n' +
      '\tdata_models.clear();',
      '\tfor (const auto& pair : data_models)\n\t{\n' +
      '\t\tsfmlrmlui::InvalidateLuaModel(this, pair.second.get());\n' +
      '\t\tPluginRegistry::NotifyDataModelDestroy(this, pair.first);\n' +
      '\t}\n\tdata_models.clear();\n' +
      '\tsfmlrmlui::ReleaseLuaContextModels(this);', file);
    return replaceExact(source,
      '\tPluginRegistry::NotifyDataModelDestroy(this, it->first);\n\n' +
      '\tdata_models.erase(it);',
      '\tsfmlrmlui::InvalidateLuaModel(this, model);\n' +
      '\tPluginRegistry::NotifyDataModelDestroy(this, it->first);\n\n' +
      '\tdata_models.erase(it);\n' +
      '\tsfmlrmlui::ReleaseLuaModel(this, model);', file);
  });
  await edit('Include/RmlUi/Core/Element.h', (source, file) =>
    replaceExact(source, '\tvoid SetInstancer(ElementInstancer* instancer);',
      '\tvoid SetInstancer(ElementInstancer* instancer);\n' +
      '\t// Managed delegation preserves the original allocator separately.\n' +
      '\tvoid ReplaceInstancerForBinding(ElementInstancer* replacement)\n' +
      '\t{ instancer = replacement; }\n' +
      '\tElementInstancer* GetInstancerForBinding() const\n' +
      '\t{ return instancer; }', file));
  await edit('Source/Lua/ElementInstancer.cpp', (source, file) => {
    source = replaceExact(source, '#include "ElementInstancer.h"',
      '#include "ElementInstancer.h"\n' +
      '#include <native/scripting/lua/rmlui-lua-instancer.h>', file);
    source = replaceSection(source, 'int ElementInstancernew(',
      '// setter', [
        'int ElementInstancernew(lua_State* L)',
        '{',
        '\treturn sfmlrmlui::CreateLuaElementInstancer(L);',
        '}',
        '',
      ].join('\n'), file);
    return replaceSection(source, 'int ElementInstancerSetAttrInstanceElement(',
      'RegType<ElementInstancer> ElementInstancerMethods[]', [
        'int ElementInstancerSetAttrInstanceElement(lua_State* L)',
        '{',
        '\treturn sfmlrmlui::SetLuaElementInstancer(L);',
        '}',
        '',
      ].join('\n'), file);
  });
  await edit('Include/RmlUi/Lua/LuaType.h', (source, file) =>
    replaceExact(source, '#include "IncludeLua.h"',
      '#include "IncludeLua.h"\n' +
      '#include <native/scripting/lua/rmlui-lua-object.h>', file));
  await edit('Include/RmlUi/Lua/LuaType.inl', (source, file) => {
    const signature = name =>
      `\ttemplate <typename T>\n\t${name}`;
    source = replaceSection(source, signature('int LuaType<T>::push('),
      '\t// private members', [
        '\ttemplate <typename T>',
        '\tint LuaType<T>::push(lua_State* L, T* obj, bool gc)',
        '\t{',
        '\t\treturn sfmlrmlui::PushTypedLuaObject(',
        '\t\t\tL, obj, GetTClassName<T>(), gc);',
        '\t}',
        '',
        '\ttemplate <typename T>',
        '\tT* LuaType<T>::check(lua_State* L, int narg)',
        '\t{',
        '\t\treturn sfmlrmlui::CheckTypedLuaObject<T>(',
        '\t\t\tL, narg, GetTClassName<T>());',
        '\t}',
        '',
      ].join('\n'), file);
    source = replaceSection(source, signature('int LuaType<T>::gc_T('),
      signature('int LuaType<T>::tostring_T('), [
        '\ttemplate <typename T>',
        '\tint LuaType<T>::gc_T(lua_State* L)',
        '\t{',
        '\t\treturn sfmlrmlui::CollectLuaObject(L);',
        '\t}',
        '',
      ].join('\n'), file);
    source = replaceSection(source, signature('int LuaType<T>::tostring_T('),
      signature('int LuaType<T>::eq_T('), [
        '\ttemplate <typename T>',
        '\tint LuaType<T>::tostring_T(lua_State* L)',
        '\t{',
        '\t\tT* obj = check(L, 1);',
        '\t\tchar buffer[max_pointer_string_size];',
        '\t\tsnprintf(buffer, sizeof(buffer), "%p", static_cast<void*>(obj));',
        '\t\tlua_pushfstring(L, "%s (%s)", GetTClassName<T>(), buffer);',
        '\t\treturn 1;',
        '\t}',
        '',
      ].join('\n'), file);
    source = replaceExact(source,
      '\t\tlua_remove(L, 1);     // remove self so member function args ' +
        'start at index 1',
      '\t\tsfmlrmlui::LuaAccessScope scope(L, 1,\n' +
      '\t\t\tstatic_cast<RegType*>(lua_touserdata(L, ' +
      'lua_upvalueindex(1)))->name, false);\n' +
      '\t\tlua_remove(L, 1);     // remove self so member function args ' +
      'start at index 1', file);
    source = replaceSection(source, signature('int LuaType<T>::thunk('),
      signature('void LuaType<T>::tostring('), [
        '\ttemplate <typename T>',
        '\tint LuaType<T>::thunk(lua_State* L)',
        '\t{',
        '\t\tT* obj = check(L, 1);',
        '\t\tif (obj == nullptr)',
        '\t\t{',
        '\t\t\tlua_pushnil(L);',
        '\t\t\treturn 1;',
        '\t\t}',
        '\t\tsfmlrmlui::LuaAccessScope scope(L, 1,',
        '\t\t\tstatic_cast<RegType*>(lua_touserdata(L, ' +
          'lua_upvalueindex(1)))->name, false);',
        '\t\tlua_remove(L, 1);     // remove self so member function args ' +
          'start at index 1',
        '\t\tRegType* method = static_cast<RegType*>(',
        '\t\t\tlua_touserdata(L, lua_upvalueindex(1)));',
        '\t\treturn method->func(L, obj);',
        '\t}',
        '',
      ].join('\n'), file);
    source = replaceExact(source,
      '\t\treturn LuaTypeImpl::index(L, class_name);',
      '\t\tsfmlrmlui::LuaAccessScope scope(L, 1, "index", false);\n' +
      '\t\treturn LuaTypeImpl::index(L, class_name);', file);
    return replaceExact(source,
      '\t\treturn LuaTypeImpl::newindex(L, class_name);',
      '\t\tsfmlrmlui::LuaAccessScope scope(L, 1, "newindex", true);\n' +
      '\t\treturn LuaTypeImpl::newindex(L, class_name);', file);
  });
  await edit('Source/Lua/LuaPlugin.h', (source, file) =>
    replaceExact(source, '\tstatic lua_State* GetLuaState();',
      '\tstatic lua_State* GetLuaState();\n' +
      '\tstatic void RegisterTypesForBinding(lua_State* state);', file));
  await edit('Source/Lua/LuaPlugin.cpp', (source, file) => {
    source = replaceExact(source, 'static void RegisterTypes();',
      '// Managed hosts register each actual state explicitly.', file);
    source = replaceExact(source, '\tRegisterTypes();',
      '\tRegisterTypesForBinding(g_L);', file);
    source = replaceExact(source, 'static void RegisterTypes()\n{\n' +
      '\tRMLUI_ASSERT(g_L);\n\tlua_State* L = g_L;',
    'void LuaPlugin::RegisterTypesForBinding(lua_State* L)\n{\n' +
      '\tRMLUI_ASSERT(L);', file);
    source = replaceExact(source, '#include "LuaPlugin.h"',
      '#include "LuaPlugin.h"\n' +
      '#include <native/scripting/lua/rmlui-lua-host.h>', file);
    return replaceExact(source, '\treturn g_L;',
      '\treturn sfmlrmlui::CurrentLuaState() ? ' +
      'sfmlrmlui::CurrentLuaState() : g_L;', file);
  });
  await edit('Source/Lua/Element.cpp', (source, file) => {
    source = replaceExact(source, '#include "LuaEventListener.h"',
      '#include "LuaEventListener.h"\n' +
      '#include <native/scripting/lua/rmlui-lua-host.h>',
      file);
    source = replaceExact(source,
      '#include <native/scripting/lua/rmlui-lua-host.h>',
      '#include <native/scripting/lua/rmlui-lua-host.h>\n' +
      '#include <native/runtime/rmlui-state.h>', file);
    const previousGuard =
      '\tif (sfmlrmlui::LuaStateIsClosing())\n' +
      '\t\treturn luaL_error(L, "Lua state is closing");\n' +
      '\tElement* ele = new Element(tag);';
    const constructor = source.includes(previousGuard)
      ? previousGuard : '\tElement* ele = new Element(tag);';
    source = replaceExact(source, constructor,
      '\tconst auto& runtime = sfmlrmlui::State();\n' +
      '\tif (sfmlrmlui::LuaStateIsClosing() ||\n' +
      '\t\truntime.stream_callback_depth || ' +
      'runtime.system_callback_depth ||\n' +
      '\t\truntime.plugin_callback_depth || runtime.value_callback_depth ||\n' +
      '\t\truntime.parser_callback_depth || ' +
      'runtime.effect_callback_depth ||\n' +
      '\t\truntime.texture_callback_depth)\n' +
      '\t\treturn luaL_error(L, ' +
      '"Lua element construction is not allowed in this callback");\n' +
      '\tElement* ele = new Element(tag);', file);
    source = replaceSection(source, 'int ElementAddEventListener(',
      'int ElementAppendChild(', [
        'int ElementAddEventListener(lua_State* L, Element* obj)',
        '{',
        '\tconst char* name = luaL_checkstring(L, 1);',
        '\tconst bool capture = lua_gettop(L) > 2 ? ' +
          'RMLUI_CHECK_BOOL(L, 3) : false;',
        '\tauto* listener = sfmlrmlui::CreateLuaListener(L, 2, obj);',
        '\tif (listener)',
        '\t\tobj->AddEventListener(name, listener, capture);',
        '\treturn 0;',
        '}',
        '',
      ].join('\n'), file);
    source = replaceSection(source, 'int ElementDispatchEvent(',
      'int ElementFocus(', [
        'int ElementDispatchEvent(lua_State* L, Element* obj)',
        '{',
        '\tconst char* event = luaL_checkstring(L, 1);',
        '\tluaL_checktype(L, 2, LUA_TTABLE);',
        '\tDictionary params;',
        '\tlua_pushnil(L);',
        '\twhile (lua_next(L, 2))',
        '\t{',
        '\t\tif (lua_type(L, -2) != LUA_TSTRING)',
        '\t\t\treturn luaL_error(L, "Expected event parameter string keys");',
        '\t\tsize_t length = 0;',
        '\t\tconst char* key = lua_tolstring(L, -2, &length);',
        '\t\tGetVariant(L, -1, &params[String(key, length)]);',
        '\t\tlua_pop(L, 1);',
        '\t}',
        '\tobj->DispatchEvent(event, params);',
        '\treturn 0;',
        '}',
        '',
      ].join('\n'), file);
    for (const name of [ 'element', 'inserted' ]) {
      source = source.replaceAll(`\tif (*${name})`,
        `\tif (${name} && *${name})`);
    }
    source = replaceExact(source,
      '\tElement* element = LuaType<Element>::check(L, 1);\n' +
      '\tlua_pushboolean(L, static_cast<bool>(obj->RemoveChild(element)));',
      '\tElement* element = LuaType<Element>::check(L, 1);\n' +
      '\tif (!element || element->GetParentNode() != obj)\n' +
      '\t\treturn luaL_error(L, "Expected a direct child");\n' +
      '\tsfmlrmlui::RequireLuaChildMutation(L, obj);\n' +
      '\tlua_pushboolean(L, static_cast<bool>(obj->RemoveChild(element)));',
      file);
    source = replaceExact(source,
      '\tElement* adjacent = LuaType<Element>::check(L, 2);',
      '\tElement* adjacent = LuaType<Element>::check(L, 2);\n' +
      '\tif (!adjacent || adjacent->GetParentNode() != obj)\n' +
      '\t\treturn luaL_error(L, "Expected a direct adjacent child");', file);
    source = replaceExact(source,
      '\tElement* replaced = LuaType<Element>::check(L, 2);',
      '\tElement* replaced = LuaType<Element>::check(L, 2);\n' +
      '\tif (!replaced || replaced->GetParentNode() != obj)\n' +
      '\t\treturn luaL_error(L, "Expected a direct replaced child");\n' +
      '\tsfmlrmlui::RequireLuaChildMutation(L, obj);', file);
    source = replaceExact(source,
      '\tobj->SetAttribute(name, String(value));',
      '\tsfmlrmlui::RequireLuaChildMutation(L, obj);\n' +
      '\tobj->SetAttribute(name, String(value));', file);
    source = replaceExact(source, '\tobj->RemoveAttribute(name);',
      '\tsfmlrmlui::RequireLuaChildMutation(L, obj);\n' +
      '\tobj->RemoveAttribute(name);', file);
    source = replaceExact(source,
      '\tele->SetInnerRML(rml);',
      '\tsfmlrmlui::RequireLuaChildMutation(L, ele);\n' +
      '\tele->SetInnerRML(rml);', file);
    return source;
  });
  await edit('Source/Lua/Context.cpp', (source, file) => {
    source = replaceExact(source, '#include "LuaEventListener.h"',
      '#include "LuaEventListener.h"\n' +
      '#include <native/scripting/lua/rmlui-lua-host.h>',
      file);
    source = replaceExact(source, '\tobj->UnloadDocument(doc);',
      '\tif (!doc || doc->GetContext() != obj)\n' +
      '\t\treturn luaL_error(L, ' +
      '"Expected a document owned by this context");\n' +
      '\tobj->UnloadDocument(doc);', file);
    source = replaceExact(source, '\tcont->SetDimensions(*dim);',
      '\tif (!dim)\n' +
      '\t\treturn luaL_error(L, "Expected Vector2i dimensions");\n' +
      '\tcont->SetDimensions(*dim);', file);
    return replaceSection(source, 'int ContextAddEventListener(',
      'int ContextCreateDocument(', [
        'int ContextAddEventListener(lua_State* L, Context* obj)',
        '{',
        '\tconst char* name = luaL_checkstring(L, 1);',
        '\tElement* element = lua_isnoneornil(L, 3) ? nullptr : ' +
          'LuaType<Element>::check(L, 3);',
        '\tconst bool capture = lua_isnoneornil(L, 4) ? false : ' +
          'RMLUI_CHECK_BOOL(L, 4);',
        '\tauto* listener = sfmlrmlui::CreateLuaListener(L, 2,',
        '\t\telement ? element : obj->GetRootElement());',
        '\tif (listener)',
        '\t{',
        '\t\tif (element)',
        '\t\t\telement->AddEventListener(name, listener, capture);',
        '\t\telse',
        '\t\t\tobj->AddEventListener(name, listener, capture);',
        '\t}',
        '\treturn 0;',
        '}',
        '',
      ].join('\n'), file);
  });
  await edit('Source/Lua/Utilities.cpp', (source, file) => {
    source = replaceExact(source, '#include <RmlUi/Lua/Utilities.h>',
      '#include <RmlUi/Lua/Utilities.h>\n' +
      '#include <native/scripting/lua/rmlui-lua-variant.h>', file);
    source = replaceExact(source,
      '#include <native/scripting/lua/rmlui-lua-variant.h>',
      '#include <native/scripting/lua/rmlui-lua-variant.h>\n' +
      '#include <limits>', file);
    source = replaceExact(source, '\tlua_pushinteger(L, index + 1);',
      '\tstatic_assert(std::numeric_limits<lua_Integer>::digits >\n' +
      '\t\tstd::numeric_limits<int>::digits);\n' +
      '\tlua_pushinteger(L, static_cast<lua_Integer>(index) + 1);', file);
    source = replaceExact(source,
      '\treturn (int)luaL_checkinteger(L, index) - 1;',
      '\tconst lua_Integer value = luaL_checkinteger(L, index);\n' +
      '\tconstexpr lua_Integer minimum =\n' +
      '\t\tstatic_cast<lua_Integer>(std::numeric_limits<int>::min()) + 1;\n' +
      '\tconstexpr lua_Integer maximum =\n' +
      '\t\tstatic_cast<lua_Integer>(std::numeric_limits<int>::max()) + 1;\n' +
      '\tif (value < minimum || value > maximum)\n' +
      '\t\treturn luaL_error(L, "RmlUi index out of range");\n' +
      '\treturn static_cast<int>(value - 1);', file);
    source = replaceExact(source,
      'case Variant::VOIDPTR: lua_pushlightuserdata(L, ' +
        'var->Get<void*>()); break;',
      'case Variant::VOIDPTR: lua_pushnil(L); break;', file);
    source = replaceExact(source,
      'case LUA_TNUMBER: *variant = lua_tonumber(L, index); break;',
      'case LUA_TNUMBER:\n' +
      '\t\tif (lua_isinteger(L, index))\n' +
      '\t\t\t*variant = static_cast<int64_t>(lua_tointeger(L, index));\n' +
      '\t\telse\n\t\t\t*variant = lua_tonumber(L, index);\n\t\tbreak;', file);
    source = replaceExact(source,
      'case LUA_TSTRING: *variant = ' +
        'Rml::String(lua_tostring(L, index)); break;',
      'case LUA_TSTRING:\n\t{\n\t\tsize_t length = 0;\n' +
      '\t\tconst char* text = lua_tolstring(L, index, &length);\n' +
      '\t\t*variant = Rml::String(text, length);\n\t\tbreak;\n\t}', file);
    source = replaceExact(source,
      'case LUA_TLIGHTUSERDATA: *variant = lua_touserdata(L, index); break;',
      'case LUA_TLIGHTUSERDATA:\n\tcase LUA_TUSERDATA:\n' +
      '\t\tluaL_error(L, "Opaque Lua userdata cannot be an RmlUi Variant");\n' +
      '\t\tbreak;', file);
    source = replaceExact(source, '\tswitch (var->GetType())',
      '\tif (sfmlrmlui::PushManagedLuaVariant(L, *var))\n\t\treturn;\n\n' +
      '\tswitch (var->GetType())', file);
    return replaceExact(source, '\tswitch (lua_type(L, index))',
      '\tif (sfmlrmlui::ReadManagedLuaVariant(L, index, variant))\n' +
      '\t\treturn;\n\n\tswitch (lua_type(L, index))', file);
  });
  await edit('Source/Lua/Elements/As.h', (source, file) =>
    replaceExact(source, '\tLuaType<ToType>::push(L, (ToType*)ele, false);',
      '\tLuaType<ToType>::push(L, rmlui_dynamic_cast<ToType*>(ele), false);',
      file));
  await edit('Source/Lua/Interpreter.cpp', (source, file) => {
    source = replaceExact(source, '#include "LuaPlugin.h"',
      '#include "LuaPlugin.h"\n' +
      '#include <native/scripting/lua/rmlui-lua-host.h>\n' +
      '#include "../Core/StreamFile.h"', file);
    source = replaceSection(source, 'static int ErrorHandler(',
      'lua_State* Interpreter::GetLuaState()', [
        'static bool LuaCall(lua_State* L, int nargs, int nresults)',
        '{',
        '\treturn sfmlrmlui::ProtectedLuaCall(L, nargs, nresults);',
        '}',
        '',
      ].join('\n'), file);
    source = replaceSection(source, 'bool Interpreter::LoadFile(',
      'bool Interpreter::DoString(', [
        'bool Interpreter::LoadFile(const String& file)',
        '{',
        '\tlua_State* L = GetLuaState();',
        '\tRml::StreamFile stream;',
        '\tif (!stream.Open(file))',
        '\t{',
        '\t\tlua_pushfstring(L, "Failed to open Lua script: %s", ' +
          'file.c_str());',
        '\t\tsfmlrmlui::CaptureLuaError(L);',
        '\t\tlua_pop(L, 1);',
        '\t\treturn false;',
        '\t}',
        '\tString code(stream.Length(), \'\\0\');',
        '\tif (stream.Read(code.data(), code.size()) != code.size() ||',
        '\t\tstream.HasReadError())',
        '\t{',
        '\t\tlua_pushfstring(L, "Failed to read Lua script: %s", ' +
          'file.c_str());',
        '\t\tsfmlrmlui::CaptureLuaError(L);',
        '\t\tlua_pop(L, 1);',
        '\t\treturn false;',
        '\t}',
        '\treturn LoadString(code, "@" + file) && LuaCall(L, 0, 0);',
        '}',
        '',
      ].join('\n'), file);
    source = replaceExact(source,
      'luaL_loadbuffer(L, code.c_str(), code.length(), name.c_str())',
      'luaL_loadbufferx(L, code.data(), code.size(), name.c_str(), "t")',
      file);
    source = replaceSection(source, 'bool Interpreter::LoadString(',
      'void Interpreter::BeginCall(', [
        'bool Interpreter::LoadString(const String& code, const String& name)',
        '{',
        '\tlua_State* L = GetLuaState();',
        '',
        '\tif (luaL_loadbufferx(L, code.data(), code.size(), ' +
          'name.c_str(), "t") != 0)',
        '\t{',
        '\t\tsfmlrmlui::CaptureLuaError(L);',
        '\t\tlua_pop(L, 1);',
        '\t\treturn false;',
        '\t}',
        '\treturn true;',
        '}',
        '',
      ].join('\n'), file);
    return replaceExact(source, '\tlua_settop(L, 0); // empty stack',
      '\t// Preserve any outer native/Lua call frame.', file);
  });
  await edit('Source/Lua/RmlUi.cpp', (source, file) => {
    source = replaceExact(source, '#include "LuaElementInstancer.h"',
      '#include "LuaElementInstancer.h"\n' +
      '#include <native/scripting/lua/rmlui-lua-instancer.h>', file);
    source = replaceExact(source, '#include "RmlUiContextsProxy.h"',
      '#include "RmlUiContextsProxy.h"\n' +
      '#include <native/scripting/lua/rmlui-lua-host.h>\n' +
      '#include <native/scripting/rmlui-script-host.h>\n' +
      '#include <native/runtime/rmlui-state.h>', file);
    source = replaceExact(source,
      'int LuaRmlUiCreateContext(lua_State* L, LuaRmlUi* /*obj*/)\n{',
      'static void CheckGlobalMutation(lua_State* L)\n{\n' +
      '\tif (sfmlrmlui::LuaStateIsClosing() ||\n' +
      '\t\tsfmlrmlui::State().callback_depth)\n' +
      '\t\tluaL_error(L, ' +
      '"Lua global mutation is not allowed in a callback");\n' +
      '}\n\n' +
      'int LuaRmlUiCreateContext(lua_State* L, LuaRmlUi* /*obj*/)\n{\n' +
      '\tCheckGlobalMutation(L);', file);
    source = replaceExact(source,
      'int LuaRmlUiLoadFontFace(lua_State* L, LuaRmlUi* /*obj*/)\n{',
      'int LuaRmlUiLoadFontFace(lua_State* L, LuaRmlUi* /*obj*/)\n{\n' +
      '\tCheckGlobalMutation(L);', file);
    source = replaceExact(source,
      '\t\tLuaType<Context>::push(L, new_context);',
      '\t\tsfmlrmlui::SelectContextLuaHost(new_context,\n' +
      '\t\t\tsfmlrmlui::FindLuaHost(L));\n' +
      '\t\tLuaType<Context>::push(L, new_context);', file);
    source = replaceSection(source, 'int LuaRmlUiRegisterTag(',
      'int LuaRmlUiGetAttrcontexts(', [
        'int LuaRmlUiRegisterTag(lua_State* L, LuaRmlUi* /*obj*/)',
        '{',
        '\treturn sfmlrmlui::RegisterLuaElementInstancer(L);',
        '}',
        '',
      ].join('\n'), file);
    source = replaceExact(source, 'LuaRmlUi lua_global_rmlui;',
      '// LuaRmlUi and its table references belong to the actual Lua state.',
      file);
    source = replaceExact(source,
      '\tluaL_getmetatable(L, GetTClassName<LuaRmlUi>());\n' +
      '\tLuaRmlUiEnumkey_identifier(L);\n' +
      '\tlua_global_rmlui.key_identifier_ref = luaL_ref(L, -2);\n' +
      '\tLuaRmlUiEnumkey_modifier(L);\n' +
      '\tlua_global_rmlui.key_modifier_ref = luaL_ref(L, -2);\n' +
      '\tLuaType<LuaRmlUi>::push(L, &lua_global_rmlui, false);',
      '\tauto* object = new LuaRmlUi();\n' +
      '\tluaL_getmetatable(L, GetTClassName<LuaRmlUi>());\n' +
      '\tLuaRmlUiEnumkey_identifier(L);\n' +
      '\tobject->key_identifier_ref = luaL_ref(L, -2);\n' +
      '\tLuaRmlUiEnumkey_modifier(L);\n' +
      '\tobject->key_modifier_ref = luaL_ref(L, -2);\n' +
      '\tLuaType<LuaRmlUi>::push(L, object, true);', file);
    source = replaceExact(source,
      '\tContext* new_context = CreateContext(name, *dimensions);\n' +
      '\tif (new_context == nullptr || dimensions == nullptr)',
      '\tContext* new_context = dimensions ? ' +
      'CreateContext(name, *dimensions) ' +
      ': nullptr;\n\tif (new_context == nullptr)', file);
    for (const attribute of [ 'key_identifier', 'key_modifier' ]) {
      source = replaceExact(source,
        `\tlua_rawgeti(L, -1, lua_global_rmlui.${attribute}_ref);`,
        '\tauto* object = LuaType<LuaRmlUi>::check(L, 1);\n' +
        `\tlua_rawgeti(L, -1, object->${attribute}_ref);`, file);
    }
    return source;
  });
  await edit('Include/RmlUi/Lua/Utilities.h', (source, file) =>
    replaceExact(source,
      '\t\tLuaType<ToType>::push(L, (ToType*)ele, false);',
      '\t\tLuaType<ToType>::push(L, rmlui_dynamic_cast<ToType*>(ele), false);',
      file));
  await edit('Source/Lua/Pairs.h', (source, file) =>
    replaceSection(source, 'template <typename T>\nstruct PairsHelper {',
      'template <class Container>\nint MakePairs(', [
        '// Convert native iterators while their container is live. The',
        '// returned Lua iterator owns a Lua value snapshot, no C++ iterator.',
        'inline int SnapshotPairsNext(lua_State* L)',
        '{',
        '\tlua_settop(L, 2);',
        '\treturn lua_next(L, 1) ? 2 : 0;',
        '}',
        '',
        'inline int FinishSnapshotPairs(lua_State* L)',
        '{',
        '\tlua_pushcfunction(L, SnapshotPairsNext);',
        '\tlua_insert(L, -2);',
        '\tlua_pushnil(L);',
        '\treturn 3;',
        '}',
        '',
        'template <class Iterator>',
        'int MakePairs(lua_State* L, const Iterator& first, ' +
          'const Iterator& last)',
        '{',
        '\tlua_newtable(L);',
        '\tfor (auto item = first; item != last; ++item)',
        '\t{',
        '\t\tconst int count = PairsConvertTolua(L, *item);',
        '\t\tif (count != 2)',
        '\t\t\treturn luaL_error(L, "Expected key/value snapshot");',
        '\t\tlua_rawset(L, -3);',
        '\t}',
        '\treturn FinishSnapshotPairs(L);',
        '}',
        '',
      ].join('\n'), file));
  await edit('Source/Lua/ElementStyleProxy.cpp', (source, file) => {
    source = replaceExact(source, '#include "ElementStyleProxy.h"',
      '#include "ElementStyleProxy.h"\n#include "Pairs.h"', file);
    return replaceSection(source, 'struct ElementStyleProxyPairs {',
      'RegType<ElementStyleProxy> ElementStyleProxyMethods[]', [
        'int ElementStyleProxy__pairs(lua_State* L)',
        '{',
        '\tauto* obj = LuaType<ElementStyleProxy>::check(L, 1);',
        '\tRMLUI_CHECK_OBJ(obj);',
        '\tlua_newtable(L);',
        '\tfor (auto view = obj->owner->IterateLocalProperties(nullptr);',
        '\t\t!view.AtEnd(); ++view)',
        '\t{',
        '\t\tconst auto& [key, property] = *view;',
        '\t\tString value;',
        '\t\tif (property.definition)',
        '\t\t\tproperty.definition->GetValue(value, property);',
        '\t\telse',
        '\t\t\tvalue = property.ToString();',
        '\t\tlua_pushlstring(L, key.c_str(), key.size());',
        '\t\tlua_pushlstring(L, value.c_str(), value.size());',
        '\t\tlua_rawset(L, -3);',
        '\t}',
        '\treturn FinishSnapshotPairs(L);',
        '}',
        '',
      ].join('\n'), file);
  });
  await edit('Source/Lua/Elements/SelectOptionsProxy.cpp', (source, file) =>
    replaceExact(source,
      '\t\tElement* opt = proxy->owner->GetOption(index - 1);',
      '\t\tsfmlrmlui::LuaAccessScope scope(L, 1, "index", false);\n' +
      '\t\tsfmlrmlui::RequireLuaChildMutation(L, proxy->owner);\n' +
      '\t\tElement* opt = proxy->owner->GetOption(index - 1);', file));
  for (const file of [
    'Source/Lua/Elements/ElementFormControlSelect.cpp',
    'Source/Lua/Elements/ElementTabSet.cpp',
    'Source/Lua/Elements/ElementFormControl.cpp',
  ]) {
    await edit(file, (source, target) => {
      if (source.includes('lua_State* /*L*/')) {
        source = source.replaceAll('lua_State* /*L*/', 'lua_State* L');
      }
      const calls = file.endsWith('ElementFormControlSelect.cpp')
        ? [
          'obj->Remove(index);', 'obj->RemoveAll();',
          'obj->SetSelection(selection);',
        ]
        : file.endsWith('ElementTabSet.cpp')
          ? [ 'obj->SetPanel(index, rml);', 'obj->SetTab(index, rml);' ]
          : [ 'efc->SetValue(value);' ];
      for (const call of calls) {
        const receiver = call.slice(0, call.indexOf('->'));
        source = replaceExact(source, `\t${call}`,
          `\tsfmlrmlui::RequireLuaChildMutation(L, ${receiver});\n\t${call}`,
          target);
      }
      return source;
    });
  }
  for (const [ file, source ] of sources) {
    if (await fs.readFile(file, 'utf8') !== source) {
      await fs.writeFile(file, source);
    }
  }
}

module.exports = { patchRmlUiLua };
