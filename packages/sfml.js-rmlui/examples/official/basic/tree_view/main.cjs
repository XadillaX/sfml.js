'use strict';

// Application port of Samples/basic/tree_view/src/FileBrowser.cpp.
const fs = require('node:fs');
const path = require('node:path');
const { liveFields } = require('../data_binding/data-storage.cjs');

function buildTree(directory, depth, files) {
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  // PlatformExtensions uses alphasort in the C default locale on POSIX.
  // Visit directories first, recursively, then files; skip symlinks.
  if (process.platform !== 'win32') {
    entries.sort((a, b) =>
      Buffer.compare(Buffer.from(a.name), Buffer.from(b.name)));
  }
  function add(entry) {
    files.push({
      visible: depth === 0, directory: entry.isDirectory(),
      collapsed: true, depth, name: entry.name,
    });
  }
  for (const entry of entries) {
    if (entry.isDirectory()) {
      add(entry);
      buildTree(path.join(directory, entry.name), depth + 1, files);
    }
  }
  for (const entry of entries) {
    if (entry.isFile()) {
      add(entry);
    }
  }
}

function createTreeView(context, rootDirectory) {
  const data = [];
  buildTree(rootDirectory, 0, data);
  const model = context.createDataModel('filebrowser');
  const types = model.getDataTypeRegister();
  const text = types.registerScalar('FileText', 'string');
  const boolean = types.registerScalar('FileBool', 'bool');
  const integer = types.registerScalar('FileInt', 'int32');
  const file = types.registerStruct('File');
  const fields = [ 'visible', 'directory', 'collapsed', 'depth', 'name' ];
  for (const name of fields) {
    const schema = name === 'name' ? text
      : (name === 'depth' ? integer : boolean);
    file.registerMember(name, schema);
  }
  const list = types.registerArray('Files', file);
  model.bind('files', data, list);
  const variable = model.getVariable('files');
  const files = Array.from({ length: variable.size }, (_, index) =>
    liveFields(variable.child(index), fields));
  model.bindEventCallback('toggle_expand', (handle, _event, args) => {
    if (!args.length) {
      return;
    }
    const index = Math.trunc(Number(args[0]));
    const entry = files[index];
    if (!entry) {
      return;
    }
    const collapsing = !entry.collapsed;
    const depth = entry.depth;
    entry.collapsed = collapsing;
    for (let i = index + 1; i < files.length && files[i].depth > depth; ++i) {
      files[i].visible = !collapsing && files[i].depth === depth + 1;
      files[i].collapsed = true;
    }
    handle.dirtyVariable('files');
  });
  const document = context.loadDocument('basic/tree_view/data/tree_view.rml');
  document.getElementById('title').innerRML = document.title;
  document.show();
  return { model, document, files };
}

module.exports = { createTreeView };
