import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import ts from 'typescript';
import { locales, rootDir } from './content.mjs';

const packageDir = resolve(rootDir, 'packages/sfml.js-rmlui');
const entry = resolve(packageDir, 'src/index.ts');
const configPath = resolve(packageDir, 'tsconfig.json');
const config = ts.readConfigFile(configPath, ts.sys.readFile);
const parsed = ts.parseJsonConfigFileContent(
  config.config, ts.sys, packageDir
);
// Emit the current public declarations in memory. Neither dist nor a separate
// build tree is written, and stale on-disk declarations cannot hide a mismatch.
const declarations = new Map();
const sourceProgram = ts.createProgram(parsed.fileNames, {
  ...parsed.options,
  emitDeclarationOnly: true,
});
assert.deepEqual(
  ts.getPreEmitDiagnostics(sourceProgram).map(diagnostic =>
    ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')),
  [],
  'The package must type-check before validating its documentation'
);
sourceProgram.emit(undefined, (filename, text) => {
  declarations.set(filename, text);
});
const checker = sourceProgram.getTypeChecker();
const exported = new Set(checker.getExportsOfModule(
  checker.getSymbolAtLocation(sourceProgram.getSourceFile(entry))
).filter(symbol => {
  // TypeScript represents symbol categories as native bit flags.
  // eslint-disable-next-line no-bitwise
  const target = symbol.flags & ts.SymbolFlags.Alias
    ? checker.getAliasedSymbol(symbol) : symbol;
  // eslint-disable-next-line no-bitwise
  return target.flags & ts.SymbolFlags.Value;
}).map(symbol => symbol.name));
const rmluiEntry = resolve(packageDir, 'dist/index');
const sfmlEntry = resolve(rootDir, 'packages/sfml.js/dist/index');

// Guides deliberately show fragments after successful setup. These ambient
// values use real exported types; no arbitrary host member is typed as any.
// Nullable setup results are checked in the runnable examples, while this
// suite verifies names, overloads and argument/result shapes of the fragments.
const ambient = {
  rmlui: 'typeof RmlUi',
  rml: 'typeof RmlUi',
  sfml: 'typeof SFML',
  context: 'RmlUi.Context',
  host: 'RmlUi.Context',
  application: 'RmlUi.Context',
  element: 'RmlUi.Element',
  document: 'RmlUi.Document',
  parent: 'RmlUi.Element',
  counter: 'RmlUi.Element',
  button: 'RmlUi.Element',
  panel: 'RmlUi.Element',
  input: 'RmlUi.ElementFormControlInput',
  tabs: 'RmlUi.ElementTabSet',
  window: 'SFML.RenderWindow',
  renderWindow: 'SFML.RenderWindow',
  systemWindow: 'SFML.RenderWindow',
  elements: 'RmlUi.Element[]',
  model: 'RmlUi.DataModelConstructor',
  types: 'RmlUi.DataTypeRegister',
  item: 'RmlUi.DataStructHandle',
  number: 'RmlUi.DataSchema',
  expressions: 'string[]',
  values: 'Float64Array',
  elapsedSeconds: 'number',
  manager: 'RmlUi.RenderManager',
  geometry: 'RmlUi.Geometry',
  engine: 'RmlUi.FontEngineInterface',
  face: 'RmlUi.FontFaceHandle',
  shaping: 'RmlUi.TextShapingContext',
  lua: 'RmlUi.LuaScriptHost',
  filters: 'RmlUi.FilterList',
  onClick: 'RmlUi.RmlEventListener',
};

function prepareSnippet(code, javascript, imports = new Map()) {
  const rewritten = code
    .replace(/require\('sfml\.js-rmlui'\)/g, 'RmlUi')
    .replace(/require\('sfml\.js'\)/g, 'SFML')
    .replace(/from 'sfml\.js-rmlui'/g, `from '${rmluiEntry}'`)
    .replace(/import\('sfml\.js-rmlui'\)/g, `import('${rmluiEntry}')`);
  const ast = ts.createSourceFile(
    'snippet.ts', rewritten, ts.ScriptTarget.Latest, true
  );
  const declared = new Set();
  const referenced = new Set();
  function collect(node) {
    if (ts.isIdentifier(node)) {
      referenced.add(node.text);
    }
    if (ts.isVariableDeclaration(node) || ts.isFunctionDeclaration(node) ||
        ts.isClassDeclaration(node)) {
      if (node.name && ts.isIdentifier(node.name)) {
        declared.add(node.name.text);
      }
      if (node.name && ts.isObjectBindingPattern(node.name)) {
        for (const binding of node.name.elements) {
          declared.add(binding.name.text);
        }
      }
    }
    const bindings = node.importClause?.namedBindings;
    if (ts.isImportDeclaration(node) && bindings &&
        ts.isNamespaceImport(bindings)) {
      declared.add(bindings.name.text);
    }
    ts.forEachChild(node, collect);
  }
  collect(ast);
  const prelude = [
    javascript ? `const RmlUi = require('${rmluiEntry}');`
      : `import * as RmlUi from '${rmluiEntry}';`,
    javascript ? `const SFML = require('${sfmlEntry}');`
      : `import * as SFML from '${sfmlEntry}';`,
    ...Object.entries(ambient)
      .filter(([ name ]) => referenced.has(name) && !declared.has(name))
      .map(([ name, type ]) => (javascript
        ? `/** @type {${type}} */ let ${name};`
        : `declare const ${name}: ${type};`)),
    ...[ ...imports ].filter(([ name ]) => !declared.has(name))
      .map(([ alias, { name, namespace }]) =>
        `const { ${name}: ${alias} } = ${namespace};`),
    ...[ ...exported ].filter(name => referenced.has(name) &&
      !declared.has(name) && !imports.has(name) && !ambient[name])
      .map(name => `const { ${name} } = RmlUi;`),
    ...(javascript ? [ 'export {};' ] : []),
  ];
  return {
    content: prelude.join('\n') + '\n' + rewritten,
    preludeLines: prelude.length,
    javascript,
  };
}

function checkSnippets(snippets) {
  const options = {
    target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.NodeJs,
    strict: true,
    noImplicitAny: false,
    strictNullChecks: false,
    noEmit: true,
    allowJs: true,
    checkJs: true,
    skipLibCheck: true,
    lib: [ 'lib.es2020.d.ts', 'lib.es2021.weakref.d.ts' ],
    typeRoots: [ resolve(packageDir, 'node_modules/@types') ],
    types: [ 'node' ],
  };
  const files = new Map(snippets.map((snippet, index) => [
    resolve(packageDir, 'dist',
      `__documentation-${index}.${snippet.javascript ? 'js' : 'ts'}`),
    snippet,
  ]));
  const host = ts.createCompilerHost(options);
  const read = host.readFile.bind(host);
  const exists = host.fileExists.bind(host);
  host.readFile = filename =>
    files.get(filename)?.content ?? declarations.get(filename) ??
    read(filename);
  host.fileExists = filename =>
    files.has(filename) || declarations.has(filename) || exists(filename);
  host.getSourceFile = (filename, languageVersion) => {
    const content = host.readFile(filename);
    return content === undefined ? undefined
      : ts.createSourceFile(filename, content, languageVersion, true);
  };
  const program = ts.createProgram([ ...files.keys() ], options, host);
  return ts.getPreEmitDiagnostics(program).map(diagnostic => {
    const snippet = files.get(diagnostic.file?.fileName);
    const position = diagnostic.file && diagnostic.start !== undefined
      ? diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start).line
      : 0;
    return {
      code: diagnostic.code,
      message: `${snippet?.source || diagnostic.file?.fileName}:${
        (snippet?.line || 1) + position - (snippet?.preludeLines || 0)
      } ${ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')}`,
    };
  });
}

