import { LuaFunction, LuaScriptHost, type LuaScalar } from '../../src';

const host = new LuaScriptHost();
const chunk: LuaFunction = host.compile('return ...', 'source.lua', 7);
const result: LuaScalar = chunk.call(9007199254740993n);
const results: LuaScalar[] = chunk.callResults(3, false, 'text', null);
const captured: LuaFunction = host.getFunction('current');
host.execute('counter = 1', 'source.lua', 7);
host.setGlobal('counter', 9007199254740993n);
const global: LuaScalar = host.getGlobal('counter');
const called: LuaScalar = host.call('current', 1, 'é', false, null);
host.executeFile('source.lua');
captured.release();

void [ result, results, global, called ];

// @ts-expect-error Compiled source must be a string.
host.compile(1);
// @ts-expect-error Functions use nominal Native construction.
new LuaFunction({});
// @ts-expect-error Scalar calls do not accept tables.
chunk.call({});
// @ts-expect-error Result counts must be numeric.
chunk.callResults('all');
// @ts-expect-error Global values use the supported Lua scalar union.
host.setGlobal('counter', {});
// @ts-expect-error Named function arguments cannot contain tables.
host.call('current', []);
// @ts-expect-error Script source locations use numeric line numbers.
host.execute('return 1', 'source.lua', '7');
