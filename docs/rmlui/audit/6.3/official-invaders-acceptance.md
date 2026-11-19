# Original Invaders application acceptance

Invaders and Lua Invaders have local macOS arm64 game, lifecycle, persistence
and screenshot evidence. Task 9 and whole-project acceptance remain open.
The games now use package-local GYP targets and load without a compiler.
Linux and Windows builds and execution remain unverified.

## Original application boundaries

Each application has its own entry and native registration unit:

- [Invaders entry](../../../../packages/sfml.js-rmlui/examples/official/invaders/main.cjs)
  and [native registrations](../../../../packages/sfml.js-rmlui/examples/official/invaders/native/application.cc).
- [Lua Invaders entry](../../../../packages/sfml.js-rmlui/examples/official/lua_invaders/main.cjs)
  and [native registrations](../../../../packages/sfml.js-rmlui/examples/official/lua_invaders/native/application.cc).

The package build compiles that application's original `Samples/<name>/src`
sources, excluding `main.cpp`, against the existing RmlUi addon. The original
game, element update/render callbacks, sprite/shield geometry, decorators,
event handlers and high-score parser/serializer execute in C++.
Lua Invaders retains the original documents, inline scripts, `lua/start.lua`
and the native `Game` table registrations in one managed Lua VM.

The shared shell adapts startup, backend exit and ownership. Application
objects and addons use the existing package `build` directory. Each game is a
separate module linked to the same Core/Lua implementation as `rmlui.node`.
The launcher performs no compilation and creates no build directory. Source
packages include the application entries, GYP fragments and registration units.
Acceptance logs and standalone reference binaries remain in
`/tmp/rmlui-63-completion`.

On Unix, the binding promotes its already loaded image with
`RTLD_NOW | RTLD_GLOBAL` before loading a game; this also makes Core/Lua symbols
available under Node's default Linux `RTLD_LOCAL` loading. On Windows, GYP
exports upstream Core/Lua/Debugger and the small internal runtime boundary.
Game targets consume `rmlui.lib`, rather than linking another Core/Lua copy.
The Windows Lua compiler selects the matching shared C runtime. These are
implemented build paths; source configuration alone does not establish
Windows or Linux acceptance.

The `HighScores.cpp` translation-unit wrapper alone redirects `fopen` through the explicit
scores path. Its original tab-delimited parser, ordering, ten-entry limit and
serializer remain intact. The Lua `io.open` adapter redirects only
`options.dat`, storing it beside the scores file. Default scores use the
application data directory; `--scores-file` requires an absolute path with
an existing parent directory. Windows absolute-path validation uses UTF-8
filesystem conversion, and score I/O uses `_wfopen` with the corresponding
wide filename. Windows default score storage uses `LOCALAPPDATA`.

## Lifecycle findings

Ordinary Lua document events can load nested documents and open/close data
models. Recursive update/render/input and destructive operations from model
events or value callbacks remain prohibited. Existing Lua tests cover these
distinctions and nested document globals.

Runtime restart exposed an application-host lifetime defect: static
decorator instancers retained pointers into the old property-parser registry.
The application now reconstructs those instancers for each runtime and keeps
them alive through its factory shutdown. The original game sources are
unchanged.

Application close unloads only documents from its own upstream directory.
Debugger documents remain alive. The high-score model destruction notification
saves the list before releasing it. Context removal and runtime shutdown also
clear the native application pointer. Lua close detaches its script host only
when it actually closed a live application; repeated close after context
removal succeeds without accessing an expired context.

Both game modules claim one shared runtime-generation slot before changing
application state. Closing a game retains that slot because its original
instancers remain registered until shutdown. Each module rejects the other
module in the same runtime; a runtime restart permits another application.
The regression first reproduced the missing cross-module guard, then passed
both orders with the shared Core guard.

## Independent native source reference

