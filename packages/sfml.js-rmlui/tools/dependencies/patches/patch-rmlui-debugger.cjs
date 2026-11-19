'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');

function replaceExact(source, before, after, file) {
  if (source.includes(after)) {
    return source;
  }
  if (source.split(before).length !== 2) {
    throw new Error(`RmlUi Debugger patch mismatch: ${file}`);
  }

  return source.replace(before, after);
}

/**
 * Keep native allocators alive and clear the Debugger's Factory registrations.
 * @param {string} root Extracted pinned RmlUi source tree.
 */
async function patchRmlUiDebugger(root) {
  const edits = [
    [ 'Source/Debugger/ElementContextHook.cpp',
      '\tdebugger->Render();',
      '\tif (debugger && GetParentNode() &&\n' +
      '\t\tDebuggerPlugin::GetInstance() == debugger)\n' +
      '\t\tdebugger->Render();' ],
    [ 'Source/Debugger/Debugger.cpp',
      '\t\tdelete plugin;\n\t\treturn false;',
      '\t\tplugin->OnShutdown();\n\t\treturn false;' ],
    [ 'Source/Debugger/DebuggerPlugin.h',
      '\tUniquePtr<ElementInstancer> hook_element_instancer, ' +
      'debug_document_instancer, info_element_instancer, ' +
      'log_element_instancer,\n' +
      '\t\tdata_explorer_element_instancer;',
      [
        '\tElementInstancer* hook_element_instancer = nullptr;',
        '\tElementInstancer* debug_document_instancer = nullptr;',
        '\tElementInstancer* info_element_instancer = nullptr;',
        '\tElementInstancer* log_element_instancer = nullptr;',
        '\tElementInstancer* data_explorer_element_instancer = nullptr;',
      ].join('\n') ],
    [ 'Source/Debugger/DebuggerPlugin.cpp',
      'DebuggerPlugin* DebuggerPlugin::instance = nullptr;',
      [
        '// Factory entries and detached/deferred documents borrow allocators.',
        '// Stateless new/delete allocators outlive each plugin.',
        'template <typename T>',
        'static ElementInstancer* BorrowDebuggerInstancer()',
        '{',
        '\tstatic ElementInstancerGeneric<T> instancer;',
        '\treturn &instancer;',
        '}',
        '',
        'DebuggerPlugin* DebuggerPlugin::instance = nullptr;',
      ].join('\n') ],
    [ 'Source/Debugger/DebuggerPlugin.cpp',
      '\thook_element_instancer.reset();\n\n\tdelete this;',
      [
        '\t// Remove plugin registrations, preserving host replacements.',
        '\tconst Pair<const char*, ElementInstancer*> entries[] = {',
        '\t\t{"debug-hook", hook_element_instancer},',
        '\t\t{"debug-document", debug_document_instancer},',
        '\t\t{"debug-info", info_element_instancer},',
        '\t\t{"debug-log", log_element_instancer},',
        '\t\t{"debug-data-models", data_explorer_element_instancer},',
        '\t};',
        '\tfor (const auto& entry : entries)',
        '\t\tif (entry.second &&',
        '\t\t\tFactory::GetElementInstancer(entry.first) == entry.second)',
        '\t\t\tFactory::RegisterElementInstancer(entry.first, nullptr);',
        '',
        '\thook_element_instancer = nullptr;',
        '',
        '\tdelete this;',
      ].join('\n') ],
  ];

  for (const [ name, type, tag ] of [
    [ 'hook_element_instancer', 'ElementContextHook', 'debug-hook' ],
    [ 'debug_document_instancer', 'ElementDebugDocument', 'debug-document' ],
    [ 'info_element_instancer', 'ElementInfo', 'debug-info' ],
    [ 'log_element_instancer', 'ElementLog', 'debug-log' ],
    [ 'data_explorer_element_instancer', 'ElementDataModels',
      'debug-data-models' ],
  ]) {
    edits.push(
      [ 'Source/Debugger/DebuggerPlugin.cpp',
        `${name} = MakeUnique<ElementInstancerGeneric<${type}>>();`,
        `${name} = BorrowDebuggerInstancer<${type}>();` ],
      [ 'Source/Debugger/DebuggerPlugin.cpp',
        `Factory::RegisterElementInstancer("${tag}", ${name}.get());`,
        `Factory::RegisterElementInstancer("${tag}", ${name});` ]
    );
  }

  for (const [ file, before, after ] of edits) {
    const full = path.join(root, file);
    const source = await fs.readFile(full, 'utf8');
    const patched = replaceExact(source, before, after, file);

    if (patched !== source) {
      await fs.writeFile(full, patched);
    }
  }
}

module.exports = { patchRmlUiDebugger };
