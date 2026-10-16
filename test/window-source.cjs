'use strict';

// Load only the two window implementations from source, without emitting dist.
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const sources = new Map([
  [ '../dist/window/window.js', '../src/window/window.ts' ],
  [ '../dist/graphics/render-window.js', '../src/graphics/render-window.ts' ],
].map(([ output, source ]) =>
  [ path.resolve(__dirname, output), path.resolve(__dirname, source) ]));
const load = Module._extensions['.js'];
Module._extensions['.js'] = (module, filename) => {
  const source = sources.get(filename);
  if (!source) return load(module, filename);
  const { outputText } = ts.transpileModule(fs.readFileSync(source, 'utf8'), {
    compilerOptions: {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.CommonJS,
    },
    fileName: source,
  });
  module._compile(outputText, filename);
};
