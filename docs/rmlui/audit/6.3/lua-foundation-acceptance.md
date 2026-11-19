# Lua dependency and native runtime foundation

Lua 5.4.8 and all 37 RmlUi 6.3 Lua translation units now compile into the
existing native package. This is local macOS arm64 foundation evidence.
Task 5 and whole-project acceptance remain incomplete.

The downloader validates the official Lua archive against SHA-256
`4f18ddae154e793e46eeab727c59ef1c0c0c2b744e7b94219710d76f530629ae`.
Individual upgrades preserve existing Core and FreeType dependencies. GYP
compiles the original 32 Lua runtime C files directly as C++ through explicit
rules; it creates no copied translation units or additional build environment.
The Lua command selects C++ before the input filename so Lua errors unwind C++
scopes. Both package and merged LSP databases retain the actual rule arguments.

The persistent upstream patch adds actual-state type registration without
installing the upstream process-global Factory replacements. Typed userdata
records native type, generation and borrowed owner. Element and Context
references use native observers; Event references require a dispatch lease.
Dictionary and style iterators hold Lua value snapshots. Element casts use
native RTTI. These adaptations compile, but their Lua-facing lifetime behavior
has not yet passed integration execution.

## Executed verification

| Check | Observed result |
| --- | --- |
| Native package build, including actual Lua/RmlUi Lua sources | Exit 0 |
| Package runtime | 101 files, 960 PASS markers, 0 FAIL |
| Real Lua archive execution | 2 PASS, 0 FAIL |
| Component preservation and compiler selection | 2 PASS |
| Upstream Lua source patch idempotence | 8 files unchanged after two runs |
| Compiler inventory | 32 actual Lua rule argument records |
| ESLint, cpplint, consumer types | Exit 0 |
| Formatting of new maintained native files | Exit 0 |
| Native naming through LLVM and macOS 15.4 SDK | Exit 0 |

The native probe executes two independent Lua states, exact signed integers
beyond JavaScript's safe-integer range, a function call, original source and
line reporting, stack recovery after an error, and destructor unwinding through
`luaL_error` and `lua_pcall`. It links the package's real `build/Release/lua.a`.
This proves actual Lua execution, without claiming Lua document/API acceptance.

Evidence is under `/tmp/rmlui-63-completion/`: the final native build and package
runtime logs are `lua-upstream-build-final-1.log` and
`lua-foundation-full-runtime-1.log`; the real archive probe is
`lua-runtime-probe-3.log`. The recovered ledger records 17 current source
hashes and the remaining verification logs.

## Remaining integration

A public managed Lua host, scoped interpreter state selection, document
execution and typed calls still require implementation. Existing Node and
ordinary documents must preserve their selected host and normal Factory
behavior. Preserve upstream Lua global scope where application behavior
depends on it.

Lua listeners and instancers still use unchecked raw state and ownership.
Event callers do not yet instantiate the new Lua event lease. DOM and widget
mutation must respect active native stacks. Variant pointer conversion,
constructor failure and Lua data model lifetime, context identity, registry
cleanup and native removal order remain open.

Any Lua VM that retains observer userdata must be released before the RmlUi
observer pool shuts down. Direct Factory listener wrappers need a managed Lua
callback representation. No Lua API declaration was promoted by this work:
Core remains 474 locally verified, 17 partial and 58 pending out of 549;
the supplemental inventory remains unchanged. Independent integration review,
other modules, applications, platform execution and final acceptance remain.