The [standalone game driver](../../../../packages/sfml.js-rmlui/test/native/examples/shell/original-game.cc)
links the original game sources and existing vendor objects. It has no Node
or sfml.js runtime dependency. It loads the original HUD document, supplies a
fixed clock and renderer stub, and drives the game's public APIs.

Each application passes five native scenarios:

1. Initial 55-invader formation, mothership slot, 40 shield segments and HUD.
2. Pause preserving position and native movement after resume.
3. Public collision hits, explosion completion, 1,100-point formation score,
   wave 2 and a fresh live formation.
4. Three lost lives and the original game-over behavior.
5. A new game restoring score/wave/lives while retaining the high score.

The native Invaders game opens its original high-score screen on game over.
The Lua game's native core exposes `IsGameOver`; its integrated application
test separately verifies the actual `gameover` document event and Lua menu.
The reference driver does not claim Lua script or renderer pixel acceptance.
Next-wave behavior is verified through the native collision API, rather than
a keyboard play-through of an entire wave.

The [application test](../../../../packages/sfml.js-rmlui/test/examples/invaders-application.cjs)
compares initial HUD values to these independently produced JSON references.
It also checks original option save/reopen behavior, hard difficulty and
Denim ship color, real movement/fire hitting an invader, pause/resume, score
entry, game restart, natural game over without state injection, menu exit,
double close, Debugger preservation, runtime restart and context removal.
Lua assertions verify the original `StartGame.SetupGame` and `Game.SetPaused`.
Both variants retain named scores across a runtime restart.

## Observed verification

The [package-built application evidence](official-package-applications-evidence.json)
records the current native build, two compiler-free loading contracts, ten
original native cases, both integrated game lifecycles including the shared
slot, and 81 passing site tests. Current source-package application inventory,
TypeScript build/types, native formatting/lint, language-server tests and
extension build also pass. Standalone installation, actual editor/VSIX,
current full-runtime recheck and Linux/Windows execution remain pending.

The table below retains the prior focused application revision.

| Check | Observed local result |
| --- | --- |
| Original C++ game reference | 5 scenarios per application; 10 passed |
| Integrated game and lifecycle acceptance | 2 comprehensive scenarios passed |
| Managed Lua script regression | 29 scenarios passed |
| Four-language example gallery and source comments | 30 tests passed |
| Focused package/site ESLint, clang-format, cpplint | Passed |
| Actual compile flags and matching LLVM 18 headers: naming | 4 units passed |
| Actual native game addons and native reference executables | Compiled and executed successfully |

The [operation ledger](official-invaders-operation-ledger.json) distinguishes
native reference, binding and platform evidence. The
[fingerprinted evidence](official-invaders-evidence.json) identifies the
application source trees, drivers, adapters and screenshots. These focused
results do not replace current whole-runtime, packaging, CI, physical IME,
113-page VisualTests or independent whole-change acceptance.

## Native screenshots and reproduction

The original games were captured from actual SFML windows at 2048×1536 pixels
and visually inspected:

- [Invaders](../../../../packages/sfml.js-rmlui/examples/screenshots/invaders.png).
- [Lua Invaders](../../../../packages/sfml.js-rmlui/examples/screenshots/lua-invaders.png).

All four galleries include their independent entry, native registration source,
controls, storage options, platform limits and screenshot. F8 toggles Debugger;
Left/Right moves the defender, Space fires and Escape opens the original pause
menu. The upstream native application handles Escape on key-up; Lua handles
it on key-down.

Run from the existing repository root after building the package:

```sh
npm run test:official-native --prefix packages/sfml.js-rmlui
node packages/sfml.js-rmlui/examples/official.cjs invaders
node packages/sfml.js-rmlui/examples/official.cjs lua-invaders
node packages/sfml.js-rmlui/examples/official.cjs invaders \
  --scores-file /tmp/invaders-scores.txt --frames 8 --exercise
```

`test:official-native` runs the standalone reference builders followed by both
integrated applications. Its reference builder currently uses the existing
macOS build objects. It reports an unsupported platform as a failure rather
than silently replacing the independent comparison with a smoke test.