test('snippet checks reject invented APIs and wrong arguments', () => {
  const failures = checkSnippets([
    prepareSnippet('element.missingNativeMethod();', true),
    prepareSnippet('element.animate("width", 3, false);', true),
  ]);
  assert.ok(failures.some(failure => failure.code === 2339));
  assert.ok(failures.some(failure => failure.code === 2345));
});

test('all four-language RmlUi guide snippets match the public API', () => {
  const sources = [
    ...readdirSync(resolve(rootDir, 'docs/rmlui'))
      .filter(name => name.endsWith('.md'))
      .map(name => `docs/rmlui/${name}`),
    ...locales.flatMap(locale => [
      `packages/sfml.js-rmlui/README${locale.suffix}.md`,
      `packages/sfml.js-rmlui/examples/README${locale.suffix}.md`,
    ]),
  ];
  const snippets = sources.flatMap(source => {
    const markdown = readFileSync(resolve(rootDir, source), 'utf8');
    const fences = [ ...markdown.matchAll(
      /^```(js|javascript|ts|typescript)\s*\n([\s\S]*?)^```/gm
    ) ];
    const imports = new Map();
    for (const fence of fences) {
      for (const match of fence[2].matchAll(
        /const\s+\{([^}]+)\}\s*=\s*require\('(sfml\.js(?:-rmlui)?)'\);/g
      )) {
        for (const binding of match[1].split(',')) {
          const [ name, alias = name ] = binding.trim().split(/\s*:\s*/);
          if (name) {
            imports.set(alias, {
              name, namespace: match[2] === 'sfml.js' ? 'SFML' : 'RmlUi',
            });
          }
        }
      }
    }
    return fences.map(fence => ({
      ...prepareSnippet(fence[2],
        [ 'js', 'javascript' ].includes(fence[1]), imports),
      source,
      line: markdown.slice(0, fence.index).split('\n').length + 1,
    }));
  });
  assert.ok(snippets.length > 0, 'No documentation snippets were collected');
  assert.deepEqual(checkSnippets(snippets).map(failure => failure.message), []);
});
