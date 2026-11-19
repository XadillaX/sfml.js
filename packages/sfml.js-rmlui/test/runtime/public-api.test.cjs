'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const ts = require('typescript');
const rmlui = require('../../dist');

// Resolve value exports through the emitted declarations, including aliases.
// Type-only declarations must not be required as runtime objects.
const declaration = path.resolve(__dirname, '../../dist/index.d.ts');
const program = ts.createProgram([ declaration ], {
  target: ts.ScriptTarget.ES2020,
  module: ts.ModuleKind.CommonJS,
  moduleResolution: ts.ModuleResolutionKind.NodeJs,
  skipLibCheck: true,
});
const checker = program.getTypeChecker();
const source = program.getSourceFile(declaration);
assert.ok(source);
const moduleSymbol = checker.getSymbolAtLocation(source);
assert.ok(moduleSymbol);

const declared = checker.getExportsOfModule(moduleSymbol).filter(symbol => {
  const resolved = symbol.flags === ts.SymbolFlags.Alias
    ? checker.getAliasedSymbol(symbol) : symbol;
  // The TypeScript compiler represents value categories with a bit mask.
  // eslint-disable-next-line no-bitwise
  return Boolean(resolved.flags & ts.SymbolFlags.Value);
}).map(symbol => symbol.name)
  .sort();
const actual = Object.keys(rmlui).sort();
assert.ok(declared.length > 0);
assert.deepEqual(actual, declared);

for (const name of declared) {
  assert.notEqual(rmlui[name], undefined, `Missing runtime value: ${name}`);
}
assert.equal(rmlui.version, '6.3');
console.log('PASS public-runtime-exports-match-declarations', declared.length);
