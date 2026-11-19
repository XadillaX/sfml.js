# RmlUi 6.3 completion implementation plan

> **Execution:** The controller implements tasks sequentially and performs a
> distinct review phase for each task. The user has authorized implementation
> after this audit; no additional plan approval is required.

**Goal:** Complete and verify the RmlUi 6.3 module/application interface
integration before the authorized repository push with the VS Code extension.

**Architecture:** Keep RmlUi/SFML ownership and rendering native, expose typed
checked JS facades, and use native buffers for numerical work. Build on safe
runtime/handle/event primitives, then complete Core and optional integrations,
renderer semantics, samples, documentation and package acceptance.

**Tech Stack:** RmlUi 6.3, SFML 3.1, C++20/NAN, TypeScript 5.0, Node.js,
FreeType, pinned SVG/Lottie/font/script dependencies.

**Spec:** [Full coverage audit](../audit/6.3/README.md), including its three
review reports and compiler declaration inventory.

## Global constraints

- 禁止使用 `using-git-worktrees`，禁止创建 worktree，禁止为构建或测试创建隔离环境，在现有工作目录完成任务。
- Work only in the existing `/Users/bytedance/Workspace/github/sfml.js`.
  Preserve existing edits; no clone/copy, checkout reset, cleanup or HEAD moves.
- Native owns resources and lifetimes. Geometry remains native. Use SFML APIs,
  no raw OpenGL. Retain shared-view and immutable-draw snapshot contracts.
- Preserve original sample behavior/resource layout. No inert previews counted
  as application ports.
- Public APIs need English/Chinese/Japanese/Korean TSDoc and guide coverage.
  Ordinary code/comments/logs are English. Follow root native lint/format rules.
- Temporary briefs, review diffs, logs and test outputs use
  `/tmp/rmlui-63-completion/`; reuse existing package build/dependency trees.
- Execute tasks without repeated approval questions. Do not stage, commit or
  push until final acceptance; do not publish npm/Marketplace artifacts or tags.
- Never mark a scope gap passed, excluded or complete merely to end the task.
  Source-level coverage and platform execution evidence are separate.

## Review focus

- Reentrant callbacks that destroy documents/models must not invalidate active
  native stacks, retain leaked closures or call the wrong Node environment.
- Unicode byte/codepoint boundaries and event transforms must agree with RmlUi.
- Saved masks, gradients and filtered translucent content must remain visible
  and numerically correct under clipping, nesting and resize.
- Disabled/missing dependencies and package-local execution must fail clearly
  rather than yielding nonzero no-op handles or incomplete installed packages.
- C++ customization/template interfaces need documented JS/native equivalents;
  no runtime feature may be silently discarded as “internal.”

## File and task boundaries

All implementation paths below are under `packages/sfml.js-rmlui/` unless a
repository-root path is given. Native interfaces are package-internal C++ APIs,
not a new external ABI. Every task updates its task report and the operation
ledger before review; only measured results are promoted to accepted.

| Task | Owns | Depends on |
| --- | --- | --- |
| 1 | Runtime/handles/listener safety | Audit |
| 2 | Full events, conversion, input | 1 |
| 3 | Core DOM, controls, styles, resource/value APIs | 1–2 |
| 4 | Native data models and schemas | 1–3 |
| 5 | Document scripting, Lua and extension adapters | 1–4 |
| 6 | Dependency modules, Debugger, SVG/Lottie/font engines | 1–5 |
| 7 | SFML renderer protocol and effect pixels | 1–3 |
| 8 | System/file/IME/platform adapters | 1–3, 6 |
| 9 | All official applications and visual corpus | 1–8 |
| 10 | Four-language docs/editor/package/CI/final acceptance | 1–9 |

Tasks share native state, native declarations, TS exports and build manifests.
Run implementers sequentially. The controller may prepare later briefs and
review packages while an implementer works, without editing its files.

### Task 1: Runtime, handles and listener lifetime

**Files:** `native/rmlui-state.h`, new `native/rmlui-state.cc`,
`native/addon.cc`, `native/rmlui-core.cc`, `native/rmlui-context.cc`,
`native/rmlui-document.cc`, `native/rmlui-element.cc`,
`native/rmlui-events.cc`, `binding.gyp`, affected lifetime TSDoc, and
`test/lifetime.test.cjs`, `test/listeners.test.cjs`.

**Interfaces:**

- Keep current public signatures compatible.
- Native checked accessors return a live `Rml::Context*` / `Rml::Element*` /
  `Rml::ElementDocument*`, or set a JS error and return null.
- Expose internal runtime owner/generation and callback-scope services for later
  tasks. Describe exact final C++ names in the task report.
- Use observer-backed shared element state and generation-backed context state;
  copied wrappers must share validity. Detached owned nodes are supported by
  this state design for Task 3.
- Registration identity includes element, callback, event type and capture.
  Duplicate identical add is idempotent; unmatched remove is a no-op.

- [x] Write and run failing tests for shared callbacks on two elements,
  wrong-capture removal, duplicate add, subtree destruction, close/update,
  remove/recreate same-name context, shutdown/reinitialize, and font load outside
  runtime lifetime. Risky baseline cases run in bounded child processes.
- [x] Implement owner-environment/thread checks and cleanup while V8 is alive.
  Import/version queries may occur in workers; foreign runtime mutation must
  fail before any shared native/V8 access.
- [x] Implement automatic listener detach/release and dispatch-safe retention.
  A listener may remove itself/others; exceptions propagate at the JS boundary.
  Destructive reentry is deferred safely or rejected explicitly before mutation.
- [x] Verify callback release with WeakRef/controlled GC or real resource
  counters; do not add test-only production cleanup APIs.
- [x] Run package lint, native build, type check, runtime tests, format/naming
  for changed native files; preserve existing baseline behavior.
- [x] Independent review of F1–F4 and foundation prerequisites before Task 2.

### Task 2: Typed live events, variants and direct input

**Files:** new `native/rmlui-variant.{h,cc}`, `native/rmlui-events.{h,cc}`,
`native/rmlui-event-bridge.cc`, `native/rmlui-platform-sfml.cc`,
`native/rmlui-context.cc`, `src/event.ts`, `src/types.ts`,
`src/context.ts`, `src/internal/native.ts`, `src/core.ts`, tests.

**Interfaces:** `RmlEvent` gains `id`, `phase`, `target`, `currentTarget`,
`isInterruptible`, `isPropagating`, `isImmediatePropagating`,
`stopPropagation()`, `stopImmediatePropagation()`, and typed parameters.
Copied data remains readable; dispatch-scoped operations reject after callback.
Add `Element.dispatchEvent(type, parameters, options?)` and `click()`.
Direct context input exposes upstream key/modifier, mouse/wheel/leave,
text and touch operations with upstream propagation results.

- [x] Red tests assert capture/target/bubble order and both stop variants;
  id-less/duplicate-ID targets retain identity; nested dispatch remains distinct.
- [x] Implement typed Variant conversion including exact 64-bit BigInt,
  vectors/colors and known element-valued event parameters. Reject arbitrary
  pointers; do not fabricate strings.
- [x] Use event-snapshot modifiers for SFML key events, map representable keys
  including PageUp/PageDown/System, and add explicit direct-input APIs.
- [x] Test Unicode/synthetic selection, drag source, transformed pointer,
  horizontal wheel, touch lists, exceptions, and retained event invalidation.
- [x] Add positive/negative consumer TS fixtures and run lint/build/types/runtime.
- [x] Independent review of event semantics and Task 1 integration.

Tasks 1–2 have local macOS arm64 acceptance. Task 2 review corrected
getter-driven receiver/reference invalidation and inherited snapshot setters.
Final package validation includes 12 event, 13 input, 13 lifetime and
16 listener scenarios plus basic, density and resource coverage. This does not
establish device, Linux/Windows or whole-project acceptance. EventId constants
and numeric overloads, event registration, DefaultActionPhase, context root
listeners and default-action coverage remain explicit Task 3 requirements.

### Task 3: Complete Core application and value surface

**Files:** focused bindings for context, DOM tree, element layout/style,
document, forms/text, animation, stylesheet/resources, values/utilities;
matching TS files/exports/types and focused tests.

**Interfaces:** Preserve current names; map upstream PascalCase methods to
lowerCamelCase JS methods except established property getters. `createElement`
and `createTextNode` return native-owned detached wrappers. Append/insert/replace/
remove transfer native ownership with identity preserved. Query collections
return snapshots of live typed wrappers. Form/text subclasses expose every
application operation in the Core review tables. Include context lookup/count,
all font-face overloads, style/resource release/inspection, typed properties,
box/computed-style inspection, animation/tween, URL/RML/text-offset helpers.

- [ ] Build an operation ledger from the Core review's Global/Context/Element/
  Document/Event/Specialized/Text/Stylesheet tables; retain every overload and
  assign a consumer-facing representation. No blanket “advanced” exclusion.
- [ ] Write failing consumer/runtime tests for each operation group using
  upstream defaults, boolean results and ownership contracts.
- [ ] Implement in focused native/TS modules using Task 1 checked handles and
  Task 2 conversions; avoid a generic unchecked pointer dispatcher.
- [ ] Run the Core review's 19 acceptance groups, including detached reparenting,
  scroll/focus/selection, programmatic forms and style/animation behavior.
- [ ] Verify shared numerical views survive wrapper GC without retaining
  destroyed RmlUi objects or mutating subsequent generations.
- [ ] Independent interface-ledger and quality review before data binding.

Task 3 remains in progress. Locally verified groups include Context registry,
readonly dimensions, density, scheduling, document controls, detached DOM
ownership, event registration/numeric overloads/root listeners, all form/text/
progress/tab application operations, native RTTI/default-action invocation,
and class/pseudo-class/address/context/focus state. Text lines and attribute
snapshots own their copied values. Four-language guides document native
defaults, ownership and callback restrictions.

Attribute scalar/vector/colour/NONE storage, raw snapshots, bulk updates and
typed defaults are verified. Persistent element pointers are rejected, and
owner-bearing style/script Variant types remain pending their bindings. Six
exact attribute Variant/template declarations are therefore partial, not
accepted as the complete native value surface. Style/layout/scroll/box/
computed-value/animation/stylesheet/resource/font overloads, utilities, typed
event parameter conversion and native customization representations remain
open. Element's ScriptInterface parent alias is dependent on Task 5.

The earlier element-state `npm test` passed all 15 runtime files, with 125 PASS markers
and zero FAIL markers, including ten element-state scenarios. Native/TS builds,
ESLint, cpplint and consumer types passed. Three touched native units passed
naming and formatting. Evidence:
`/tmp/rmlui-63-completion/task-3-element-state-package.log` and
`task-3-element-state-naming.log` in the same directory. Acceptance is local
macOS arm64 only. Native transformed hit-testing uses last-rendered matrices
and inverse-projected clipping; visual/input parity remains a later check.

The original temporary baseline and ledger were absent on an earlier resume;
the immutable baseline was not recreated. Current source and tests reconciled
64 prior Context/DOM/Event entries. The recovery ledger
`/tmp/rmlui-63-completion/core-overload-ledger.recovered.json` retains all
549 declarations / 378 callables from the 16 Core headers, with 222 locally
verified declarations (197 callables and 25 aliases/value records), six
partially verified attribute declarations and remaining records pending.
These counts are not a whole-Core coverage percentage. Prior input/core exact
records still require reconciliation; historical decisions are not inferred.
The detailed execution/review report is
`/tmp/rmlui-63-completion/task-3-report.recovered.md`.
Full Task 3 and Tasks 4–10 remain incomplete; no staging, commit or push.

Current local Core/value verification includes layout/scroll/projection,
Box/RenderBox, NumericValue/Unit, Property/PropertyDefinition/PropertyId, Tween
and all Element animation overloads, ColorStopList/BoxShadowList, plus Transform
and all 22 TransformPrimitive types. Structural constructor mappings, copied
lists, relative units, radian normalization, null TransformPtr values and
pointer-identity equality are documented and tested. Transform pure values work
in workers; property construction still requires the runtime owner.

The current complete package run passes 24 runtime files with 213 PASS markers
and zero FAIL, plus lint, cpplint, native/TS builds and consumer types.
Evidence: `/tmp/rmlui-63-completion/task-3-transform-package-final.log`.
Five touched native translation units pass naming and six sources/headers pass
formatting. The recovered ledger retains all 549 Core declarations: 314 locally
verified (289 callables), eight partial value records, one partial renderer
record and 226 pending. Its separate supplemental inventory contains 411
declarations (59 callables), including 133 Transform declarations, with 408
locally verified and three partial. Constructor records are retained separately
from that callable count.

Transition/animation lists now have typed field/factory/equality adapters,
Property/attribute/event conversions and copied Tween callback ownership.
Actual CSS transitions, keyframe animations, clones, callback release,
detached cycles and shutdown/restart pass ten new runtime groups. The package
run passes 25 runtime files with 223 PASS markers, zero FAIL, plus lint,
cpplint, native/TS builds and consumer types. Evidence:
`/tmp/rmlui-63-completion/task-3-motion-package.log`. Nine native translation
units pass naming and 12 native files pass formatting. Four animation guides
and TSDoc are synchronized. The supplemental inventory now has 437
declarations (65 callables): 434 locally verified and three partial; the
original 549-declaration Core counts are unchanged.

Decorator, filter and font-effect shared values now have generation-owned
`DecoratorList`, `FilterList` and `FontEffectList` facades. Property, attribute
and event conversions retain native pointer identity and typed null/default
semantics. Declaration metadata includes copied properties, instancer-local
IDs/names, named decorator references and paint areas; const font-effect
metadata exposes four native getters with an exact BigInt fingerprint.
Nine effect scenarios pass, including nested gradient values, DOM close,
GC and stale/native forged-handle rejection. The package run passes 26 runtime
files with 232 PASS markers and zero FAIL, plus lint, cpplint, native/TS builds
and consumer types. Five native units pass naming and seven files pass format.
Evidence: `/tmp/rmlui-63-completion/task-3-effects-package.log`, with focused
effect logs in the same temporary directory. Supplemental coverage retains
474 declarations (74 callables): 444 verified, 23 partial and seven pending.
The original Core denominator/counts remain unchanged.

ComputedValues now maps all 183 compiler-inventoried methods: 98 getters,
83 assignments (82 setters plus setHasLetterSpacing) and two copy operations.
The constructor allocates native default storage associated with an observed
element; Element.getComputedValues returns a checked live const view.
StyleTypes exposes all 37 enums, five independently shared scalar classes,
native encoded Clip, 17 aliases and both ResolveValue/Or overloads. Structured
results own copies; font handles are opaque generation-checked tokens.
Ten focused scenarios cover all getter dispatches, native defaults, copying
without rebinding, DOM destruction, shared-view GC, invalid enum/radius inputs,
local properties, motion callback retention/release and stale font tokens.
The complete package run passes 27 runtime files, 241 PASS markers and zero
FAIL markers, plus native/TS builds, lint, cpplint and consumer types. The
additional nonzero font-token scenario passes in the final ten-scenario run;
final lint passes. Two native units pass naming and four files pass formatting.
Evidence: `/tmp/rmlui-63-completion/task-3-computed-package.log`,
`task-3-computed-runtime.log`, `task-3-computed-inventory.log` and style logs.
The Core ledger has 316 locally verified, nine partial and 224 pending
declarations. Supplemental values have 867 verified, 23 partial and 125 pending.
All 1,564 full declaration keys are unique and their evidence paths exist.

Standalone Style.CommonValues/InheritedValues/RareValues now expose all
112 fields and constructors (118 compiler declarations), independently of
ComputedValues: 49 fields map actual native float/uint16/int16/RGBA memory;
bitfields use checked native accessors. Native storage survives wrapper GC
and shutdown. All 129 native struct methods execute in the foreign-worker
test while the main runtime is active. Font generation additionally tracks
ReleaseFontResources and ReleaseRenderManagers; stale owned or copied handles
reject access. Global releases reject detached trees before invalidation.
The final package run passes 28 runtime files, 249 PASS and zero FAIL, plus
lint/cpplint/build/consumer types. Five native units pass naming; nine files
pass formatting; ten generated outputs are deterministic. The source review
reconciles all 118 declarations with the compiler inventory and checks ownership,
bitfield limits, raw view lifetimes, and both successful/rejected releases.
Evidence: `/tmp/rmlui-63-completion/task-3-style-structs-package.log`,
`task-3-style-structs-inventory.log`, and the associated style validation logs.
Supplemental values now contain 985 verified, 23 partial and seven pending
declarations; original Core counts remain 316 verified, nine partial, 224 pending.

Writable DecoratorDeclaration/FilterDeclaration records and both declaration
list constructors/setters now have local acceptance. Typed decorator/filter
instancer references map the two native Factory lookup methods. Writes allocate
new const shared lists and preserve prior Property/DOM snapshots; all input
records and properties are copied. Null writes allocate storage, text writes do
not reparse RCSS, and array writes preserve the text field. Native validation
rejects wrong instancer types, stale or mixed generations, incomplete property
dictionaries, unknown local IDs and invalid paint areas before replacement.
Fifteen effect scenarios pass, including late native accessors that restart the
runtime. The package run passes 28 runtime files, 255 PASS and zero FAIL, plus
lint/cpplint/native/TS/consumer checks. The changed native unit passes format and
LLVM18 naming; four property guides describe exact write semantics.
Evidence: `/tmp/rmlui-63-completion/task-3-effect-write-package.log` and the
associated effect-write logs. Fifteen declaration/field records and two Factory
lookup methods are verified. Supplemental coverage is 1,017 declarations:
1,002 verified, eight partial and seven pending. Original Core counts remain
316 verified, nine partial and 224 pending.

FontEffect construction, metadata setters, native glyph metrics and texture
generation, FontGlyph ownership/views/WeakCopy and writable FontEffectList
construction now have local package acceptance. Const effects use copied
metadata and flattened native delegation, retaining derived glyph behavior and
every earlier Property/DOM snapshot. Native unique bitmap allocations are kept
alive by weak glyph copies and exported views after replacement or collection.
FontGlyph fields are independently usable in a foreign worker; FontEffect
operations still require the owning runtime. Validation covers missing/short
bitmaps, formats, destination stride/capacity, detached/shared/overlapping
buffers, empty output areas, origin overflow, runtime restarts during argument
access and 10,000 edit/list roundtrips. Twenty-two effect groups pass.

`task-3-font-effects-package.log` records npm test exit 0: 28 runtime files,
262 PASS and zero FAIL, plus lint/cpplint/build/consumer checks. Seven native
files pass clang-format, four translation units pass LLVM18 naming, and the
four updated property guides have valid local links. Supplemental coverage is
1,029 declarations: 1,025 locally verified and four partial. FontEffect custom
virtual overrides/registration remain explicitly partial; the three other
partial records retain their existing value-type gaps. Original Core counts
remain 316 verified, nine partial and 224 pending.

The earlier generated-document check failed: the separately run
`site/scripts/rmlui-comments.test.mjs` failed all four locales at
`Duplicate @zh in Document.getProperty.getProperty`. The shared overload
comment in `src/element.ts` documents a `type` argument absent from the first
overload. This is now repaired at source with separate overload contracts,
documented setters, generics, callable returns and style re-export aliases.
Four locales pass `task-3-dictionary-comments.log`; no check was waived.

The PropertyDictionary increment exposes all 18 public methods plus native
construction, with all 24 ShorthandId constants generated from the pinned
header. The dictionary owns copied native properties across independent plain,
custom and variable-shorthand maps. Reads return owned snapshots. Import/Merge
preserve upstream specificity precedence; Merge prechecks all int32 additions
before mutation. Source metadata conversion rechecks generation after getters.
Stored callbacks use V8-visible edges and a weak native registry; clear/GC
release callbacks and captured-dictionary cycles. Runtime shutdown releases
dictionary resources before the RmlUi pools and parsers.

`task-3-dictionary-package.log` records npm test exit 0: 29 runtime files,
267 PASS and zero FAIL, including five new dictionary groups. Native/TS builds,
lint/cpplint/consumer types, seven native format checks and four LLVM18 naming
units pass. Supplemental coverage is 1,074 declarations: 1,070 locally verified
and four partial; original Core coverage remains unchanged. The declaration
ledger preserves all 20 PropertyDictionary header rows and 25 ShorthandId rows.
Whole-site link checks additionally found three Japanese/Korean fragments
whose composed Unicode differed from VitePress's generated normalization;
the corresponding source headings now declare their IDs explicitly.
`task-3-dictionary-site-tests.log` records site lint and all 81 tests passing.
The full rendered-site build and cross-platform/package acceptance remain
later gates; these local results do not establish whole-Core completion.

The local `PropertySpecification` and global `StyleSheetSpecification` surfaces
are now locally verified, including every lookup overload, six shorthand
strategies, registration/id capacity guards, declarations, defaults and copied
id sets. `PropertyParser` supports checked built-in parsers and synchronous JS
callbacks, with `ParameterMap` and four-language contracts. Global specification
lifecycle follows the RmlUi runtime.

Parser callbacks receive independent output Properties and parameter maps.
They can use Property operations but cannot reenter parsing or mutate
registries/DOM/runtime objects. Exceptions propagate at the outer native
boundary. Successful registration retains callbacks through shutdown; unused
parser cycles collect. Native defaults/styles retain parser-created animation
callbacks, while standalone Properties/dictionaries retain collectable JS
ownership edges.

`task-3-stylespec-package.log` records npm test exit 0: 31 runtime files,
279 PASS and zero FAIL, including seven new global-registry/parser groups.
The final type-alias/export pass also passes lint, TypeScript build and consumer
tests. Twelve native files pass format checks, eight translation units pass
LLVM18 naming, and site lint plus all 81 tests pass. Supplemental coverage is
1,131 declarations: 1,127 locally verified and four partial; the combined ledger
has 1,680 unique keys with existing evidence paths. Original Core remains
549 declarations: 316 locally verified, nine partial and 224 pending.

Full instancer customization, stylesheet/utilities/customization,
remaining input/context overloads and
full Task 3 acceptance remain open. Historical audit exclusions do not waive
these operations. The ledger and detailed recovered report in the existing
temporary directory are the current operation-level evidence. No whole-Core
or cross-platform acceptance is claimed.

FilterInstancer now supports synchronous JS construction, direct native
instancing, local property/shorthand registration and delegation. Filter
instances own native parameters and expose copied ExtendInkOverflow results.
The shared instancer adapter preserves the existing FontEffectInstancer
contracts. Registration retains replaced callbacks for existing declarations;
unregistered callback cycles collect while borrowed specifications retain
native definitions without keeping those callbacks alive.

`task-3-filter-instancers-package.log` records npm test exit 0: 33 runtime
files, 291 PASS and zero FAIL, plus lint/cpplint/native/TS/consumer checks.
Six filter groups cover local registration/defaults, copied dictionaries,
relative overflow, real document rendering, replacement, null/errors/reentry,
capacity bounds, late getter invalidation, GC and render-error recovery.
Four-language contracts pass; five touched native files pass formatting and
four translation units pass LLVM18 naming.

The ledger preserves all 12 Filter.h compiler records, including pending
CompileFilter, compiled resources and custom Filter construction. Shared
EffectSpecification protected operations are partial: the FilterInstancer
adapter is verified, while the DecoratorInstancer adapter remains open.
Original Core remains 549 records: 316 verified, nine partial, 224 pending.
Supplemental coverage is 1,158 records: 1,146 verified, nine partial, three
pending. Four source-reviewed protected declarations remain separate, two
verified and two partial. All 1,711 combined keys are unique with existing
evidence paths. Custom decorators, filter resources/virtuals, font glyph
overrides, remaining Core coverage and Tasks 4–10 remain incomplete.

Task 3's compiled resource increment adds Context/Element.getRenderManager,
independent manager construction, filter/shader compilation, native filter
virtual invocation, unique resource validity/release and ordered ownership
lists. Resources release before their managers; global cleanup invalidates
unused borrowed managers while preserving active and independently owned ones.

`task-3-compiled-package.log` records npm test exit 0: 34 runtime files,
295 PASS, zero FAIL, plus lint/cpplint/native/TS/consumer checks. Four new
runtime groups cover actual compilation, duplicate/empty lists, release, GC,
shared-manager removal, stale/getter/forged inputs and missing element managers.
Four locale contracts, six native format files and five LLVM18 naming units
pass. Eight guides describe the current contracts and renderer gaps.

The ledger inventories all 56 RenderManager/CompiledFilterShader/
UniqueRenderResource declarations, with compiler-omitted conversion/lifecycle
members recorded by source review. Core remains incomplete: 549 declarations,
318 verified, nine partial and 222 pending. Supplemental coverage is 1,214:
1,161 verified, 14 partial and 39 pending. Four protected effect declarations
remain two verified and two partial. All 1,767 full keys are unique with
existing evidence paths. Filter custom callbacks, decorator resources and
callbacks, font glyph overrides, remaining Core methods and Tasks 4–10 remain
open; no staging, commit or push.

Task 3's custom Filter virtuals are locally verified. `new Filter(callbacks)`
provides synchronous compilation and optional ink-overflow extension. Returned
compiled resources transfer exactly once and must match the element's manager;
empty construction reports failure. Callback rectangles are mutable copies with
finite output checks. A dedicated effect callback boundary permits resource
compilation and approved value reads while rejecting DOM/style mutation.

Per-native-instancing leases retain callbacks through attached element effects.
Detached trees use V8-visible owner edges, and direct JS instancing removes the
native lease. Tests cover standalone/instancer/self-capture collection, detach,
reattach, shutdown, invalid results, cross-manager transfer, repeated transfer,
exceptions, recursive calls, numeric resolution, property and box reads.

`task-3-filter-callbacks-package.log` records npm test exit 0: 35 runtime
files, 300 PASS, zero FAIL; lint, cpplint, native/TS builds and consumer types
also pass. Eight affected translation units pass LLVM18 naming; touched native
files pass format checks. Eight guides document custom Filter ownership.
The ledger remains 549 Core records: 318 verified, nine partial, 222 pending.
Supplemental records remain 1,214: 1,163 verified, 13 partial, 38 pending.
The four protected declarations remain two verified and two partial.
Decorator creation/resources/callbacks, font glyph overrides, remaining Core
methods and Tasks 4–10 are open. No staging, commit or push.

Task 3's decorator resource foundation now includes native Mesh storage,
Geometry and file Texture views. Mesh exposes shared 20-byte Vertex and int32
index allocations; resize preserves the common prefix in fresh storage.
makeGeometry validates and snapshots nonempty meshes before consuming them,
so old writable views cannot change submitted geometry. Geometry supports
native rounded rendering, copied mesh reads, both release modes and the uint32
invalid-index sentinel. Texture preserves native lazy loading, default path
resolution, dimensions and equality. Managers remain alive through resources,
with checked affinity and orderly invalidation before native destruction.

`task-3-geometry-package-final.log` records npm test exit 0: 36 runtime files,
306 PASS and zero FAIL, plus native/TS builds, lint/cpplint and consumer types.
The expanded `task-3-geometry-runtime-final.log` passes seven groups, including
untextured snapshot pixels, texture sampling and shader output. The worker
lifetime test executes all seven pure Mesh methods. Four locale contracts,
seven native format files, four LLVM18 translation units and guide links pass.
The final test-only formatting pass is recorded in the geometry lint log.

The declaration inventory now includes Geometry/Mesh/Texture/Vertex headers.
Core remains 549 records: 318 verified, nine partial and 222 pending.
Supplemental records total 1,246: 1,180 verified, 19 partial and 47 pending.
The four protected effect declarations remain two verified and two partial.
All 1,799 full keys are unique with existing evidence paths. Independent
Vertex operations, TextureSource, TexturedMesh, spritesheets, Decorator
callbacks and remaining Core/task acceptance are still open. No staging,
commit or push.

The next resource increment implements typed Vertex views, TextureSource,
TexturedMesh records, and native SpritesheetList with copied Sprite/Spritesheet
metadata. Vertex uses mapped native position/colour/UV fields and native
value-initialization defaults (opaque black, not all-zero bytes). TextureSource
retains manager leases and resets its pointer-keyed cache before unused
managers are destroyed. Sprite lookup copies metadata and creates an independent
native texture source, so later insertion/merge or list GC cannot invalidate it.
List mutation validates all accessors before resolving runtime generation.

`task-3-spritesheet-package.log` records npm test exit 0: 36 runtime files,
311 PASS and zero FAIL, with native/TS build, lint/cpplint and consumer types.
The final targeted runtime log passes 12 resource groups, including GC of Vertex
and SpritesheetList owners, snapshot survival, eight manager release/recreate
cycles, reentrant shutdown, duplicate overwrites and self-merge. Final lint,
six native format files, two new translation-unit naming checks and all four
localized API-comment checks pass. Guide links and git diff whitespace pass.
Evidence paths use the existing `/tmp/rmlui-63-completion/` directory.

The recovered ledger includes all 19 Spritesheet header declarations.
Core remains 549 records: 318 verified, nine partial and 222 pending.
Supplemental records total 1,265: 1,213 verified, 15 partial and 37 pending.
Protected effect declarations remain two verified and two partial.
All 1,818 full keys are unique and every referenced evidence path exists.
Remaining resource work includes Decorator virtuals/protected textures and
the scoped DecoratorInstancerInterface. The source review confirms stylesheet
decorator caching spans elements and uses declaration/source text, so callback
ownership must account for native stylesheet caches as well as element data.
Full Core acceptance and Tasks 4–10 remain open; no staging, commit or push.

The decorator instancing increment now exposes `DecoratorInstancer(callback)`,
local property/shorthand registration, direct native delegation and a scoped
`DecoratorInstancerInterface`. Its sprite metadata is copied and its returned
textures/managers have independent checked owners. Escaped interfaces fail
after normal return, exceptions and nested delegation. Instancing may occur
during document loading. Read-only instancer lookup/specifications and applying
defaults to owned dictionaries are permitted inside an instancer callback.

Builtin `Decorator` instances expose checked `generateElementData`,
`renderElement` and `releaseElementData`. Manual `DecoratorData` validates
decorator/element/manager identity, releases native data on GC and is released
before its manager is destroyed. Rendering uses actual pixel assertions.
Runtime validation must stop immediately after an invalid receiver; further
V8 private-field reads can interfere with the pending exception.

`task-3-decorator-package.log` records passing package lint, cpplint, native/TS
builds, consumer types and 37 runtime files (319 PASS lines, zero FAIL).
Seven decorator groups cover scoped
resources, delegation/cache reuse, nested scopes, errors, pixels, data GC,
manager invalidation and callback collection. Four localized API-comment
checks, native format and naming checks pass. The four resource guides document
the consumer contracts and the remaining custom-callback work.

This is not full Decorator completion. Custom virtual overrides, protected
texture operations, explicit interface construction from an owned StyleSheet,
and callback ownership across native stylesheet caches remain open. The
stylesheet cache is keyed by declaration text/source path, not render manager;
media containers can retain inactive shared sheets and global factory caches
also own parsed containers. Filter's per-element lease approach does not cover
these cache lifetimes. All later tasks and final acceptance remain required.
The recovered ledger has 1,844 unique full declaration tuples (including source
line) with all 354 referenced evidence paths present. Core remains 318 verified,
nine partial and 222 pending; supplemental coverage is 1,228 verified,
22 partial and 38 pending. Protected effect operations are four verified and
three pending; the latter are Decorator's texture methods.

The stylesheet ownership increment exposes parsed `StyleSheetContainer`
storage, explicit media compilation, checked compiled views, independently
owned combinations, and sprite/named-decorator/keyframe snapshots. Compiled
views expire on a changed media selection even when a shared media block
remains allocated. Only owned combinations permit mutation. Explicit
`DecoratorInstancerInterface(manager, sheet, source)` now retains native
owners, copies the property source and checks stylesheet revisions and
manager/runtime validity; callback interfaces retain their scoped contract.

Validation: `task-3-stylesheet-package.log` records lint, cpplint, native/TS
builds, consumer types and 38 runtime files, with 324 PASS lines and no FAIL
lines. Five stylesheet groups cover media changes, merge preconditions,
metadata independence/precedence, GC retention, manager release and restart.
Five touched native files pass formatting; both implementation units pass
naming checks. Four `task-3-stylesheet-comments-*.log` files are empty.
TypeDoc interpreted unquoted RCSS at-rules as block tags; inline code in the
source TSDoc fixes the translation errors without rendering workarounds.

The ledger remains incomplete: Core 549 = 330 locally verified, 19 partial,
200 pending; supplemental 1,288 = 1,229 verified, 21 partial, 38 pending;
protected 7 = 4 verified, 3 pending. All 1,844 full declaration tuples are
unique, and all 368 referenced evidence files exist. Stream-based loading
beyond the text adapter, element-definition matching, document attachment,
cached decorator instancing and custom Decorator virtuals remain open.
`BuildNodeIndex` is invocation-tested only: verify matching and merge-after-
matching when adding `GetElementDefinition`, since upstream retains its
node cache. This increment does not complete Task 3 or authorize a push.

The element-definition/document increment verifies actual selector matching,
shared immutable definition lifetime, merge-after-matching and independent
property/custom-property/ID/dictionary reads. `Element.getStyleSheet` also
covers the document override. Document container reads retain a read-only
native owner; assignment retains shared ownership, null removes sheet rules,
and reload preserves the existing DOM and inline styles.

The pinned-source patch now clears stale matching/decorator caches on merge,
tracks every native container recompilation and lets documents retain the
original container owner for checked host views. Per-document revision
tracking ensures all documents sharing a container update after media changes.
The regression initially returned width 10 instead of 30 after a merge;
`task-3-definition-cache-red.log` records the failure. Media-view checks cover
pointer reuse and automatic document compilation, not just explicit updates.

`task-3-definition-package.log` records npm test exit 0: lint, cpplint,
native/TS builds, consumer types and 38 runtime files, with 328 PASS and zero
FAIL. Nine stylesheet scenarios pass. The changed native unit passes naming
and formatting; all four `task-3-definition-comments-*.log` files are empty.
Core 549 now contains 339 locally verified, 18 partial and 192 pending
declarations. Supplemental/protected counts remain unchanged. All 1,844 full
tuples are unique and all 379 referenced evidence files exist.

Task 3 remains incomplete. Next are cached decorator ownership and custom
Decorator virtuals/protected textures, FontEffect glyph customization,
general Stream input, remaining Factory/utilities/Core operations and the
19-group acceptance/review, followed by Tasks 4–10. No staging or push.

Task 3's `StyleSheet.instanceDecorators(manager, declarations, source)` now
returns independent arrays of shared builtin/delegated decorators. Declaration
input is copied before native instancing; source/manager/sheet handles are
checked after argument accessors. Native failure returns an empty array and
factory exceptions propagate unchanged. Returned instances survive source
sheet collection but remain invalidated with their original manager.

A regression reproduced upstream's cross-manager cache collision. The pinned
patch keys caches by manager as well as declaration text and source path.
Empty-text scratch results are sheet/manager-owned and regenerated each call.
Sheet merge clears cached results. A non-owning live-sheet registry lets the
native RenderManager destructor erase all its cached entries before releasing
resources, including manager address reuse and noncompiled media blocks.
Exact patch reapplication preserves source content and timestamps.

`task-3-decorator-cache-package.log` exits 0: lint, cpplint, native/TS builds,
consumer types and 38 runtime files pass, with 331 PASS lines and zero FAIL.
Tests cover cache reuse and separation, array independence, merge and manager
release, factory errors/native failure, and source GC with retained manual
element data. Four localized TypeDoc checks and native naming/format checks
pass. Ledger: Core 549 = 340 verified / 18 partial / 191 pending;
supplemental 1,288 = 1,229 / 21 / 38; protected 7 = 4 verified / 3 pending.
All 1,844 complete declaration tuples are unique; 391 evidence files exist.

Custom Decorator virtual callbacks, protected texture operations, callback
ownership across native caches and safe manual-data GC cleanup remain pending.
Continue those before FontEffect customization, remaining Core coverage and
the full 19-group Task 3 acceptance/review. Tasks 4–10 remain open; no staging,
commit or push. Use the existing checkout without worktrees or isolated
build/test environments.

Task 3's custom decorator increment is locally verified on macOS arm64.
`Decorator<Data>(manager, callbacks)` exposes all three synchronous virtuals.
Per-element data preserves object identity; null prevents rendering. Manual
data has checked decorator/element identity and independent ownership.
Protected texture operations are available on custom decorators, including
native deduplication and invalid/out-of-range results.

Native document/global stylesheet caches retain callbacks, including inactive
media blocks. JS sheets, containers, explicit interfaces and detached trees
use V8-visible edges so unused cycles collect. Native finalizers queue release
without executing JS; the next safe boundary invokes reachable callbacks and
skips already-collected data/closures. Explicit release runs before the outer
RmlUi call returns. Shutdown releases manual geometry while managers remain
valid, then clears edges on retained invalid wrappers. Environment cleanup
uses the owning HandleScope/context and never invokes user callbacks.

`task-3-decorator-callbacks-package-verified.log` exits 0: lint, cpplint,
native/TS builds, consumer types and 39 runtime files pass, with 342 PASS
lines and zero FAIL. Eleven custom decorator groups include actual pixels,
manager affinity, recursive/throwing/async overrides, cached/null data,
inactive media blocks, explicit interface ownership, manual/detached cycles,
shutdown and process exit. Rejected async callbacks receive an actual Promise
rejection handler; V8's handled flag alone did not prevent Node rejection.
All four localized TypeDoc checks, native naming and formatting pass.
Two patch reapplications preserve content and timestamps of 11 patched files.

Ledger: Core 549 = 340 verified / 18 partial / 191 pending; supplemental
1,288 = 1,236 / 15 / 37; protected 7 = 7 verified. All 1,844 complete
declaration tuples are unique and all 410 evidence paths exist. Full Task 3
remains incomplete. Continue FontEffect glyph overrides and
FillColorValuesFromAlpha, remaining Factory/Stream/utilities/customization,
Context edge cases, the 19 acceptance groups and distinct review, then
Tasks 4–10. No staging, commit or push. No worktrees or isolated build/test
environments; use the existing checkout.

FontEffect's protected `FillColorValuesFromAlpha` helper is now locally
verified through `FontEffect.fillColorValuesFromAlpha(bytes, dimensions,
stride)`. Native RGBA destination validation is shared with glyph generation:
int32 dimensions/stride, exact subview bounds, detached/shared buffers,
empty areas and backing-store retention. Pixel tests preserve row padding,
surrounding bytes and alpha. Pure pixel work is verified before initialization,
after shutdown and in a worker while the main runtime is initialized.

`/tmp/rmlui-63-completion/task-3-font-alpha-package-verified.log` records
`npm test` exit 0: lint, cpplint, native/TS builds, type fixtures and
40 runtime files with 343 PASS / 0 FAIL. The earlier package log records the
foreign-worker method-classification failure; the corrected test actually
invokes the helper in its pure-value group. Native naming/format, four locale
comment checks and diff checks pass. The distinct source review is
`/tmp/rmlui-63-completion/task-3-font-alpha-review.md`.

FontEffect's three custom virtuals now have direct-call implementation and six
passing scenarios: defaults/metadata/input snapshots, scratch row isolation,
exceptions/getters/recursion, promises/failed writes, standalone callback GC
and shutdown, plus destination transfer/resize during callbacks. The public
constructor accepts optional synchronous callbacks. Native glyph snapshots and
scratch views own their storage. Callback guards also cover returned getters;
metadata reentry retains the original delegate throughout the call.

`/tmp/rmlui-63-completion/font-effect-callbacks-package.log` records `npm test`
exit 0, including 41 runtime files and 349 PASS / 0 FAIL. Native naming/format,
consumer types and four-locale comments pass. The scoped review is
`/tmp/rmlui-63-completion/font-effect-callbacks-direct-review.md`.

Standalone value ownership now covers FontEffectList, Property snapshots,
dictionary copies and nested declaration properties. The generic
`RetainVariantCallbacks` hook installs private JS edges without changing
native effect/list identity; immutable snapshots retain separate owner edges.
Effect-list writes rebuild those edges, and shutdown clears them. The
iterative value traversal deduplicates shared declaration lists.

Five ownership tests failed before implementation; all six scenarios now
pass, including positive callback retention and collectable owner cycles.
`/tmp/rmlui-63-completion/font-effect-value-package.log` records `npm test`
exit 0: 42 runtime files, 355 PASS / 0 FAIL, lint, cpplint, native/TS builds
and consumer types. Native naming/format, four locale comment inspections and
diff checks pass. The distinct review is
`/tmp/rmlui-63-completion/font-effect-value-ownership-review.md`.

Native owner integration now covers parser/instancer handoff, element trees,
element attributes, stylesheet nodes/definitions/keyframes (including inactive
media blocks and expired compiled views), global/factory caches, property
defaults, context roots (cursor proxy, drag clones and documents pending
destruction) and the default engine's live FontFaceLayer registry. Native
state is snapshotted before any V8 allocation; private JS edges keep
reachable callbacks while owner/callback cycles still collect. A real RCSS
run verifies green glyph pixels, identical native effect identity across
redraws, font-layer retention after document close and release on
`releaseFontResources()`; 19 focused cases pass.

`/tmp/rmlui-63-completion/font-effect-native-package.log` records `npm test`
exit 0: 43 runtime test files, 374 PASS / 0 FAIL, lint, cpplint, native/TS builds
and type fixtures. Naming (12 translation units), clang-format, four locale
comment inspections and `git diff --check` pass. The distinct review is
`/tmp/rmlui-63-completion/font-effect-native-ownership-review.md`. The
custom FontEffect aggregate is now fully verified on macOS arm64; device,
Linux/Windows and whole-project acceptance remain later gates.

A runnable `examples/font-effect.cjs` demonstrates a JavaScript
FontEffectInstancer with native glyph texture callbacks through RCSS
`font-effect: glow()`, including `--frames N` smoke runs and
`--screenshot` capture; all four example README guides and the generated
`screenshots/font-effect.png` are included, and site content tests pass.
No staging, commit or push.

Context memory loading now rejects invalid source URL types and embedded null
bytes before dispatching any load event. Three edge scenarios verify Unicode
source paths, relative stylesheet resolution, omitted/empty URLs, ASCII control
characters and full Unicode scalars. The native parser sets document sourceURL
when it encounters a head element; source comments and all four document guides
now state that behavior explicitly.

`/tmp/rmlui-63-completion/context-edge-package.log` records `npm test` exit 0:
44 runtime test files, 377 PASS / 0 FAIL, lint, cpplint, native/TS builds and
consumer types. This run preceded the Stream implementation.

StreamMemory, StreamFile and custom synchronous Stream are now native-backed.
All Read/Write overload equivalents, source URLs, modes, seeking, readiness,
peek, string/C-string operations, insertion, erasure and truncation are exposed.
Context and stylesheet loading use their native Stream overloads. Native
snapshots, GC-visible callback edges, generation invalidation and file teardown
before FileInterface destruction are verified. Read-only mutation and unsafe
cursor arithmetic are guarded. A reproduced callback read failure no longer
attaches a document or dispatches load; the idempotent pinned-source patch
distinguishes stream errors from ordinary EOF.

`/tmp/rmlui-63-completion/streams-package.log` records npm test exit 0:
45 runtime test files, 386 PASS / 0 FAIL, native/TS builds, consumer types,
lint and cpplint. Nine focused Stream cases pass; the inventory retains all
53 Stream/StreamMemory declarations, including 38 methods and five mode
constants. Internal StreamFile has a separate ten-method source review.
Both new native translation units pass naming/format checks.

`examples/streams.cjs` is runnable with `--frames N --screenshot path.png`;
its 720×420 screenshot was visually checked. All four example catalogues and
Stream guides are linked; the four guide routes appear in the sidebar and
manifest. Site lint and 81 tests pass, including all four TypeDoc contract
checks. The distinct review is `/tmp/rmlui-63-completion/streams-review.md`.
No staging, commit or push.

Continue remaining Factory/utilities/customization and exact Core interfaces.
Global FileInterface customization is still Task 8, not closed by StreamFile.
The overall Task 3 and Tasks 4–10 remain open. User authorization is continuous:
finish the full plan rather than ending at a completed subitem.

### Task 4: Native-owned data models and schemas

**Files:** `native/rmlui-data-*`, `src/data-*`, context/native declarations,
build entries and `test/data-model*.test.cjs` / consumer type fixtures.

**Interfaces:** `Context.createDataModel(name, options?)`, `getDataModel`,
`getDataModels`, `removeDataModel`; model binds values, getters/setters,
event callbacks, transforms and registered struct/array definitions.
Expose `dirtyVariable`, `dirtyAllVariables`, `isVariableDirty`, `update`,
native-backed fields and sparse `$.path` updates. Shared type registers survive
individual models and reject use after their native owner expires.

- [ ] Enumerate all DataModel/DataVariable/DataTypeRegister review rows,
  including custom definitions/reflection and recursive structs.
- [ ] Red tests use the four official data-binding models, tree lists, two-way
  input, transforms, repeated arrays and removed-model handles.
- [ ] Implement native scalar/string/array storage with stable numeric buffer
  owners and explicit root dirtying. No full JSON round trip per frame.
- [ ] Verify throwing/reentrant getters, sparse updates, array resize with old
  views, callback release and reflected members for Debugger.
- [x] Measure 1k/10k/100k elements, sparse dirty roots, allocations/copies/calls;
  report measurements without invented performance thresholds.
- [ ] Independent review of semantics, ownership and type coverage.

#### Task 4 scalar and callback foundation

The initial data-model layer has local macOS arm64 acceptance. Context model
creation/lookup/list/removal, distinct constructor/handle facades, native scalar
storage, path-based variable leases, dirty-root scheduling and native model
updates are implemented. Native function, transform and event callbacks retain
first-error identity and follow runtime/GC ownership contracts.

The ten focused runtime groups verify real RML text/value/event controllers,
read-only setters, exact BigInts, native conversions, late binding, recursion,
model invalidation, default-register transform retention, duplicate/builtin
transform behavior and owned-context callback cycles. Package regression:
58 runtime files, 523 PASS lines, zero FAIL lines. Native/TS builds, consumer
types, package/site lint, cpplint, format and three-unit naming checks pass.
Forty-one site/content/gallery/four-language API checks pass. The real six-frame
`examples/data-models.cjs` application and its inspected screenshot exercise
native views, button callbacks, two-way input and removal invalidation.

Four-language `data-models` guides, API comments, sidebar routes and example
gallery entries describe this foundation and its remaining scope. The
`data-operation-ledger.json` retains all 131 declarations in the five public
data headers; per-row acceptance remains partial or pending where schemas,
storage or advanced contracts are absent. The controller's distinct review is
`/tmp/rmlui-63-completion/data-foundation-review.md`.

**Task 4 is not complete.** The native schema/storage continuation below
records the current implemented subset. Managed references/member accessors,
enum definitions, full custom definitions and DataView/DataController adapters
remain pending. General owned Variant callbacks and direct transforms have
local acceptance in the continuation below.
Then execute all four official models/default views/controllers and measured
1k/10k/100k acceptance. No task-level checkbox or whole-module acceptance is
inferred from the foundation.

#### Task 4 native schema and storage continuation

DynamicDataFamily allocates actual native FamilyIds. Native RegisterDefinition
owns runtime-named scalar, struct and array definitions. Definitions stay
inside one register; recursive edges borrow stable schema nodes. Registered
storage supports all signed/unsigned integer widths, float32/float64,
bool/string arrays, recursive record arrays, named/indexed children and member
reflection. Narrow integer reads promote to supported native INT/UINT Variants;
range checks also protect native two-way controller assignments.

Numeric arrays share backing stores with typed JS views. Resize replaces the
allocation and preserves existing values; old views retain their original
memory without retaining contexts or models. Core expressions, default views,
controllers and checked JS variable leases all re-resolve paths. Sparse
patches convert only specified scalar values, mark successful roots and stop
on the first exception. Native data-event callbacks can apply scalar patches.
Registration and array resize remain guarded during callbacks.

Independent type registers survive their borrowing contexts; default registers
survive model removal and expire with their context. Callback ownership uses
registered native roots or visible V8 edges for collectable owned contexts.
Invalid handles clear obsolete ownership edges. Destructive conversion
accessors revalidate definitions before use. RuntimeBoundary now preserves
direct errors before private ownership refresh while nested calls still throw
to their executing JS caller.

Twelve focused runtime groups, four-language API/content/gallery/reference
checks (43 tests), native/TS builds, consumer types, package/site lint,
cpplint, native format and four-unit naming checks pass. The actual six-frame
`data-models.cjs` application verifies recursive data-for, shared buffer
mutation, resize and sparse updates in addition to scalar/callback behavior.
Its 760x480 screenshot was inspected. Source review:
`/tmp/rmlui-63-completion/data-schema-review.md`.

Final package-wide runtime regression exits zero: 59 runtime test files,
535 PASS lines, zero FAIL lines, including prior context construction,
event expiry, callback GC/error and resource lifetime acceptance.
The 131-row data ledger retains all declarations: 11 locally verified,
25 partial and 95 pending.
Neither full Task 4 coverage nor official-model/performance/platform acceptance
is inferred from these local checks. Continue with managed references, member
accessors, enums, custom definitions and the dependent Factory view/controller
adapters.

#### Task 4 owned Variant and direct transform continuation

Native getter/setter and transform callbacks now support every owned Variant
category, including NONE, vectors, colours, decoration/transform/motion values
and typed effect resources. TypeScript uses the existing adapters while the
callback is active; native return-value conversion remains protected from
recursion and destructive accessors. Borrowed pointers require managed
reference definitions. Returned vector/motion storage is independent.

`DataTypeRegister.getTransformFuncRegister()` returns a canonical facade
retaining the type-register lease. `register()` and `call()` use the actual
native TransformFuncRegister shared with constructor registrations and RML.
Call converts arguments before live owner resolution, preserves native success
separately from a null result and exposes builtin transforms. Rejected
duplicate/builtin registration retains no rejected host callback.

Ten focused runtime groups pass, including all 18 owned Variant fixtures,
native vector-to-colour RML style/text views, shared register expressions,
direct builtin/missing calls, conversion errors, recursion, callback release,
snapshot independence, expiry and collectable owned-context/register cycles.
Final package runtime exits zero: 60 test files, 545 PASS, zero FAIL.
Native/TS builds, consumer types, package/site lint, cpplint, native format,
two-unit naming and 43 site/four-language checks pass.

Four-language guides and public API comments document the owned values and
direct transform contract. The actual six-frame `data-models.cjs` exercise
verifies direct native transforms and a colour Variant view; the updated
760x480 screenshot was inspected. Source review:
`/tmp/rmlui-63-completion/data-transforms-review.md`.

Task 4 remains open for managed references, member accessors, enums, custom
definitions, dependent Factory view/controller adapters, all four official
applications and full performance/platform acceptance.
The retained 131-row data ledger is 21 locally verified, 20 partial and
90 pending, with `scope_complete` false.

#### Task 4 managed reference continuation

`DataTypeRegister.registerReference(name, targetSchema)` now registers a genuine
native definition with a real FamilyId. Managed references bind DataVariable
targets or null, support scalar/array/struct targets and recursive struct
members, and reject mismatched definitions, foreign registers and
references-to-references. `getReference()` and `setReference()` expose checked
target leases. Null is checked before forwarding, avoiding upstream's unchecked
dereferenced-pointer path.

Native storage retains weak model/address targets; V8-visible storage edges
retain target leases through the existing model ownership graph. Failed binds
do not attach edges. Clearing, array truncation and model invalidation release
them; references between owned contexts can collect. Views/resize follow the
current target, while previously returned numeric views retain old buffers.
Removed models, invalid target-array indices and self-dependent paths report
checked errors; recursion is bounded and preserves the first RangeError.

Nine focused runtime groups pass. Full package runtime exits zero: 61 test
files, 554 PASS, zero FAIL. Native/TS builds, consumer types, package/site lint,
cpplint, native formatting, naming and 43 site/four-language checks pass.
Four guides and public API comments document the reference contract. The actual
six-frame data-models application verifies clearing and retargeting a selection
to Apple; its 760x480 screenshot was inspected. Controller-owned source review:
`/tmp/rmlui-63-completion/data-references-review.md`.

The pointer-family ledger retains partial JS managed equivalents rather than
claiming arbitrary consumer C++ pointer/traits specializations. The retained
131-row data ledger is 21 local, 29 partial and 81 pending, with
`scope_complete` false. Task 4 remains
open for member accessors, enums, custom definitions, constructor overloads,
dependent Factory view/controller adapters, all four official applications and
full performance/platform acceptance. No whole-plan completion or push is
inferred.

#### Task 4 enum and custom definition continuation

CheckedDataEnum<T> stores a genuine fixed-underlying native enum with checked
conversion. Eight integer widths and shared array views are covered, including
the full uint64 range. Native reads avoid upstream's signed INT64 enum narrowing.
Constructor helpers now use their actual native register for named scalar-kind,
enum, struct, array and custom definitions.

CustomDataDefinition implements real native Get/Set/Size/Child/reflection.
Get returns explicit success and an owned Variant; Set accepts an explicit
boolean. Sizes are nonnegative ints; children are checked same-register variable
leases or null. Native storage retains original caller payloads without
serialization. Result accessors run under the active callback and preserve
first-error identity, recursion and destructive-operation guards.

Custom child leases remain V8-rooted through the complete outer native call,
including subsequent callbacks, then release at the runtime boundary. Visible
payload/callback edges support owned-context cycle collection. Failed bindings
and duplicate registration do not retain rejected payloads or callbacks.
Custom child paths forward numeric views/resize to genuine native arrays.

Eight focused groups pass. Full package runtime exits zero: 62 test files,
562 PASS, zero FAIL. Native/TS builds, consumer types, package/site lint, cpplint,
formatting, six-unit naming and 43 site/four-language contracts pass.
The actual six-frame application and inspected 760x480 screenshot verify
State 3 and Custom quote: 5 alongside the prior bindings.
Controller-owned source review: `/tmp/rmlui-63-completion/data-custom-review.md`.

Task 4 remains open for member-object/value/reference getter-setter accessors,
registered scalar callbacks, advanced variable-alias overloads, actual native
views/controllers and four Factory adapters, all default views/controllers,
the four official applications/tree lists and measured 1k/10k/100k acceptance.
Named-schema and template representations remain partial in the retained
131-row ledger; `scope_complete` is false. The remaining Core/19 acceptance
groups and Tasks 5–10 still require execution before combined extension push.

#### Task 4 checked members, scalar callbacks and aliases

DataMemberDefinition implements native member value and reference accessors.
Callbacks receive current checked parent paths, including newly grown record
array elements. Initial accessor properties are skipped. Plain scalar/enum
values normalize through checked native storage; custom scalar members
exchange owned Variants. Read-only/setter-only semantics and reflected names
are implemented. Exact-definition, same-register reference getters forward
reads/writes/children/views/resize and retain target leases through the entire
outer native call.

`registerScalar(name, { get?, set? })` uses the actual custom scalar definition
with retained payloads, owned Variant getters and native void setter semantics.
The constructor's two-argument `bindCustomDataVariable(name, variable)` binds
checked aliases using private register-owned definitions and visible target
ownership. Aliases resolve after resize/removal and preserve inferred numeric
integer guards without public type-name pollution. Custom scalar reflection
still calls the native adapter; expired model function definitions are never
dereferenced for their empty reflection.

An added owner-conversion regression reproduced SIGSEGV when a target accessor
removed the receiving model. Alias binding now revalidates the model after
each target conversion before calling the unchecked native constructor.
Thirteen focused groups pass. Final full package runtime exits zero: 63 files,
575 PASS, zero FAIL. Native/TS builds, consumer types, package/site lint,
cpplint, formatting, five-unit naming plus the final alias naming rerun pass.
The full site suite has 81 passing tests, including all four language contracts.
The actual six-frame application and inspected 760x480 screenshot show Getter
total 6, Scalar label done and Alias 2. Four guides and public API comments
describe the new interfaces. Controller-owned source review:
`/tmp/rmlui-63-completion/data-members-review.md`.

The retained data ledger has 131 declarations: 21 locally verified, 71 partial,
39 pending; `scope_complete` remains false. Runtime-named JS templates and
member-pointer representations stay partial. The next work is genuine native
DataView/DataController and four Factory adapters, all defaults and four
official models/tree/performance acceptance, then remaining Core/19 acceptance
and Tasks 5–10. No stage/commit/push/publication has occurred.

#### Task 4 native DataView, DataController and Factory continuation

Real native virtual adapters implement view/controller initialization,
view updates and dependency lists, checked attached elements, cached sort
order, validity and unique release. RML parsing transfers ownership to Core's
actual scheduler; manual initialization does not register model scheduling.
The four Factory operations call actual native register/instance methods.
Source-patched registry queries preserve first/default registration while
rejected callbacks remain collectible.

Native defaults return real owning implementations. Observing delegation
relays preserve default behavior and exact cached order even after reparenting.
Borrowed facades preserve identity and reject repeated transfer, initialization,
wrong-element results and invalid owners. Deferred release hooks do not expose
dying pointers. Private V8 ownership edges keep pending callbacks alive and
allow owned view/controller context cycles to collect.

Supplemental default-release regressions reproduced SIGSEGV from releasing a
default controller inside its native setter and silent active view release
inside native expression evaluation. All callback-depth release now rejects
before native destruction, including defaults without custom callback state.
The original controller behavior still uses the element's current DataModel.

Seventeen focused runtime groups pass. Final package runtime exits zero:
64 test files, 592 PASS lines, zero FAIL lines. Native/TS builds, consumer types,
package/site lint, cpplint, native format and four-unit naming pass.
The complete site suite passes 81 tests, including four-language contracts.
Four data-model/API guides and example gallery descriptions are updated.
The actual six-frame data-model application verifies custom Factory scheduling
and delegated default view/controller behavior. Its inspected 760x480
screenshot shows Factory view 2 and the bound title input without cropping.
Controller-owned review: `/tmp/rmlui-63-completion/data-factory-review.md`.

The four Factory ledger rows gain local acceptance. The 131-row public data
ledger remains 21 locally verified, 71 partial and 39 pending; template
representations and whole-scope acceptance are not promoted. Continue all
default binding fixtures, four official models, tree lists and measured
1k/10k/100k acceptance, then remaining Core/19 acceptance and Tasks5–10.
No stage, commit, push or publication has occurred.

#### Task 4 default bindings and official data applications continuation

All twelve default views and three controllers now have local native
interaction fixtures in `test/data-defaults.test.cjs`: attribute/conditional
attribute/class/style/text/RML updates, display and visibility, nested loops,
alias shadowing, late-bound controls, native checkbox/radio/select/textarea/
range input, change override values and cached value ordering.

Data event functions can resize registered native arrays synchronously.
Following statements in the same native event expression observe the new
size immediately. The exact callback-depth guard rejects value callbacks,
custom/member/transform callbacks, intervening ordinary listeners and events
dispatched from getters. Exceptions restore the previous scope. Old numeric
views retain independent backing; invalidated paths reject after truncation.
The initial synchronous-resize acceptance tests failed before implementation.

`examples/official.cjs` adds `data-binding` and `tree-view`, loading the
unmodified upstream RML/RCSS/templates/assets. The application modules in
`examples/official/` run all four original models: basics, events, invaders
and forms. Mouse-position recording/clearing, rating-derived list updates,
subject insertion/erasure and selection reset use native storage immediately.
Invaders retains twelve slots, float32 state and mechanics, capped time delta,
native custom-color projection, original spawn/charge/fire/score/reset logic
and exact binary-double printf rounding. Tree traverses real sample files,
preserves directory-first recursion and descendant collapse rules, and sorts
POSIX names in the original C default locale's byte order.

A mixed-case filesystem fixture exposed JS locale ordering. The final distinct
filenames avoid aliasing on case-insensitive APFS and assert native order.
The original `onsubmit="submit_form"` has no corresponding upstream handler;
the port preserves this, with native submit dispatch tested independently.

Validation: six default groups and four official application groups pass.
Full package runtime exits zero with 66 files, 602 PASS and zero FAIL;
the final source-order application rerun passes all four groups. Native/TS
builds, consumer types, package lint/cpplint, native formatting and three-unit
naming pass. The site suite passes 81 tests; its gallery assertion now includes
both new sample entries. Five inspected exercised screenshots cover Basics,
Events, Invaders, Forms and the expanded tree. Four data-model guides,
public resize comments and four example galleries are synchronized.
Controller-owned review: `/tmp/rmlui-63-completion/data-defaults-review.md`.

Data and recovered Core ledgers retain all declaration keys and counts.
Public data remains 131 declarations: 21 locally verified, 71 partial and
39 pending. Core remains 549 declarations: 391 locally verified, 20 partial
and 138 pending. No whole-scope promotion: `scope_complete` remains false.
Continue actual 1k/10k/100k time/copy/allocation/native-call measurement,
remaining data declaration checks, remaining Core/19 acceptance and Tasks5–10.
No staging, commit, push, tag or publication has occurred.

#### Task 4 measured array/DOM scale and ownership scan correction

Actual 1k/10k/100k bound rows, 100 native float64 array roots, no-dirty,
1% dirty and all-dirty updates, sparse patches, shared views and resize pass
source-driven state/count checks. Maintenance tooling uses existing builds.
Internal opt-in counters distinguish runtime entries, checked scalar reads/
writes, storage nodes, backing allocation bytes and executed resize copies.
RSS/heap deltas are separate observations. Engine/V8/SFML allocation totals
are not inferred from these scoped counters.

Stack sampling of the initial large fixture exposed whole-element scans on
ordinary property reads. Data-factory and typed-listener callback maintenance
now tracks previous/current callback roots; geometric weak-element cache
sweeps avoid scanning all wrappers on each boundary. Previous root edges are
cleared with local handles protecting GC-sensitive snapshots. A regression
proves the last detached subtree callback can collect while its former root
stays reachable.

Final measured 100k model updates took 0.050583 ms with no dirty roots,
0.200833 ms with one dirty root and 18.780542 ms with all roots dirty.
Sparse/all updates read 1,000/100,000 checked values respectively, and no-dirty
reads none. These are single instrumented samples, not p50/p95 claims.
Full runtime: 67 files, 608 PASS, zero FAIL. Native build, lint/cpplint, changed
native formatting and six-unit naming pass. Controller-owned review and exact
scope: [scale report](../audit/6.3/data-performance.md), with all samples in
[CSV](../audit/6.3/data-performance.csv). Four guides are synchronized; 81 site
tests pass and 144 pages regenerate across four locales.

Declaration status counts are unchanged. Continue the 131-data-declaration
reconciliation, remaining Core/19 acceptance and Tasks5–10. A08 CPU timing,
crossing, native/JS input and glyph/mesh/retention measurements are recorded
below; bounded ownership maintenance, renderer batching and broader platform
acceptance remain open. No staging, commit, push, tag or publication has occurred.

#### Performance acceptance: preserve the sfml.js memory and batching contracts

The user's performance concern is a whole-plan acceptance requirement.
Native owns storage, resources and lifetimes; host computations use retained
shared views. Core owns UI expression evaluation, layout and rendering.
Completing customization APIs must preserve this division.

- [x] Count actual JS-to-native entries and native-to-JS callback invocations
  separately, with callback categories. Separate export-table wrappers count
  both RmlUi/SFML addons, including unguarded glyph methods; explicit native
  V8 callbacks have their own counters. Timing excludes these instruments.
- [x] Verify native stored-data/default-view updates do not invoke JS per row.
  A retained numeric view must support host computation without an addon call
  per value. View mapping/setup and explicit dirty/update calls are counted
  separately from buffer accesses. Verified at 1k/10k/100k rows.
- [x] Compare equal workloads through retained shared views/bulk patches,
  per-value addon calls and direct native baselines. Include real JS getters,
  transforms, custom data views/controllers and font/effect callbacks.
  Record the scaling of crossings, conversions and allocations with rows,
  visible elements and glyphs; a batched outer call alone is insufficient.
  Controller frames completed at 1k/10k; the 100k whole-case 300-second
  timeout has no frame percentiles. The attribute slow path was measured at 1k.
- [x] Profile outer-boundary ownership maintenance with many custom instances.
  Measurement completed; bounded cost did not pass. Custom registries still
  scan all instances, and per-row setAttribute and listener registration
  cause cumulative quadratic scans.
- [x] Measure repeated p50/p95 update, layout and render timings separately,
  then complete-frame timings, glyph/geometry rebuilds, GPU uploads, draw calls,
  retained memory and resize/copy cost. Native VBO reuse must not become
  per-vertex JS callbacks or repeated geometry marshaling. CPU frame and
  successful upload counts/bytes are measured; there is no GPU fence/timer.
  Main-thread malloc and the explicitly instrumented copy categories are
  scoped observations, not whole-engine allocation/copy totals.
- [ ] Keep callback APIs as explicit customization paths. Supply and document
  a measured shared-storage/bulk/native path for frequent operations; preserve
  native resource ownership and immutable recorded-draw semantics. The measured
  shared path is documented, but global customization maintenance and
  renderer batching remain unaccepted; broader interface work remains open.

The checked entries above record completed measurements, not blanket
performance acceptance. The formal matrix on Apple M4 Max / Darwin 25.6.0 /
Node.js 22.22.2 / RmlUi 6.3 contains 27 successful data cases, six font cases
and one controller timeout: 84 successful workload groups, 6,720 complete CPU
frame samples, 420 separate counter frames and 84 separate export traces.
Each group uses 20 warmup frames and 80 timed frames; nearest-rank p50/p95 are
recomputed from the retained original samples. Source/binary hashes and
equal-output, sparse-write, callback, upload and draw invariants are checked.

The 100k all-dirty shared path has six actual addon entries, including two
SFML submissions, and zero native-to-JS callbacks. Complete-frame p50/p95 are
361.563/394.562 ms; the same-array direct-native-fill baseline is
373.507/408.513 ms. These independent serial runs do not establish small
timing differences as causal binding overhead. Shared input p50 is 0.032 ms,
per-value input is 23.609 ms and patch input is 44.785 ms. Patch remains one
applyPatch entry but still parses and writes 100k individual paths.

Numerical backing reallocation and resize copies are zero inside these
frames. The 100k shared all-dirty frame still has a median 2,102,500 main-thread
malloc-family allocations requesting 242,891,500 bytes, plus 12,000,000 bytes
of native geometry expansion and 100k VBO uploads/draws. Clean geometry
expansion/uploads are zero, but 100k draw submissions remain. A 100k custom
view query visits 100k instances and has p50/p95 5.462/6.050 ms; 1k per-row
setAttribute produces 1,001,000 element ownership visits per frame.

The 100k controller's 300-second limit applies to the entire child process.
A separate 30-second probe was still in controller initialization, with a
last logged 20k progress checkpoint; it does not prove the exact count at
timeout or a 300-second initialization duration. Native listener registration
still performs cumulative global Registry/element-cache scans.

Full scope, 1k/10k/100k comparisons, stage distributions, callback categories,
allocation/copy/upload counters, setup/retained-memory/resize observations and
font atlas measurements are in the
[frame performance report](../audit/6.3/frame-performance.md), with
[summary CSV](../audit/6.3/frame-performance.csv) and
[original samples and timeout evidence](../audit/6.3/frame-performance.json).
The earlier data-only single samples remain separate evidence. Whole-engine
zero-allocation/zero-copy claims, GPU timings and cross-platform acceptance
have not been established. No staging, commit, push, tag or publication.

#### Task 4 independently owned data variable acceptance

`new DataVariable(schema, initialValue)` allocates independent native storage
using the existing registered definition. Scalars, enums, arrays, recursive
structs, references, custom payloads and member callbacks retain their register
and checked paths. Shared numeric views survive resize/shutdown independently;
child handles retain the root, and V8-visible payload/reference edges permit
unreachable cycles to collect. Model aliases retain owned storage until model
removal. No hidden model or raw address is used.

Nine runtime groups and the final `npm test` pass: 78 runtime files, 707 literal
PASS lines, zero FAIL. Final constructor overload comments and types pass;
all 81 site tests pass. Production native format/naming and the C++ template
probe's cpplint/format/naming checks pass. The probe reuses existing vendor
objects and tests actual scalar/default/function definitions, member objects,
getter/setter/reference/pointer forms, containers, registrations, event
receivers and definition destruction with assertions enabled.

The recursive reference regression exposed first-error replacement; checked
resolution now preserves the original RangeError. Four-language guides and
`data-owned-acceptance.md` document storage/lifetime behavior. The distinct
review is `/tmp/rmlui-63-completion/data-owned-review.md`. Only the exact owned
constructor and BindCustomDataVariable rows are promoted: the data ledger
retains 131 declarations, 61 locally verified, 70 partial, scope incomplete.
Continue individual native/JS template reconciliation, Core nineteen groups
and every remaining task. Earlier frame artifacts keep their measured sources;
no new GPU or full-frame measurements are inferred from these API tests.

Data declaration reconciliation now retains all 131 upstream keys with local
macOS arm64 native/JS evidence. The 70 remaining partial records were checked
individually, including repeated template definitions and member constructors.
`DataStructHandle(register, definition)` adds a checked shared-definition
constructor with foreign/kind/generation rejection and no new storage.

`data-template-package.log` records npm test exit zero: 78 runtime files,
708 PASS and zero FAIL, plus lint/cpplint/native/TS/consumer checks.
The native template probe passes three groups against existing vendor objects;
focused definitions pass eight groups, and site tests pass 81/81 with no skips.
The exact record report is `../audit/6.3/data-template-acceptance.md`.
`scope_complete` remains false. Continue exact Core operations, all nineteen
Core groups, performance/platform/package gates and Tasks 5–10 without a pause.

Six exact Core data/query declarations now have local acceptance: Context
Create/Get/GetAll/RemoveDataModel and Element GetElementById/QuerySelector.
The native creation overload preserves null-register/false defaults and
allowMissingVariables. Two added query groups verify document breadth-first
ID lookup, descendant depth-first selectors, detached roots, special tokens,
duplicate IDs, non-DOM exclusions and expired receivers.
`core-query-runtime.log` passes all 15 DOM groups after the full 708-PASS
package run; no new full-package total is inferred. The Core ledger now retains
549 records: 397 local, 20 partial and 132 pending. Continue its remaining
operations and all nineteen acceptance groups. The report is
`../audit/6.3/core-data-query-acceptance.md`.

### Task 5: Document scripting and custom extension surface

**Files:** `native/rmlui-script-*`, `native/rmlui-plugin-*`,
`native/rmlui-factory-*`, `src/scripts.ts`, `src/plugins.ts`,
`src/factory.ts`, typed native mesh/resource APIs and tests.

**Interfaces:** Optional document script host configured before document load;
named handlers and explicitly enabled trusted inline/external JavaScript.
Expose scoped `document`, `context` and live event facades. Add managed Lua
compatibility with source/file execution and typed calls, without raw Lua state
pointers. Script modes must not overwrite each other's global body/listener
instancers.

Expose all nine Factory registration categories and Plugin notifications using
native-owned adapters. Custom drawing uses native meshes/resource handles;
buffers retain storage and snapshot at submission.

- [ ] Red tests cover source order, `on*`, external script paths, exceptions,
  event cancellation, document teardown and Node/Lua mode selection.
- [ ] Implement the host and managed Lua boundary; expose accurate source names
  and line offsets. A VM context is not a security boundary.
- [ ] Implement every Factory/plugin row in the module audit: creation,
  replacement/unregister, callbacks, release, custom property/parser/XML/data
  adapters. Document the JS equivalent of templates/inheritance explicitly.
- [ ] Test self-removal, late callbacks, invalid instances, thrown callbacks,
  buffer leases and custom element/decorator rendering.
- [ ] Verify Lua application code actually executes; a JS port is not Lua
  compatibility evidence.
- [ ] Independent review of the extension ledger and callback ownership.

### Task 6: Optional libraries, Debugger and font engines

**Files:** `tools/dependencies/`, manifest and `binding.gyp`,
`native/runtime/rmlui-debugger.*`, `native/fonts/`, optional element bindings,
`src/runtime/debugger.ts`, `src/fonts/`, `src/runtime/capabilities.ts`
and tests.

**Interfaces:** `Debugger.initialise(host)`, `shutdown()`, `setContext(target)`,
`setVisible(boolean)`, `isVisible()`; runtime selects default FreeType,
HarfBuzz or bitmap font engine before initialization. Capability records
separate compiled modules from runtime availability. SVG and Lottie use
upstream elements/decorators; expose their public element controls.

Debugger now has a local macOS arm64 checkpoint:
[Native contracts](../audit/6.3/debugger-native-contracts.md) retain six exact
declaration routes, 18 Debugger scenarios and 95 dependent scenarios. Static
Native allocators protect retired hooks and borrowed Factory handles; context
release and internal-document guards preserve plugin lifetime. Four-language
guides and TSDoc are present. This does not complete Task 6 or its independent
review; SVG/Lottie and alternate font configuration acceptance remain pending.

- [ ] Pin actual compatible archive releases/commits, digests, options and
  transitive dependencies for LunaSVG, rlottie, HarfBuzz and Lua.
- [ ] Integrate upstream Debugger/SVG/Lottie/Lua source groups, HarfBuzz engine
  sources without sample `main`, bitmap engine and shared FreeType linkage.
- [ ] Red tests prove all five Debugger operations, separate host/target,
  data reflection, logs, shutdown and 1×/2× interaction.
- [ ] Test SVG channels/alpha/resize/reload; Lottie changing frame/playback;
  HarfBuzz shaping/ligatures and bitmap atlas/kerning. Compare native engine
  results rather than checking just nonempty text.
- [ ] Verify feature configurations sequentially in the existing build tree,
  including missing dependency failures, combined modules, and font selection.
- [ ] Independent module/build and resource-lifetime review.

### Task 7: Full SFML render-interface semantics

**Files:** split renderer into geometry/clip/layers/effects/shaders units as
needed, `native/render-interface-sfml.*`, native test probes and pixel tests.

**Interfaces:** `RenderInterfaceSFML::BeginFrame()` / `EndFrame()` with exception
rollback around context rendering; readable owned layer zero, transparent RmlUi
base composited over host drawing. All 21 upstream virtual signatures retained.
Typed immutable filter/shader/mask records preserve capture coordinates and
full transforms.

- [ ] Red protocol/pixel tests cover base/nonbase/self composites, Blend/Replace,
  clipping toggles, deep/overlapping intersection and saved snapshots.
- [ ] Use RAII layers, size-aware bounded pooling and full 4×4 vertex shaders;
  explicitly convert vertices during one-time native de-indexing.
- [ ] Implement all ten filters plus saved mask, with premultiplied alpha,
  ordered chains, bounded samples and scale-correct blur/drop shadow.
- [ ] Implement linear/radial/conic/repeating gradients and `shader: creation`
  using the exact dictionaries/coordinates in renderer review. Define behavior
  beyond 16 color stops and degenerate stops rather than silently dropping them.
- [ ] Test foreground/backdrop/mask combinations, asymmetric Y orientation,
  transparent boundaries, perspective interpolation and transformed clips.
- [ ] Test allocation/read/shader failures and host-view restoration. No
  nonzero handle may silently represent an unavailable effect.
- [ ] Independent review using all renderer acceptance gates and native-only
  geometry/SFML-only rendering constraints.

### Task 8: System, resource and text-input integration

**Files:** system/file/text-input adapters, native platform sources, TS
configuration and callback contracts, tests.

**Interfaces:** Configurable log/translation/resource providers with lifetime
ownership; UTF-8 clipboard conversion; direct TextInputHandler/TextInputContext
facades for selection, composition, replacement, caret bounds and focus.
Native platform bridges feed the same contract for actual IME operation.

- [ ] Red tests check each System/File/TextInput virtual from renderer review.
- [ ] Implement UTF-8 via SFML's explicit conversions, retaining clipboard
  contents when performing any authorized round-trip test.
- [ ] Validate short reads, seek errors, embedded resources, relative URLs and
  callback errors without blocking async operations inside synchronous virtuals.
- [ ] Implement composition/platform hooks, verify candidate positioning and
  Unicode ranges, and distinguish real platform-device evidence from synthetic
  API tests. Final-text events alone do not pass IME acceptance.
- [ ] Independent platform/lifecycle review; untested OS checks remain pending.

### Task 9: Official applications and visual acceptance

**Files:** independent example scripts/adapters/resources, example manifest,
native test/capture harness and acceptance ledger.

**Interfaces:** Each of 20 upstream applications has its own entry with original
resource paths, controls, expected behavior, bounded exit and screenshot.
VisualTests remain a separate 113-page corpus with actual comparisons/assertions.

- [ ] Port/verify basic animation, benchmark, bitmap_font, custom_log,
  data_binding, demo, drag, effects, harfbuzz, ime, load_document, lottie,
  svg, transform, tree_view and variables.
- [ ] Port/verify tutorial drag/template, invaders and lua_invaders, including
  actual game and Lua behavior. Preserve original resource and script structure.
- [ ] Add F8 Debugger where the upstream shell supports it; preserve all other
  controls without conflicts.
- [ ] Run per-application scripted interactions and state assertions.
- [x] Run all VisualTests with independent content-positive assertions and
  reference comparisons; record pass/fail/platform limitation for every page.
- [ ] Independent sample/visual review; loading-only results remain smoke checks.

### Task 10: Documentation, editor, packaging and final acceptance

**Files:** four-language package READMEs/TSDoc/guides/example pages,
`packages/sfmljs-rmlui-vscode`, package-local build helpers,
`.github/workflows`, site generation/tests and final capability ledger.

- [x] Synchronize all public declarations, behavioral defaults, limits and
  examples across four languages. Verify site/API navigation and actual pages.
- [x] Align editor completions/hover/diagnostics with real 6.3 supported syntax,
  document installation and commands, and verify test/build/VSIX contents.
- [x] Fix source-package install/build sequencing using shipped files; verify
  dependency and addon inventory without isolated installs.
- [x] Add dedicated RmlUi/editor CI and publication-verification gates; update
  action runtimes when required. Do not publish artifacts or tags.
- [ ] Run full native/TS/lint/type/runtime checks, independent task rechecks
  justified by integration changes, site build/link checks, example acceptance,
  and available platform jobs. Record unavailable evidence explicitly.
- [ ] Independent whole-change review against the complete audit, including
  every deferred finding and representation ruling.
- [ ] Only after all required work passes, stage task-owned files, commit and
  perform the user's previously authorized push. Preserve unrelated changes;
  never force push or count incomplete acceptance as permission to finish.

### Task 3 continuation: native char input and cursor control

`Context.processTextInputChar(byte)` invokes the exact upstream char overload.
Runtime acceptance covers all 256 bytes, control characters, strict argument
validation and destroyed contexts. The existing `enableMouseCursor` native/JS
route now has repeated-switch, strict-boolean and destroyed-context coverage.
Its OS appearance and custom SystemInterface observation remain platform work.
Four-language document guides and source comments explain both APIs.

`context-char-cursor-package.log` records successful lint, cpplint, native/TS
builds, consumer types and 45 runtime files: 388 PASS, zero FAIL. Native naming
and formatting pass; four source-comment tests pass. Evidence and distinct
review use `/tmp/rmlui-63-completion/context-char-cursor-*`.

### Task 9 continuation: original native game applications

Both original Invaders applications execute their unchanged C++ game sources.
Lua Invaders also executes the original documents, startup script and Game
table registrations. Local macOS acceptance covers ten standalone native
reference scenarios, two integrated game/lifecycle scenarios, 29 Lua regression
scenarios, 30 site/comment tests and native screenshots. All four galleries
contain 29 entries. Instancers are reconstructed on runtime restart so property
definitions cannot retain old parser pointers.

[The game acceptance supplement](../audit/6.3/official-invaders-acceptance.md),
operation ledger and fingerprinted evidence distinguish local native, binding
and platform results. Linux is unverified and the Windows application loader
requires implementation. Next-wave source behavior is independently verified;
no full-wave keyboard play-through is claimed. The 113 VisualTests, physical
IME, remaining platform work, current whole checks and independent whole-change
review still keep Task 9 and whole-scope acceptance open.

The recovered Core ledger keeps 549 declarations: 348 locally verified, 17
partial and 184 pending. Supplemental values keep 1,341 declarations: 1,289
locally verified, 14 partial, 37 pending and one reviewed opaque forward
declaration. All evidence paths exist and all keys are unique.

Next: every ElementUtilities operation and PositionAnchor, remaining Factory/
utility/customization interfaces, the 19 Core acceptance groups and distinct
Task 3 review, then Tasks 4–10. Whole-plan acceptance remains incomplete.

### Task 3 continuation: ElementUtilities

All thirteen `ElementUtilities` static operations and all eight native
`PositionAnchor` values now have typed checked routes. Native clipping queries
return both nullable scissor regions and owned geometry/matrix snapshots.
Positive data-view/controller construction remains Task 4; its native route,
no-model result and callback/lifetime rejection are verified. Clip-mask
pointer-equality operators and direct RenderManager mask/state APIs remain
explicit pending operations.

`element-utilities-package.log` records successful lint, cpplint, native/TS
builds, consumer types and 46 runtime files: 400 PASS, zero FAIL. Twelve focused
utility cases cover search order, kerning, box/layout/anchor behavior,
transformed bounds and depth failure, masks, GC/destruction and reentry.
Native naming/formatting and diff checks pass. Forty-one site tests and site
lint pass for four-language comments, guides, navigation and example galleries.
The bounded element inspector verifies all four corners and has a visually
inspected, content-positive 760×480 screenshot.

The distinct review and exact operation evidence use
`/tmp/rmlui-63-completion/element-utilities-*`. The recovered ledger retains 549
Core records: 372 locally verified, 19 partial and 158 pending. Supplemental
values retain 1,341 records: 1,294 locally verified, 15 partial, 31 pending and
one reviewed opaque forward declaration. Keys are unique; evidence paths
exist. Forward references do not promote their corresponding class operations.

Next: remaining Factory/utility/customization and RenderManager mask/state
operations, nineteen Core acceptance groups and distinct Task 3 review, then
Tasks 4–10. Whole-plan acceptance remains incomplete; no staging or push.

### Task 3 continuation: RenderManager state and clipping

Viewport, scissor, transform, both native clip-mask overloads, state save/restore
and reset have typed checked routes. `RenderState` exposes all three fields;
mask equality invokes native comparison with geometry and matrix reference
identity, with documented independent-snapshot ownership. Integer viewport and
scissor values retain full int32 precision. Matrices use fixed, unshared finite
Float32Array storage with subview support.

Submitted native copies survive source document closure and JS wrapper GC.
Active borrowed-manager masks retain a native-only lease without retaining JS
wrappers. Replacement, disabling, reset and manager release clear the lease.
Shutdown releases mask geometry before resource invalidation and manager
destruction. Decorator rendering can read/submit state; events can read state
but cannot mutate it. Accessors run before final manager/resource validation.

`render-state-package.log` records successful lint, cpplint, native/TS builds,
consumer types and 47 runtime files: 415 PASS, zero FAIL. Fifteen focused cases
include real scissor/transform/mask pixels, both overloads, snapshot restoration,
integer/matrix boundaries, late getters, document closure, borrowed-manager GC,
owned-resource GC and callback scopes. Naming, formatting and diff checks pass.
Site lint and 41 content/example/four-language source-comment tests pass.
The bounded inspector verifies four corners, native clipped marker rendering
and state restoration; its 760×480 screenshot is visually and numerically
verified. Evidence and the distinct source review use
`/tmp/rmlui-63-completion/render-state-*`.

The exact ledger retains 549 Core records: 372 locally verified, 19 partial and
158 pending. Supplemental values retain 1,341 records: 1,316 locally verified,
14 partial, ten pending and one reviewed opaque forward declaration. Keys are
unique and all evidence paths exist. `scope_complete` remains false.

Next: RenderManager layers, filter-list consumption, saved mask-image filters,
callback textures and TextureDatabase/RenderManagerAccess reconciliation;
remaining Factory/utility/customization interfaces, nineteen Core acceptance
groups and distinct Task 3 review; Tasks 4–10 and final authorized push.
No staging, commit, tag or publication has occurred.

### Task 3 continuation: RenderManager layers and saved alpha masks

All six native layer operations have checked typed routes. Opaque tokens
preserve manager identity and active target lifetime; target serials reject
popped tokens after pool reuse. Push/pop stacks retain native managers without
rooting JS wrappers. Context rendering and PrepareRender reject unbalanced
stacks or another manager's active target.

FilterHandleList supplies ordered native handles with resource leases and
pre-composition checks for released/foreign filters. The renderer consumes saved
alpha-mask snapshots at their captured scissor position. Premultiplied blend,
clipped replacement, self-blur, source-layer reuse and positioned masks have
actual SFML pixel evidence.

Decorator/filter/font-effect callback exits unwind layers opened by that
scope, report unbalanced successful returns and preserve existing exceptions.
Callbacks cannot pop upstream effect layers or layers owned by an outer scope.
Events permit reads and reject mutations. Shutdown drains owned targets before
manager/resource invalidation.

`render-layers-package.log` records successful lint, cpplint, native/TS builds,
consumer types and 48 runtime files: 424 PASS and zero FAIL. Nine focused cases
include pooled handle validity, nesting, self-composition, invalid filter
resources, mask pixels, event guards, upstream ownership, callback recovery,
wrapper GC and shutdown. Native format/naming and diff checks pass. Site lint
and all 41 content/gallery/four-language source-comment checks pass.

The layer composition application exercises two shape positions in six frames.
Its 760×480 screenshot is visually and numerically verified. Four-language
guides and galleries include its source, controls, command, screenshot and a
stable section anchor. The distinct review and evidence are under
`/tmp/rmlui-63-completion/render-layers-*`.

The ledger still retains 549 Core declarations: 372 locally verified,
19 partial and 158 pending. Supplemental values retain 1,341 records:
1,322 locally verified, 14 partial, four pending and one reviewed opaque forward
declaration. These counts do not establish Task 3 or whole-plan acceptance.

Next: full CallbackTexture/CallbackTextureInterface/CallbackTextureSource
tables and MakeCallbackTexture, TextureDatabase/RenderManagerAccess
reconciliation, remaining Factory/utilities/customization and nineteen Core
acceptance groups; Tasks 4–10 and the authorized final push. No staging,
commit, tag or publication has occurred.

### Task 3 callback textures and private texture declarations

CallbackTexture now exposes default construction, native stable-index
InvalidHandle, validity, conversion through toTexture and idempotent release.
MakeCallbackTexture invokes a synchronous boolean generator through the scoped
native CallbackTextureInterface. GenerateTexture, SaveLayerAsTexture,
SetTextureHandle and GetRenderManager all have typed concrete representations.
Manual native handles use owned SFML tokens with manager/dimension checks and
once-only transfer; they are released by explicit release, GC or shutdown.

Submission runs against isolated native handle/dimension slots. Successful
callbacks commit once; false/throw rolls back before upstream failure caching.
Promise/nonboolean/missing submission errors propagate. Generation permits
only its scoped interface methods, protecting active native texture database
and compiled-geometry references against destructive or recursive reentry.
Shared byte buffers reject before copying. Instancing can acquire and load
callback textures while submission retains the strict generation guard.

Texture aliases retain unique native resources and visible callback owner
edges. Release/generation checks precede database-index access. Sources share
their callback owner across native manager caches so temporary view GC cannot
discard their generators. Native move/deleted-copy declarations use JS
reference identity without copying ownership. Unused manager release evicts
only that manager's cached resources and preserves the source's callback.
Decorator.AddTexture/GetTexture retain and return checked texture aliases
through the existing GC-visible decorator owner; callback/decorator cycles
collect. Shutdown clears edges and releases textures before manager deletion.

The distinct review reconciles TextureDatabase's exact native composition and
every private RenderManagerAccess friend route. No public application or
customization operation was excluded as internal. The compiler inventory's
missing conversion cursors have explicit additional source records for
CallbackTexture.operator Texture and UniqueRenderResource.operator bool.

`callback-textures-package-final.log` records successful lint, cpplint,
native/TS builds, consumer type fixtures and 49 runtime files: 437 PASS and zero
FAIL. Thirteen focused cases cover actual premultiplied/window-scissor pixels,
submission rollback/reentry, native index reuse, source/cache/decorator GC,
instancing, manager retirement, owned handle transfer, shared input rejection
and runtime restart. Native format/naming and repository diff checks pass.
Site lint and all 41 content/gallery/four-language comment checks pass.

The callback-texture application exercises cached generation and regeneration
for six frames and captures a visually verified 760×480 screenshot. The
four-language render-state/resource guides and galleries include its methods,
ownership rules, source, command, controls and screenshot. The resource guides
also link the already verified general Stream input. The distinct review,
ledger and verification evidence are in
`/tmp/rmlui-63-completion/callback-textures-*`.

The ledger retains 549 Core records: 375 locally verified, 19 partial and 155
pending. Supplemental values retain 1,366 records: 1,359 locally verified, six
partial and one reviewed opaque forward declaration. Keys are unique and all
evidence paths exist. `scope_complete` remains false; these results do not
establish whole Core or whole-plan acceptance.

Next: remaining Factory/utilities/customization declarations, nineteen Core
acceptance groups and Tasks 4–10, followed by the authorized push together
with the VS Code extension. No staging, commit, tag or publication has occurred.

### Event instancer continuation — local acceptance

Listener follow-up is recorded under the listener acceptance section below.

Factory event registration and instancing now use typed native EventInstancer
adapters. Delegated allocations retain their native release chain through
ownership transfer and registry replacement. Owned events support checked
phase/current-element setters, typed parameters and explicit native release.
Dispatch leases expire independently and cannot release an owned native Event.
Target/current/parameter observer checks reject destroyed element pointers.

A distinct controller review found and corrected active default-action release
and transfer, retained callback edges on transferred source handles, and
callback edges remaining on retained event snapshots after shutdown. These
failures have observed red logs and checked regressions. Default actions retain
referenced wrappers on their active stack. Native destruction does not invoke
JS; copied type/id release notices execute at a safe runtime boundary.

`event-instancers-package-final.log` records exit zero for lint, cpplint,
native/TS builds, consumer fixtures and 54 runtime files: 480 PASS, zero FAIL.
Nine focused event-instancer scenarios pass, including nested checkbox default
actions, real dispatch and allocation chains, getter invalidation, exact release,
GC cycles, source-handle cleanup and runtime shutdown/restart. Four-language
content/gallery checks record 41 PASS, zero FAIL. Native format/naming and
repository diff checks pass. The six-frame factory application verifies matching
context/input/event allocation and release, owned stream parsing, native dispatch
and nonblank edited pixels. Its 760×480 screenshot is visually inspected, and
its exit log has no leaking-texture or memory-corruption diagnostic.

The declaration ledger retains 549 Core records: 380 locally verified, 19
partial and 150 pending. Supplemental values now retain 1,448 records: 1,433
locally verified, eight partial, six pending and one opaque forward declaration.
EventInstancer retains all six compiler records; its Event forward declaration
remains partial because the default no-argument Event constructor is outstanding.
Keys are unique, evidence paths exist, and `scope_complete` remains false.

Next: EventListener and DataView/DataController instancers, the default Event
constructor and remaining Core utilities/customization, nineteen Core acceptance
groups including invalid root/document instancer failure paths, Tasks 4–10 and
the final authorized push with the VS Code extension. No staging, commit, tag
or publication has occurred.

### Task 3 continuation: full Factory table, parsing and caches

The Factory inventory now retains all 56 compiler records: 24 forward
declarations, the Factory class and 31 public static operations. The six
existing effect-instancer registration/lookup rows are replaced by their exact
full-table records without duplication. Forward declarations do not promote
the referred class operations. Thirteen Factory operations remain pending.

Factory exposes checked native element instancing with independent instancer
and tag names, owned attributes, preserved native subtype, detached ownership
and native unknown-name fallback. Text and stream instancing use native
translation, entity decoding, parser/source URL and current-cursor semantics.
Borrowed attribute pointers and parser reentry reject. Tween attributes retain
callbacks under visible element ownership; detached cycles remain collectable.

Text/file/stream stylesheet creation returns native-owned uncompiled containers
or null. File open failure is checked before invoking the native stream parser;
embedded NUL filenames reject. No parsed rules return null, while syntax
diagnostics can still produce partial rules. Host read exceptions preserve
identity and cannot produce a container. Both real native cache clears have
file-edit/reload evidence and preserve already loaded documents. Structural
data-view names are exact native lookups and copied array snapshots.

`factory-package.log` records successful lint, cpplint, native/TS builds,
consumer fixtures and all 50 runtime files: 445 PASS, zero FAIL.
`factory-runtime-final.log` verifies all nine Factory cases, including the
additional test-only cache reload case: 446 unique current runtime checks.
Final source lint, native formatting/naming and diff checks pass. Site lint
and all 41 content/gallery/four-language source-comment checks pass.

The six-frame element-factory exercise creates real native input and parsed
children, edits values, clears caches and checks native styling. Its 760×480
screenshot is visually verified and contains nonblank rendered content.
Four-language resource guides and galleries provide API contracts, source,
command, controls and screenshot. The distinct source review, complete Factory
table and verification evidence use `/tmp/rmlui-63-completion/factory-*`.

The ledger retains 549 Core records: 375 locally verified, 19 partial and 155
pending. Supplemental values now retain 1,416 records: 1,395 locally verified,
seven partial, 13 pending and one reviewed opaque forward declaration.
Keys are unique and all evidence paths exist. `scope_complete` remains false.

Next: native Context/Element/Event/Listener/DataView/DataController instancer
adapters and direct Factory creation, remaining utilities/customization,
nineteen Core acceptance groups, Tasks 4–10 and final authorized push with
the VS Code extension. No staging, commit, tag or publication has occurred.

### Task 3 continuation: native element instancers

All 18 compiler records in `Core/ElementInstancer.h` now have exact
representations and local evidence. Factory element registration and lookup
are verified, including lowercase registration, exact lookup, native `*`
fallback, nullable registrations, adapter identity and replacement lifetime.
The Factory table still has eleven pending operations.

`ElementInstancer` exposes typed callback allocation, direct native allocation
and checked explicit release. Plain/text pools and native generic
input/progress/document allocations preserve their actual subtypes.
Factory applies attributes and plugin notifications; raw instancer calls retain
their original behavior. Borrowed, attached, active and untracked return values
reject before ownership transfer.

Each allocation receives a native relay before first instancer assignment.
This preserves upstream `Element::SetInstancer`'s first-only semantics and
retains the original allocator through nested adapters and cloning.
Native destruction stays synchronous. Optional release observers receive
copied pre-destruction tag/attributes at a safe boundary afterwards.
No JS runs in native destruction, including GC inside an allocation callback.
Observer exceptions propagate without preventing native destruction.
The inherited native text clone copies children and leaves its own raw string
empty; the fixture follows that upstream behavior.

Registered adapters retain callbacks until shutdown. Unregistered adapters
follow native tree ownership or visible detached-owner edges, so cycles collect.
Shutdown destroys elements before native pools and clears instancer callbacks
after upstream Factory shutdown. Environment cleanup invokes no JS.
The distinct review records these ownership and source-level contracts.

`element-instancers-package-final.log` records successful lint, cpplint,
native/TS builds, consumer fixtures and 51 runtime files: 455 PASS, zero FAIL.
Nine focused scenarios cover parser participation, replacement, cloning,
nested release order, invalid returns, reentry, callback exceptions,
attached/detached GC, GC inside callbacks, context removal and runtime restart.
Native formatting/naming and diff checks pass. Site lint and all 41
content/gallery/four-language source-contract checks pass.

The updated six-frame element-factory application verifies one custom native
input allocation and one release, edited values and actual nonblank pixels.
Its visually checked 760×480 screenshot uses an eight-bit stencil window.
Four-language resource guides and gallery entries document adapter ownership,
nullable registrations and release timing.

The ledger retains 549 Core records: 375 locally verified, 19 partial and 155
pending. Supplemental values retain 1,434 records: 1,415 locally verified,
seven partial, eleven pending and one reviewed opaque forward declaration.
Keys are unique and all evidence paths exist. `scope_complete` remains false.

Next: Context/Event/Listener/DataView/DataController instancers,
owned document-stream creation, remaining utilities/customization, nineteen
Core acceptance groups, Tasks 4–10 and final authorized push with the VS Code
extension. No staging, commit, tag or publication has occurred.

### Task 3 continuation: context instancers and owned document streams

The eight exact compiler records in `Core/ContextInstancer.h` now have reviewed
representations and local evidence. Factory context registration, direct
creation and `InstanceDocumentStream` are verified. Eight Factory operations
remain pending: event, listener, data-view and data-controller registration
and instancing.

`ContextInstancer` exposes the native constructor, typed callback delegation
and checked explicit release. Returned allocations retain ordered native
adapter provenance and must match the requested name, render manager and
text-input handler. Core's default input handler is non-null; nested adapters
receive a canonical checked borrowed capability. Platform input-handler
callbacks and native TextInputContext operations remain in Task 8.

Factory/direct context allocations remain outside Core registration and retain
native constructor dimension/density defaults. A V8-visible native owner edge
retains descendants while allowing context/listener closure cycles to collect.
Reparenting updates those edges. Owned `remove()` releases the allocation
without removing a same-name registered context. Registered adapters and their
replacements survive until shutdown. Native destruction remains synchronous;
copied name release notices run outer-to-inner at a later safe boundary.

Owned document streams use native XML/header processing and source URLs without
context insertion or load notification. The base tag selects the allocator;
source markup uses registered XML handlers. Null allocation/subtype failures,
host read exceptions and native partial-document behavior are preserved.
Context removal destroys owned document trees before their borrowed resources.

The real factory application exposed a font-cache shutdown crash after successful
native context/input release. A bounded regression reproduced manager destruction
with live native glyph CallbackTexture entries. Binding-owned managers now live
until runtime shutdown; shutdown releases font layers and cached glyph textures
before manager resources, after contexts and detached nodes are destroyed.
Global resource invalidation rejects independently owned live contexts because
upstream invalidation visits only registered Core contexts.

`context-instancers-package-final.log` records successful lint, cpplint,
native/TS builds, consumer fixtures and 53 runtime files: 471 PASS, zero FAIL.
Eleven focused context scenarios and five document scenarios cover native
creation, ownership, reentry, exceptions, GC, reparenting, font caches and
runtime restart. Final native format/naming and repository diff checks pass.
All 41 four-language/content/gallery checks pass. The six-frame factory
application verifies one native context/input allocation and matching release,
owned stream parsing, child transfer, edited values and nonblank pixels.
Its visually inspected 760×480 screenshot and exit log have no leaking-texture
or memory-corruption diagnostics.

The declaration ledger retains 549 Core records: 375 locally verified, 19
partial and 155 pending. Supplemental values retain 1,442 records: 1,426 locally
verified, seven partial, eight pending and one opaque forward declaration.
Keys are unique and evidence paths exist. `scope_complete` remains false.

Next: Event/Listener/DataView/DataController instancers, remaining utilities
and customization, nineteen Core acceptance groups including invalid native
root/document instancer failure paths, Tasks 4–10 and final authorized push
with the VS Code extension. No staging, commit, tag or publication has occurred.

### Event listener instancers — local acceptance

EventListener and EventListenerInstancer expose typed native event processing,
multi-element/multi-type/capture registrations, dispatcher deduplication and
native OnAttach/OnDetach notifications. Lifecycle callbacks receive element
identity copied at attachment time after native frames return; manual hook
methods deliver notifications without forging dispatcher entries.

Factory registration accepts null, retains the current allocator through
replacement or shutdown and instantiates listeners for real RML on* attributes.
Values pass unchanged without evaluation. Attribute replacement/removal detaches
the old listener. Raw native results bridge ownership until OnAttach or the
explicit result facade. Element id/tag reads and listener creation are allowed
during instancing; DOM and registry mutation are rejected.

Native-owned trees retain callback arrays strongly. Detached trees and explicitly
held listener facades retain them through visible V8 edges, so closure cycles can
collect. Attachment snapshots prevent GC-driven iterator invalidation during
ownership refresh. Pending lifecycle notices retain callbacks through delivery.
Manual processing preserves the source event's native owner, creates an expiring
lease and rejects active event release/transfer/reentry. Listener release requires
all attachments removed and no active callback. Native deletion invalidates
already collected dispatcher observers. Shutdown clears listener and instancer
callback edges even when facade objects remain reachable.

The distinct source/interface review is in
`/tmp/rmlui-63-completion/listener-instancers-review.md`.
`listener-package-final.log` records successful lint, cpplint, native/TS builds,
consumer checks and 55 runtime files: 487 PASS, zero FAIL.
Seven focused listener groups and 41 content/gallery/four-language checks pass.
Final native format/naming and diff checks pass. The six-frame factory application
exercises native inline attribute replacement and matching allocation/attach/
detach counts; its inspected 760×480 screenshot shows the edited field and result.

Core retains 549 declarations: 380 locally verified, 19 partial, 150 pending.
Supplemental declarations total 1,459: 1,444 locally verified, ten partial, four
pending and one opaque forward declaration. Eleven listener header records are
retained, including separate partial Event/Element forward declarations.
All keys remain unique and every evidence path exists. `scope_complete` is false.

Continue with default Event construction, native context root/document instancer
failure paths, remaining Core customization/19 acceptance groups, native data
models together with DataView/DataController instancers, Tasks 4–10 and final
authorized push with the VS Code extension. No staging, commit, push, tag or
publication has occurred.

### Default events and context construction — local acceptance

`new RmlEvent()` invokes the real default native Event constructor, including
null target/current, empty type/parameters, Invalid id, None phase,
noninterruptible propagation and zero screen coordinates. Public target typing
is nullable. Owned events retain independent current-element observers;
replacement and clearing remove the old observation. Destroyed references
reject native access while explicit release remains available.
Manual listeners receive their own expiring lease, root the current element
and reject release while processing. Both native equality overloads are
represented by the existing retained string/id comparison, including after
release. Exact GetParameter pointer/templates and ScriptInterface remain partial.

Context construction now checks root allocation and cursor-proxy document type
before dereference through the pinned dependency patch. Native constructor
unwinding destroys partial element owners. A captured first host exception keeps
its identity instead of being replaced by the secondary native failure.
Subsequent JS notifications follow the existing first-error suppression rule;
native destruction still completes.

Validation:

- All 21 root/body construction scenarios reproduced SIGSEGV before the fix;
  final coverage passes across default registered, custom registered and owned
  creation, including callback errors, wrong document type, partial-root
  destruction and successful recovery.
- Five default Event groups pass: upstream defaults, conversions, observer
  replacement/clear/destruction, manual leases, release guards, GC and restart.
- Full `npm test` exits zero with 57 runtime files and 513 PASS / zero FAIL,
  including lint, cpplint, native/TypeScript build and consumer types.
- All 41 content/gallery/four-language contracts pass. Native formatting and
  four-unit naming checks pass. Reapplying dependency patches preserves the
  Context.cpp checksum.
- The actual factory application runs six exercised frames with default Event
  and manual listener checks, matching native allocation/release and listener
  attachment/detachment counts.

Review: `/tmp/rmlui-63-completion/default-events-context-review.md`.
Ledger: 549 Core declarations, 391 locally verified, 20 partial and 138 pending;
1,459 supplemental declarations, 1,444 locally verified, ten partial,
four pending and one opaque forward declaration. Unique keys and evidence paths
are validated. `scope_complete` remains false.

The five public data dependency headers contain 131 compiler declarations
to review, including template declarations/definitions and callback aliases.
Continue immediately with Task 4 native data storage, schemas, models and
DataView/DataController adapters; remaining Core customization, nineteen
acceptance groups and Tasks 5–10 remain. No staging, commit or push has occurred.

### Performance architecture — local acceptance

The separate [performance architecture plan](2026-11-16-rmlui-performance-architecture.md)
has local macOS arm64 acceptance for Tasks 1–8. Its
[result report](../audit/6.3/architecture-performance-results.md) retains 37 successful
cases, 95 workloads and 7,600 timed CPU frames with zero failed cases.
All 75 current runtime suite files execute with 690 literal PASS lines and zero
FAIL lines. Native/TypeScript builds, consumer types, lint, cpplint, all 148 native
format checks, 87 compilation-unit naming checks and four-language public
documentation contracts pass.

Explicit shared commands, batch views, incremental ownership maintenance,
consecutive compatible geometry batching and native asynchronous resource
preloading have runtime evidence. The 100k full-dirty shared frame is
140.872/146.825 ms p50/p95 with 6/0 crossings; the explicitly selected batch-view
frame is 103.643/109.954 ms with 6/1 crossings. Both render ten compatible geometry
batches. Stable data frames have no whole-scene ownership visits or geometry
uploads. Retained views, command snapshots, legacy callback ordering, pixels,
resource generations and failed/cancelled preload behavior remain covered.

This acceptance does not establish full-engine zero allocation, startup
performance, GPU completion time, other platforms or whole-module integration.
Large single-scalar/default-view fixtures retain significant one-time document
construction costs, recorded in the result report. Legacy getter, transform and
view APIs retain their per-evaluation callbacks and side effects.

The independent declaration state is unchanged: Core 549 records, 391 locally
verified, 20 partial and 138 pending; Data 131 records, 48 locally verified,
79 partial and four pending. `scope_complete` remains false. Continue Core
customization and nineteen acceptance groups, complete Task 4 declaration
coverage and Tasks 5–10. No full-integration checkbox is promoted by performance
measurements.

### Task 4 continuation: definitions, pointer traits and selected families

Checked `DataDefinition` reflection covers unregistered inferred/function/
literal definitions while preserving canonical registered schema identity.
`DataSchema.underlying`, runtime `DataPointerTraits` and actual caller-selected
family registration are implemented. Duplicate native identities do not root
rejected callbacks. Private function-alias underlying reflection is safe after
model removal. Seven focused groups and a compiled upstream value/raw/unique/
shared pointer probe pass.

`data-family-package.log` records `npm test` exit zero: 77 runtime files,
698 PASS and zero FAIL, native/TypeScript builds, consumer types, lint and
cpplint. All 81 site tests and final four-language declaration/type checks
pass. Changed native formatting and identifier naming pass. The distinct
review is `/tmp/rmlui-63-completion/data-definition-review.md`; durable
[acceptance evidence](../audit/6.3/data-definition-acceptance.md) links the
operation ledger. All 131 ids remain: 59 local, 72 partial, zero pending.
The remaining exact constructor/template contracts are still partial.

The earlier scalar startup investigation also has scoped local evidence.
The upstream dependency map now groups dependent views by variable and appends
to a vector, retaining native pointer deduplication and ordering. The actual
1k/10k construction regression passes with a median ratio of 10.238.
Serial 100k/80-frame native/getter/transform fixtures record setup times
277.182/289.300/368.193 ms and full CPU p50/p95
144.780/149.972, 166.305/172.903 and 194.993/201.539 ms respectively.
These raw results precede the definition/family changes above. Existing
performance report fingerprints and historical samples remain unchanged.

Continue Core's exact ledger and nineteen acceptance groups, remaining Task 4
constructor/template acceptance and Tasks 5–10. No whole-plan completion,
staging, commit, push or publication is established by this step.

### Core element inspection — local acceptance

The three checked Element inspection methods now invoke their native
implementations: dispatcher type/count summaries, nearest scroll container
including self/containment, and attached model retrieval through the existing
pointer index. Seventeen DOM groups and fourteen layout groups pass, together
with consumer types, builds, style checks and all four source-comment locales.
Repeated model queries record 1,000/0 bidirectional calls and zero ownership
visits. Four-language element-state guides document association and lifetime.

[Exact acceptance](../audit/6.3/core-element-inspection-acceptance.md) retains
the three original declaration keys. Core remains 549 records: 400 locally
verified, 20 partial and 129 pending; scope incomplete. The separate Data
ledger retains 131 locally verified declarations. Continue the remaining Core
groups and Tasks 5–10 without a milestone approval pause.

### Core manual offsets and property iterator — local acceptance

`setOffset` preserves native layout/scroll/fixed behavior, checks finite values
and strict ancestor/null pointer ownership, and retains existing detached-tree
cleanup. `iterateLocalProperties` performs one native traversal with copied
name/property pairs, preserving class/inline/custom/shorthand and inheritance
filtering. Sixteen layout and twelve property groups pass. Consumer types,
four-language comments/guides and native style checks pass.

[Exact acceptance](../audit/6.3/core-offset-iterator-acceptance.md) retains two
method keys and distinct source review. Core remains 549 declarations: 402
locally verified, 20 partial and 127 pending. Continue Core's remaining
dependent interfaces and nineteen groups, then Tasks 5–10. No staging, commit,
push or publication is established by these local results.

### Core explicit data application and document flags — local acceptance

The positive explicit data-view/controller application now verifies dirty
updates, input synchronization, model events and removal/unregister. The
thirteen utility runtime groups pass; boolean return and invalid consumer types
pass. Twelve document enum records have exact numeric and native modal/focus/
scroll behavior evidence. Their acceptance records are
[data application](../audit/6.3/core-data-application-acceptance.md) and
[document flags](../audit/6.3/core-document-flags-acceptance.md).

Final `npm test` exits zero: 78 unique runtime suite files, 717 PASS, zero FAIL,
with lint/cpplint/native/TypeScript/type checks. Final three-unit native
format/naming checks pass. All 81 site tests pass; 33 task-owned tracked and
untracked files have an explicit clean whitespace scan. Later guide paragraphs
clarify construction and lifecycle without changing links or source contracts.

Core retains 549 unique keys: 416 locally verified, 18 partial and 115 pending.
Data retains 131 locally verified declarations. Scope is still incomplete.
Continue missing Core internal adapters, the nineteen acceptance groups,
document scripting/Lua/plugin, optional modules/fonts/Debugger, render/system/
IME/platform acceptance, twenty applications/visual corpus and final package/
editor/CI closure. No milestone pause, staging, commit or push is authorized
before those requirements are met.

### Core scroll and transform components — local acceptance

The checked scroll component retains all eight native operations and exact
orientation/size/property-update rules. Failed scrollbar, slider-child and
corner construction now throws before publishing component pointers and permits
retry. Transform state exposes const element views, independent native values,
column-major snapshots and a reusable one-entry batch buffer. Canonical
1,000-query access records one native token allocation. Matrix buffer leases
retain numerical storage only.

[Exact acceptance](../audit/6.3/core-scroll-transform-acceptance.md) covers the
two original accessor keys. Final package execution passes 79 unique runtime
suite files and 727 PASS with zero FAIL, including ten component groups; lint,
cpplint, builds and consumer types pass. Native format passes five source/header
files and compiler-backed naming passes four units.

Core retains 549 unique records: 418 locally verified, 18 partial and 113 pending.
Forward classes and independent scroll construction remain separate. Continue
the true EventDispatcher, ElementStyle and ElementBackgroundBorder interfaces,
then the nineteen Core acceptance groups and Tasks 5–10. No milestone pause,
staging, commit, push or publication is established by this local acceptance.

### Core event dispatcher and background components — local acceptance

The checked EventDispatcher shares existing function/typed listener registration
identity and retention. Recursive detachment includes non-DOM children and
native widget listeners. Static dispatch retains independent id/name, explicit
flags and default-action phases, with safe conversion and callback unwinding.
The shared callback adapter rejects non-functions before registration.

The checked ElementBackgroundBorder executes native Render/DirtyBackground/
DirtyBorder and snapshots native clipping geometry. Real pixel assertions cover
backgrounds, borders, dirty width changes and rounded clipping. Manager affinity,
effect reentry, empty managerless geometry, independent resource snapshots and
element/generation lifetime are checked.

[Exact acceptance](../audit/6.3/core-dependent-components-acceptance.md) promotes
only the two original accessor keys. Whole-package `npm test` exits zero with
81 unique runtime suite files, 743 PASS and zero FAIL; the subsequently added
rounded clip case passes separately and is not counted in 743. Site validation
passes 81 tests with zero failures/skips. Lint, cpplint, builds, types, six-file
native formatting and five-unit compiler naming checks pass.

Core retains 549 unique records: 420 locally verified, 18 partial and 111
pending. ElementStyle is the next dependent object; its real stateful
ComputeValues, reusable keyframe resolver and iterator contracts remain required.
Continue full Core nineteen-group acceptance and Tasks 5–10 without a milestone
pause, staging, commit, push or publication.

### Task 3 continuation: actual ElementStyle state and shared commands

`Element.getStyle()` now returns the actual element-owned native component.
Raw class/pseudo setters preserve upstream membership/override state and
explicit UpdateDefinition. Property/custom/shorthand maps, resolved/local/
specified lookups, full dictionary, numeric resolution, dirty transitions and
native-order snapshot iterators retain their separate contracts.

Stateful ComputeValues reuses existing owned native values, consumes real dirty
sets and propagates inherited child dependencies. Same-element output,
readonly/expired-font rejection, parent-before-child ordering and explicit
redirty-before-live-layout are documented and tested. The reusable keyframe
resolver owns optional shorthand cache, dependencies and output storage.
Separate review reproduced a shutdown callback-edge leak; the weak handle,
reset and teardown paths now remove both native storage and private JS edges.

Six raw style numeric opcodes reuse existing shared command planes and Native
batch scheduler. All six are checked at 1k/10k/100k for one submit, zero reverse
callbacks, zero ownership visits and no command backing allocation.
The final runtime suite has 82 files, 756 PASS and zero FAIL; eleven style
groups and seventeen command groups pass. Lint/cpplint/native/TS/types, seven
native-file formatting and three-unit naming checks pass. Site tests pass
81/81 with zero failures/skips and complete four-language parameter/return
comments.

[Exact acceptance](../audit/6.3/core-element-style-acceptance.md),
[raw performance samples](../audit/6.3/element-style-performance.json) and
[CSV](../audit/6.3/element-style-performance.csv) retain six matrix scenarios,
eighteen loads and 1,440 CPU frames; a paired same-fixture probe adds 160 frames.
At 100k all-dirty, paired Element and raw-style p50/p95 are
108.261/116.529 ms and 108.630/116.365 ms. Dirty crossings are 6/1, clean
crossings 5/0. Draw submissions remain 10; static uploads and ownership visits
remain zero. Native linear layout/allocation costs and GPU/platform scope are
still explicit limits. Initial clean-frame assertion failures are retained in
the raw attachment; corrected assertions pass all three sizes.

Only the original GetStyle accessor is promoted. Core retains 549 unique
records: 421 local, 18 partial and 110 pending; scope_complete remains false.
Next implement actual DocumentHeader/ProcessHeader and reconcile document
metadata and remaining constructors/templates/global dependencies, then full
Core nineteen-group acceptance and Tasks 5–10. Continue without a milestone
pause, staging, commit, push or publication.

### Task 3 continuation: actual DocumentHeader and ProcessHeader

DocumentHeader owns actual native strings and ordered template/RCSS/script
resources. Resource inputs preserve path/content, isInline=false and line=0
defaults. Native MergeHeader/MergePaths/MergeResources preserve source order,
source-relative template paths, literal resource paths and nonempty receiver
title/source precedence; self-merge snapshots the source.

replace and snapshot transfer all fields in one native entry. Ten thousand
RCSS plus ten thousand script records retain one entry, zero reverse callbacks
and zero element ownership visits for replace/snapshot/merge. Every JS accessor
finishes before receiver validation; constructor generation changes, stale
headers/documents and inherited output setters are guarded.

Document.processHeader calls real native template loading, document metadata,
RCSS precedence, script hooks and immediate hidden visibility. Empty titles
remain the document's own; no loadable RCSS preserves existing styles.
Context-free detached documents retain parsed media blocks without compiling
them, and retained containers apply correctly on context-owned documents.
Script hooks remain explicit Task 5 work; storing records is not execution.

[Exact acceptance](../audit/6.3/core-document-header-acceptance.md) covers seven
original keys. The final focused suite passes ten groups; full runtime passes
83 unique suite files, 766 PASS and zero FAIL. Lint/cpplint/native/TS/types,
four-file formatting and three-unit compiler naming checks pass. Four-language
source/guide coverage passes all 81 site tests with zero failures/skips. Separate
controller source review covers ownership, generation, upstream ordering and
configuration costs.

Core retains 549 unique original records: 428 local, 18 partial and 103 pending.
Data retains 131 local records; scope_complete remains false. Continue actual
owned constructors with allocator/relay provenance, abstract control contracts,
dependent templates/global interfaces, full nineteen-group Core acceptance and
Tasks 5–10. No milestone pause, staging, commit, push or publication.

### Task 3 continuation: owned element constructors and native release

All nine concrete element facades construct their actual native types with
independent tag identity and copied initial attributes. Element/Text retain
native pooling; typed allocators and nested custom instancer relays retain
original release provenance. Empty attributes initialize Input defaults.
Generation capture precedes JS getters and plain snapshot transfer. Attached,
borrowed and active release is rejected; actual native destructors invalidate
subtree observers and clear surviving alias owner edges.

New-node wrapper ownership uses only its subtree. With 1,000 existing nodes,
1,000 new nodes and their release each record 1,000 wrapper visits. Construction
uses two entries, release one, with zero registered reverse callbacks in these
ordinary configuration probes. Callback lease rebuilds after native parent
changes and arbitrary DOM mutation still need separate initialization-cost
acceptance; this does not claim full incremental ownership for those paths.

Pooled allocator teardown runs before global pool destruction. Select/Progress/
text/range child allocation failures unwind safely. Text widgets preserve
upstream child/listener construction order and clean partial installation.
Pure child-count inspection is allowed during instancing. Failed input type
replacement has checked uninitialized access and explicit type repair.

[Exact acceptance](../audit/6.3/core-element-constructor-acceptance.md) promotes
only eighteen original constructor/destructor records. Ten focused groups pass.
Final `npm test` exits zero with 84 unique suite files, 776 PASS and zero FAIL;
lint/cpplint/native/TS/types pass. Five-file formatting, three-unit compiler
naming and all 81 site tests pass. Separate controller source review and
retained red/crash/intermediate logs distinguish execution from assumptions.

Core retains 549 unique original records: 446 local, 18 partial and 85 pending.
Data retains 131 local records; scope_complete remains false. Continue actual
abstract control and Context constructor/handler contracts, dependent
ScriptInterface/owned templates and global interfaces, full nineteen-group
Core acceptance and Tasks 5–10, including callback initialization costs,
optional modules, renderer/GPU/platform, applications and final package/editor/
CI closure. No milestone pause, staging, commit, push or publication.

### Task 3 continuation: Context construction and incremental callback leases

`new Context(name, manager, handler)` invokes actual native construction through
an independent callback-free cached allocator. It retains the native manager,
zero dimensions and density 1, preserves explicit nullable handler identity,
and does not register with Core or issue plugin creation notices.
`getTextInputHandler()` returns the exact checked borrowed capability.
Actual native destruction invalidates descendants and preserves same-name
registered contexts. Direct construction and remove each have one native
entry and zero registered reverse callbacks.

Tween, Filter, Decorator and ElementInstancer leases use indexed native
ownership notices. Parent changes visit their affected subtree; destruction
queues cleanup and removes stale index entries before address reuse.
Transfer temporarily promotes callbacks before old wrappers can collect;
private-array updates and final weakening occur at the existing safe boundary.
Owned Context publication/delegation notify only their own root.
Indexed weak Context root tokens replace whole-context ownership enumeration.

The four generalized live families retain zero old-lease visits during 100
unrelated input constructions. One animated node detach/reattach each visits
one Tween lease. On Apple M4 Max, the initialization probe passes 320 measured
batches and 176,000 inputs. With 10,000 existing Tween leases, 1,000 new inputs
have CPU p50/p95 3.991/6.001 ms. Each input has two entries, no reverse callbacks,
four wrapper visits, three parent observer node visits and zero old-lease
visits. Main-thread median allocation requests are 29,008 calls / 5,871,920 B
per 1,000 inputs. This interval excludes layout/render, setup, release and GPU.

[Exact acceptance](../audit/6.3/core-context-lease-acceptance.md) includes the
raw initialization CSV, separate controller source review, retained red/aborted
logs and current source hashes. Final npm test exits zero with 84 unique runtime
suite files, 781 PASS and zero FAIL; lint/cpplint/native/TS/types pass.
Nine native files pass format, five units pass compiler naming, and all
81 site tests pass. Only three original Context keys are promoted.

Core retains 549 unique original records: 449 local, 18 partial and 82 pending.
Data retains 131 local records; scope_complete remains false. Continue actual
abstract form-control Native value specialization, ScriptInterface/templates,
exact dependent/global rows, real text-input/IME customization and nineteen
Core acceptance groups. Data-factory, typed-listener, font-effect and general
wrapper initialization gates still need separate correction/acceptance.
Tasks 5–10, including scripting, optional modules, GPU/platform, applications,
docs/editor/package/CI closure, remain active. No milestone pause, staging,
commit, push or publication.

### Task 3 continuation: abstract controls and one-time allocation hooks

`ElementFormControl.createInstancer(valueAttribute = 'value')` now allocates
an actual native attribute-value specialization of the abstract base.
GetValue/SetValue execute in Native without JS value callbacks; native
name/disabled/focus/default submission and RTTI are preserved. Factory applies
attributes while direct instancing does not. Native data-attr bindings update
the same values from shared data. Direct abstract construction still rejects.

Direct control clones pin the original allocator/key and copy higher release
observer leases without replaying JS allocation callbacks. Ancestor clones
retain native serialization/reparse through current Factory registrations.
Wrong outer instancer, attached ownership, GC/tree transfer and restart are
checked. Native Form::Submit continues selecting only input/textarea/select.

The new allocation measurement reproduced an existing wrapper-wide scan:
100 direct allocations with 1000 old wrapped nodes caused 105250 visits.
Direct instancer allocation, Factory allocation and Clone now preflush old
changes and publish only new subtree edges. Ten control contracts pass,
including changing two-layer JS delegation and all three publication paths.

Native Context SetInstancer's original one-time assertion remains intact.
An idempotent pinned-source Factory guard skips reassignment to an already
installed delegate. Actual Context.cpp with debug assertions enabled passes
37 existing context scenarios in the current build tree; its original Release
object is restored and relinked.

Eighty timed batches allocate 44000 controls. With 10000 existing Tween leases,
1000 new controls use CPU p50/p95 2.283/3.671 ms, 2001 entries, zero reverse
callbacks, 1000 new wrapper visits, zero old instance/lease visits and zero
parent observer node visits. Main-thread median requests are 11134 malloc
calls / 3364856 B. Setup, GC, verification, release, layout/render and GPU
are outside this interval.

[Acceptance](../audit/6.3/core-abstract-control-acceptance.md) records exact
semantics, raw CSV, retained red probes, assertion-enabled native execution
and the independent source review. Follow-up review found no further confirmed
defects in the three corrected paths; twelve reviewed source hashes match.
Final npm test passes 85 unique runtime files, 791 PASS and zero FAIL;
lint/cpplint/native/TS/consumer types pass. Three native units pass format and
compiler naming, and all 81 site tests pass. Only the abstract-base constructor/
destructor and two SetInstancer construction-hook rows are promoted. Core
retains 549 unique rows: 453 local, 18 partial, 78 pending. Data remains
131 local; scope_complete stays false. The aborted early package run is not
accepted evidence.

Continue actual TextInputHandler/TextInputContext/global ownership and IME
dependency, then ScriptInterface/templates, remaining global/dependent rows,
Core19 and initialization gates. Tasks 5–10 remain active; no milestone pause,
staging, commit, push or publication before complete acceptance.

### Text-input continuation: native lifecycle and editing

Native TextInputHandler adapters, canonical pointer-indexed TextInputContext
capabilities, Core global selection and per-context CreateContext selection
are implemented for the initialized runtime. Seven input methods execute
upstream Native editing. Native-owned lifecycle journals batch notification
drain into one entry; optional activate/deactivate callbacks remain explicit
and synchronous. Destroy notifications invalidate first and drain only at a
safe boundary. Captured widget handlers survive context transfers and release.

Fourteen real-widget contracts pass, including Unicode/maxlength, identity,
blur/type replacement, transfer, owner-cycle GC, callback errors and reentry,
successful/failed projection, restart, explicit shutdown and natural environment
cleanup. Independent review found and reproduced a shutdown notification gap;
the safe drain fixes it, with no further confirmed follow-up defects.
The pinned upstream composition-length formula is corrected after a retained
maxlength red probe. Direct SetText still bypasses maxlength.

The [input acceptance](../audit/6.3/core-text-input-acceptance.md) and raw CSV
record 120 timed lifecycle+drain+update+render CPU frames. With 100 notifications,
journal mode uses 103 forward entries / zero reverse callbacks; explicit mode
uses 103 / 100. Input owner scans and uploads remain zero; geometry draws are
two. With 10000 hidden old inputs, journal CPU p50/p95 is 3.179/3.588 ms.
Font/setup/GC/SFML display/GPU completion are excluded. Normal Native scene
traversals still affect CPU cost. All 81 site tests pass.

Pre-initialization handler creation and global get/set remain real gaps,
reproduced by three retained red contracts. Core inventory counts are therefore
unchanged: 549 unique, 453 local, 18 partial, 78 pending; Data 131 local.
The final full npm test passes: 86 unique runtime files, 805 PASS, zero FAIL;
lint/cpplint/Native/TypeScript/consumer types pass. Ten changed Native files
pass formatting; the input and runtime units pass compiler naming.
Complete initialization-order
ownership and exact dependent/global accounting next, then ScriptInterface,
remaining Core/19 and Tasks 5–10. Whole-plan acceptance remains false.

### Text-input startup and exact declaration accounting

Native input-handler construction and Core global selection now support
pre-initialization setup. Locked setup ownership precedes V8 retention;
prospective-generation handlers are adopted on successful initialization.
Rejected initialization arguments preserve the pending selection. Setup-only
shutdown clears borrowed pointers before owned handler destruction, invalidates
selected and uninstalled handlers, and releases the environment without calling
upstream Shutdown. Actual worker cleanup permits a new environment to acquire
ownership; foreign workers cannot access pending settings.

Eight startup cases, fourteen real-widget cases and thirteen runtime lifetime
cases pass. Full npm test exits zero: 87 unique runtime files, 813 PASS, zero
FAIL; lint/cpplint/Native/TypeScript/consumer types pass. All 81 site tests pass.
Native formatting and compiler naming pass. A separate controller source
review reports no further confirmed startup defect; it is not a fresh-agent
review. The accepted input timing evidence remains 120 CPU frames and excludes
GPU completion, setup and SFML display.

The [input acceptance](../audit/6.3/core-text-input-acceptance.md) reconciles five
original Core rows and all fifteen supplemental input-header declarations:
seven input operations, three handler virtuals, classes and destructors.
Core retains 549 unique rows, 458 local, 17 partial and 74 pending. Supplemental
values retain 1474 unique rows, 1463 local, ten partial and one reviewed opaque
forward declaration. Data retains 131 local. Full Core/19 and whole-plan
acceptance remain false.

Continue ScriptInterface/value-template contracts, remaining global interfaces
and initialization gates, then actual Node/Lua scripting, plugins and Tasks
5–10. No staging, commit, push or publication before complete acceptance.

### ScriptInterface base and checked event-element parameters

Element and RmlEvent now share the typed abstract ScriptInterface base.
Direct construction rejects. Native RTTI uses the actual upstream identity:
Event inherits ScriptInterface's token, while Element declares it as parent.
Live GetScriptObject calls return the upstream null default; unregistered
non-null objects reject without exposing pointer bits. Concrete release and
GC ownership remain unchanged. Owned-event destruction, callback expiry,
stale references and old runtime generations reject later native reads.

`getElementParameter(name, defaultValue = null)` provides a checked native
ScriptInterface pointer conversion narrowed to Element. It retains canonical
identity, live fallbacks and exact drag-element pointer semantics. Parameter
snapshot edits do not change native values. A suspected callback-release path
was tested before changing ownership code: existing dictionary and owned-event
guards already reject release. That passing regression is retained without
claiming a new ownership repair.

The [script-interface acceptance](../audit/6.3/core-script-interface-acceptance.md)
records ten focused scenarios, nine initial missing-interface red results,
a separate abstract-construction red, consumer types and a separate controller
source review. This is not a fresh-agent independent review. Full npm test
exits zero: 88 unique runtime files, 823 PASS, zero FAIL; lint/cpplint/Native/
TypeScript/consumer types pass. All 81 site tests pass. Final source annotations
pass TypeScript/lint; both native units pass formatting and compiler naming.

The baseline contains eight ScriptInterface compiler declarations, not nine.
Six supplemental records are local; class customization and non-null script
objects retain explicit partial statuses. Element's original RTTI-parent alias
is promoted. Core retains 549 unique rows: 459 local, 17 partial, 73 pending.
Supplemental values retain 1482 unique rows: 1469 local, twelve partial and one
reviewed opaque declaration. Data retains 131 local. Full value templates,
Core/19, scripting, platforms and whole-plan acceptance remain incomplete.

Continue exact value-template/persistent-pointer representation and remaining
global initialization contracts, then the actual Node/Lua host, plugins,
optional modules, renderer/platform acceptance, applications and final gates.
Stay in the existing repository; no worktree, isolated build/test environment,
staging, commit, push or publication before complete acceptance.

### Exact scalar Variant storage and conversions

Explicit numeric type/value inputs now cover BYTE, CHAR, FLOAT, DOUBLE, INT,
UINT, INT64 and UINT64. Original number and enum-constructor behavior remains
compatible. TypeScript selects primitive number/BigInt outputs, including
inline property, attribute and event selectors. Native fallback extraction
preserves the selected storage type before actual upstream GetInto conversion.
Raw byte reading accounts for the pinned upstream's missing byte pass-through
converter; template failure behavior remains native. Range guards reject
unsafe input casts and integer string scans while preserving decimal prefixes.

The [scalar acceptance](../audit/6.3/core-variant-scalars-acceptance.md) records
five new red-to-green runtime scenarios and a distinct controller review.
Full npm test exits zero: 89 unique runtime files, 828 PASS, zero FAIL.
Lint, cpplint, Native build, TypeScript and consumer types pass; all 81 site
tests pass. Both changed native units pass format and compiler naming checks.
Four-language property guides describe the exact public contracts.

Aggregate pointer/template rows remain partial, and Core/19 remains false.
Core/Variant.h is absent from the supplemental ledger and needs declaration
reconciliation; integer-vector and Character templates require explicit
representation. Persistent element references need native copy-safe lifetime
storage and GC-visible owner edges, not borrowed persistent addresses.
Existing destruction notifications and callback-resource mutation versions
are available. A compiler assertion confirms a pointer plus shared lifetime
token fits the existing Variant inline buffer and alignment, so adding an
unconditional field to every numerical Variant is unnecessary.

Continue persistent-pointer/value-template contracts, global initialization,
actual scripts/plugins and Tasks 5–10 until full acceptance. No staging,
commit, push, publication, worktree or isolated build/test environment.

### Persistent Element Variant references

Property and attribute Element references now use an inline native shared
lifetime slot. Copies, moves, Clear and typed access preserve it without
increasing numerical Variant size or retaining ElementState. Native destruction
nulls the shared slot before plugin and tree teardown. Private JS edges retain
copied and detached owners; actual DOM/default roots retain only their targets.
Removing/replacing values and destroying targets release those edges, including
stale target wrappers. Self and cross-element cycles remain collectible.

`Property.getElementValue()` and
`Element.getElementAttribute(name, fallback = null)` select native pointer
conversion. Missing/failed values use the fallback; destroyed stored targets
convert successfully to null. Raw outputs return canonical Element wrappers.
Pointer string templates and Property/definition text conversion reject;
native RML serialization cannot expose the guarded address. Bulk conversion
resolves all accessors first and preserves outer active-callback restrictions.

The [pointer acceptance](../audit/6.3/core-variant-elements-acceptance.md)
records eleven runtime scenarios. Eight initial scenarios and a later
stale-handle regression fail before their implementations. The final full
package run exits zero with 90 unique test files, 839 PASS and zero FAIL.
Lint, cpplint, Native build, TypeScript, consumer types, Native format and
compiler naming pass; all 81 site tests pass. Sixteen unchanged pointer update
and query iterations record zero callback and element ownership scan visits.
Four changed upstream files also match a memory-only clean pinned-source
patch run; repeated patching writes zero files.

The review is a separate controller phase. Eleven partial aggregate value rows
receive this evidence and stay partial. Core remains 549 declarations:
459 local, 17 partial, 73 pending; supplemental values remain 1482:
1469 local, twelve partial, one opaque.

Continue the missing 43 Core/Variant.h declarations, integer-vector/Character
templates, global initialization, actual scripting/plugins and Tasks 5–10.
Core/19 and whole-plan acceptance remain open. No staging, commit, push,
publication, worktree or isolated build/test environment.

Lua 5.4.8 now compiles from its 32 original runtime sources with C++ exception
unwinding, together with all 37 upstream RmlUi Lua translation units in the
existing native package. Component-aware dependency upgrades preserve Core
and FreeType. The real Lua archive executes independent-state, exact int64,
source-line, error-stack recovery and RAII unwinding probes: two PASS, zero FAIL.

The current full native build passes, and the package runtime executes 101
files with 960 PASS markers and zero FAIL. Maintained native formatting,
naming, lint, cpplint and consumer types pass. Actual-state registration,
checked userdata and copied Lua iterators compile; their Lua document,
listener, model and Factory integration still requires execution acceptance.
The report is `../audit/6.3/lua-foundation-acceptance.md`.

Core currently remains 474 local, seventeen partial and 58 pending out of
549, including the separately accepted Node script loading methods.
Supplemental acceptance is unchanged. No Lua API row was promoted, and
`scope_complete` remains false. Continue managed Lua host/state/document/
listener/model implementation and all remaining original acceptance tasks.

### Node document host local acceptance

`../audit/6.3/core-node-script-acceptance.md` records the actual Native
document host, explicit trusted-source policies, source order/line locations,
per-document selection, checked typed listeners and Native-owned VM lifetime.
Fifteen focused groups pass, including GC with a retained expired facade and
the exact hosted-document Plugin lifecycle. The full runtime run finishes
with 100 unique files, 958 PASS and zero FAIL.
Final declaration compilation preserves all 117 executable JavaScript files.
Lint/types/cpplint, six-file format, four-unit naming and seventeen four-language
source/site checks pass; four actual scripts guide routes are prepared.

Only LoadInlineScript and LoadExternalScript are promoted: Core 549 =
474 local, seventeen partial and fifty-eight pending. Supplemental 1547 is
unchanged. The controller's source review is not independent.

Managed Lua, actual Node/Lua switching and non-null GetScriptObject adapters
remain open. Lua 5.4.8 is downloaded with its official SHA-256 and extracted
in the existing dependency tree, not configured, compiled or executed.
Continue those implementations and the remaining original scope.
No milestone stop, commit, push, publication, worktree or isolated environment.

## Owned Variant and template destination acceptance

Native now owns an independent `Rml::Variant`, with shared uint32 type metadata.
Copy, move, assignment, Clear and comparison retain upstream semantics;
moved-from values keep their native type. Pointer values use the existing
guarded lifetime slots and collectible owner edges. GetType reads shared
metadata without a Native call.

Conversion destinations are separate from storage types. Actual integer
vector String converters preserve partial-prefix output after failure and
minimum component counts. Character uses the native enum/INT64 template.
GetInto reports native success separately from its resulting value.
GetReference checks exact storage and returns independent JS snapshots.
Property and style use zero defaults; attribute/event/Variant defaults retain
their caller's values. Unsupported scalar converters remain unsupported.

The [owned Variant acceptance](../audit/6.3/core-owned-variant-acceptance.md)
maps all 43 previously omitted Core/Variant.h compiler declarations. Original
Core remains 549: 459 local, 17 partial, 73 pending. Supplemental history
preserves 1482 and adds the missing header explicitly, producing 1525:
1506 local, 18 partial, one opaque. Of the added declarations, 37 have local
acceptance and six remain partial; eleven existing partial aggregates receive
evidence without promotion.

The final whole-package run exits zero with 92 unique runtime test files,
855 PASS and zero FAIL. Ten owned-value and six template scenarios cover
25 storage types, all 26 enum codes, exact native equality, move/copy, conversion
failure/prefixes, pointer lifetime, stale handles, GC cycles, shutdown and
accessor-driven receiver expiry. An additional final Native/TS rebuild and
all sixteen focused cases exit zero after source naming cleanup. Final lint,
cpplint, consumer types, fourteen-file Native formatting, ten-unit compiler
naming and all 81 four-language site tests pass.

The controller separately reviews ownership and template implementation.
Unchanged numeric value/update loops measure zero callback and element owner
scan visits. New owned-value constructor latency and complete frame p50/p95
were not measured by this milestone.

Continue global initialization and typed interface ownership, actual script
engines/plugin coexistence and remaining Tasks 5–10. Arbitrary ScriptObjects,
void* ownership and full value templates remain open, along with Core/19 and
the whole-plan acceptance. No staging, commit, push, publication, worktree or
isolated build/test environment.

## Native system interface and pre-initialization selection acceptance

Native owns the actual SFML system subclass; checked tokens implement the
global Set/Get contract. Initialization preserves preselected interfaces and
installs an SFML fallback only when none was selected. Selection is rejected
after initialization. Unused native owners and callback cycles remain
collectible; shutdown invalidates setup/live objects and clears callback/window
edges from retained wrappers. The default renderer keeps its own window.

The shared double clock drives actual native animation time without host
callbacks. NaN selects the native SFML clock; finite seconds must be
nonnegative. A native callback bitmask avoids V8 array access for omitted
system hooks. Translation, JoinPath, logging, cursors, clipboard and keyboard
virtuals retain native result contracts, captured callback identity and strict
synchronous/recursive-entry checks.

The [system interface acceptance](../audit/6.3/core-system-interface-acceptance.md)
records twelve focused scenarios and the original nine failing contracts.
The complete package exits zero with 93 unique runtime suites, 867 PASS and
zero FAIL. Final typed-source build, consumer fixtures, lint and all twelve
focused cases pass after callback documentation uses named callable types.
Ten changed Native files pass format; six compiled units pass LLVM naming.
All 81 site/four-language tests pass.

The real shared-clock animation runs 32 updates with zero host callbacks,
callback snapshot visits and element ownership visits; its final numerical
width matches the application time. Complete initialization latency, device
cursor/clipboard/IME execution and GPU timings remain unmeasured.

Only the three exact Core/Core.h system declarations are promoted.
Core remains 549: 462 local, seventeen partial, seventy pending.
The twelve previously missing Core/SystemInterface.h declarations are added
individually to the supplemental ledger, preserving denominator history:
1537 total, 1518 local, eighteen partial, one opaque.
The controller's source review is a separate phase, not an independent review.

Continue FileInterface, font/render global selection and Plugin contracts,
then actual script engines and remaining Tasks 5–10. Core/19, Log helpers,
arbitrary ScriptObjects, void* ownership and full templates remain open.
No staging, commit, push, publication, worktree or isolated build/test environment.

## Native file interface and pre-initialization selection acceptance

The [file interface acceptance](../audit/6.3/core-file-interface-acceptance.md)
records a real Native provider, all seven virtual methods, checked file tokens
and actual Core Set/Get calls. Native owns byte snapshots or typed stream
leases; callback/file edges remain visible to GC. Shutdown releases native
streams before the provider, closes outstanding files and invalidates unused
setup objects as well as retained wrappers.

The default preserves original-path stdio; explicitly selected roots preserve
the existing root-first fallback. Real original/shadow resource fixtures verify
both read and worker-preload policies. Default LoadFile preserves empty Read(0),
short-read warning/zero padding and Close order. The original source closes
empty files; no upstream empty-file leak patch was required.

Custom resource snapshots are obtained once on the owning thread; worker image
decoding never bypasses that source with filesystem reads. Deduplication,
ready-first-use caching, abort/shutdown and failing-source cache ownership are
verified. Diagnostics distinguish owner source capture from worker file reads.

The complete package exits zero with 94 unique runtime suites, 885 PASS and
zero FAIL, including eighteen file scenarios, lint, cpplint, Native/TS builds
and consumer fixtures. Eleven Native files pass format; seven compilation units
pass naming. All 81 site/four-language tests pass. Thirty-two static context
updates have zero host callbacks, callback snapshot visits and ownership visits.
One custom texture snapshot is decoded once on a worker with zero filesystem
reads or main-thread image preparations.

Only three Core/Core.h file declarations are promoted. Core remains 549:
465 local, seventeen partial, 67 pending. The ten exact Core/FileInterface.h
declarations increase the supplemental denominator from 1537 to 1547 while
preserving prior history: 1528 local, eighteen partial and one opaque.
The controller's source review is separate, not independent.

Continue font/render global selection and Plugin contracts, then actual script
engines and remaining Tasks 5–10. Core/19, complete initialization latency,
GPU/device/platform checks, arbitrary ScriptObjects and void* ownership remain
open. No staging, commit, push, publication, worktree or isolated build/test
environment. Complete the whole authorized plan without milestone stops.

### Shared Native font measurement buffer acceptance

`FontMeasureBuffer` owns fixed UTF-8, uint32 offsets and int32 width arrays.
`measureStrings` validates every active slice before writing results and reuses
the original output view. Immutable shared language storage avoids repeated
long-language string allocations. Empty rows, embedded nulls, Unicode, prior
characters and partial counts match scalar Native measurement.

The public buffers are marked untransferable for thread transfer. Direct
ArrayBuffer transfers invalidate the binding and preserve escaped Native
storage. Subsequent measurement rejects detached views. Weak V8 buffer handles
belong to a separate binding, so transferred backing-store destruction never
touches V8. A private detach key was rejected after Node 22.22.2's transfer
builtin aborted; the accepted implementation uses detachment checks.

The reviewed complete runtime run exits zero with all 97 actual test files,
914 literal PASS and zero FAIL. Nine focused buffer scenarios pass.
Native/TS builds, complete package lint, consumer types, cpplint, five-file
formatting, three compiler naming units and four-language source contracts
pass. The distinct source review is a controller review, not independent.

On M4 Max with 20 warmup and 80 timed calls, packed measurement p50/p95 is
0.038/0.038 ms at 1k, 0.377/0.393 ms at 10k and 3.713/3.816 ms at 100k.
Every one of fifteen counted packed calls has one Native entry and zero host
callbacks, input/result allocations or copies, main-thread malloc requests,
callback snapshot visits and element ownership visits. These are measurement
call timings, not complete CPU frames or GPU timings.

Evidence and reproducible tooling are recorded in
`../audit/6.3/core-font-measure-buffer-acceptance.md` and
`packages/sfml.js-rmlui/tools/measure-font-buffer-performance.cjs`.
Core remains 549: 468 local, seventeen partial and 64 pending. Supplemental
values remain 1547: 1528 local, eighteen partial and one opaque; no original
declaration is promoted for this extra buffer API.

Continue arbitrary FontEngineInterface shared/custom contracts, Plugin,
the remaining individual Core records, Node/Lua execution, optional modules,
GPU/platform/IME, applications and full documentation/editor/package/CI.
The original completion task remains active without milestone stops.

### Native default font engine selection acceptance

`FontEngineInterface` now owns the concrete Native FreeType engine. Global
selection is legal before initialization, explicit selection is preserved,
and null restores the automatic default. Extra engine construction does not
initialize the upstream global provider; Core manages Initialize and Shutdown.
The getter reads Core's actual pointer and preserves canonical typed identity.
Owner, active-selection, generation and callback checks reject invalid uses.

The three font load overloads reuse immutable Native source retention.
Face/effect tokens, metric snapshots, owned language and shared shaping fields,
bulk widths and native textured meshes retain their resource contracts.
Atlas views invalidate with font generations while escaped numerical and mesh
storage survives. Size/spacing checks protect upstream native conversions.

The reviewed full run passes 96 unique suites, 905 PASS and zero FAIL.
All nine font cases and thirteen lifetime cases pass. Final rebuild and focused
font cases pass. Lint, cpplint, consumer types and seven-file format pass;
five compiled units pass naming. Seventeen site/API checks pass in all four
locales. The first exhaustive worker failure was fixed in Runtime owner guards,
and missing translations were fixed in source comments without exemptions.

At 1,000/10,000/100,000 strings, bulk widths use one Native entry and zero host
callbacks, callback snapshot visits and element ownership visits. Thirty-two
static native text update/render frames also report zero for those counters.
These are counter checks, not complete CPU-frame or GPU timing results.

Only Core's exact font-engine setter/getter rows are promoted. Core retains 549
records: 468 local, seventeen partial and 64 pending. Supplemental remains 1547:
1528 local, eighteen partial and one opaque. The abstract FontEngineInterface
declaration remains pending. Updates are idempotent and preserve evidence and
source hashes. See `../audit/6.3/core-font-engine-default-acceptance.md`.
The controller source review is separate, not independent.

Next implement reusable shared measurement commands and custom font-engine
contracts, then Plugin and actual Node/Lua hosts. HarfBuzz/bitmap/optional
modules, GPU/IME/platform, applications, four-language/editor/package/CI and
Core/19 remain in the original active scope. No milestone stop, staging,
commit, push, publication, worktree or isolated build/test environment.

## Native renderer selection and window ownership acceptance

The [renderer selection acceptance](../audit/6.3/core-render-interface-selection-acceptance.md)
records actual Core Set/Get calls with checked Native SFML interfaces.
Interfaces can be created before or after initialization; initialization
preserves the selected renderer. Setup tokens enter the next generation.
Null resets automatic selection; active-runtime/callback replacement and
foreign or stale tokens are rejected.

Weak Native registry entries and private V8 window edges make unused interfaces
collectible, including a reproduced window-to-renderer cycle. Selected and
Native-borrowed interfaces retain windows until shutdown. Core context creation,
explicit managers and preloads retain interfaces before resource construction.
Shutdown releases native resources before renderers and clears window edges
even from retained invalid wrappers.

The separate-window pixel probe renders red into the selected target while
the system window remains blue. Thirty-two static updates and renders add zero
Native host callbacks, callback snapshot visits or element ownership visits.
Rendering, geometry, batching and draw snapshots keep the existing Native path.

The complete runtime pass exits zero with 95 unique suites, 896 PASS and zero
FAIL. Final Native rebuild and all eleven renderer startup cases pass, as do
lint, cpplint, TypeScript compilation and consumer fixtures. Eight Native files
pass format, six compilation units pass naming, and seventeen focused site/API
checks pass in all four locales. The controller's source review is separate,
not independent.

Only the exact Core/Core.h setter status is newly promoted; the existing getter
acceptance is refreshed with actual nullable setup semantics. Core remains 549:
466 local, seventeen partial and 66 pending. Supplemental coverage remains 1547:
1528 local, eighteen partial and one opaque. Ledger updates are idempotent and
retain source hashes and exact observed logs.

Continue the FontEngineInterface contract and global selection, Plugin, actual
Node/Lua script hosts and the remaining original Tasks 5–10. The abstract
RenderInterface declaration and arbitrary renderer customization remain open.
Core/19, full initialization latency and GPU/device/platform execution remain
open. No staging, commit, push, publication, worktree or isolated build/test
environment. Complete the whole authorized plan without milestone stops.

## Custom font-engine local acceptance

The [custom font acceptance](../audit/6.3/core-font-engine-custom-acceptance.md)
reconciles all twelve upstream virtual signatures and the additional bulk and
packed measurement paths. Native owns faces, independent advance tables,
metrics/version, effects, and reusable snapshot/result storage. Default
FreeType layout/rendering stays in C++; packed host computation uses one
callback per nonempty batch without per-string JS values. Scalar upstream
requests still have count one and are not coalesced across layout operations.

Eighteen custom scenarios pass, including actual Context layout/rendering,
static geometry reuse, version/text invalidation, foreign faces, release,
callback failures, first-error initialization rollback, detached storage,
growth, Worker transfer, GC and retained pure Native arrays. Failed packed
measurement and Native-table overflow preserve whole original output.

The final Native build and full runtime command exit zero: 98 unique files,
932 PASS, zero FAIL. TypeScript, consumer fixtures, lint and cpplint pass.
Four Native files pass formatting and three compilation units pass naming
with the installed compatible SDK. Fifteen source/documentation checks pass,
including complete EN/ZH/JA/KO callback parameters and return descriptions.
The executing controller's source review is not independent.

The reproducible benchmark compares 1,000, 10,000 and 100,000 equal-output
ASCII rows. At 100,000, Native p50/p95 is 1.541875/1.602708 ms, packed JS
0.307375/0.385958 ms, and scalar compatibility 13.795042/16.038417 ms.
Entries/callbacks are 1/0, 1/1, and 1/100000. Packed uses no steady
measurement-storage or observed malloc/realloc allocations and copies
1,400,004 bytes for input/output snapshots. Native has zero explicit copies;
the first 1,000-row diagnostic sample observes twenty allocations requesting
32,936 bytes, with cause unproven. Timing is measurement-only, excluding
setup, layout, render, presentation and GPU; no shaping-engine claim.

Only the exact abstract `Rml::FontEngineInterface` row is newly accepted.
Core 549 = 469 local, seventeen partial and 63 pending. Supplemental 1547 =
1528 local, eighteen partial and one opaque. Existing evidence remains intact,
and `scope_complete` stays false.

Continue Plugin GetEventClasses, eleven notifications, scoped live arguments
and safe registration/removal, then the exact remaining Core declarations and
actual Node/Lua hosts. Native Debugger/SVG/Lottie/HarfBuzz/bitmap integration,
GPU/platform IME, twenty applications/113 visuals, four-language rendered
pages, editor/package/CI and full final review remain active. No milestone
stop, staging, commit, push, publication, worktree or isolated build/test
environment.

### Plugin Native local acceptance

`Plugin`, `PluginEventClasses`, registration functions and seven documented
callable contracts now cover GetEventClasses and all eleven upstream
notifications. Native-owned registrations retain captured callbacks; weak
private edges permit unregistered cycles to collect. Masks are fixed per
registration, and missing hooks return entirely in Native before V8 access.
Scoped Context/Element arguments support audited live reads and expire at
return; retained dimensions storage is zeroed without becoming unsafe.

The pinned Registry patch uses bounded index traversal, removal tombstones and
outermost compaction. Self-removal, removal of the next subscriber and late
insertion preserve order. Initialization self-cancellation and explicit/global
shutdown retain Core's different mask and ordering rules. Exceptions preserve
Native teardown, async returns are rejected, and unsafe callback domains cannot
mutate the Plugin registry.

Final Native build and runtime verification pass: eleven focused cases, 99
unique runtime files, 943 PASS and zero FAIL. A separate three-check actual
FileInterface/Plugin trace confirms RmlUi 6.3 opens a path's StreamFile before
DocumentOpen notification, emits no notice on failed opening, and notifies
memory loads before parsing. Four-language contracts document that upstream
comment/implementation discrepancy without changing Core semantics.

TypeScript and consumer fixtures pass, thirteen touched Native files pass
format, three compilation units pass naming, and seventeen localized
source/site checks pass. Lint and cpplint pass. The executing controller's
source review is not independent.

Four equal-pixel static cases use twenty warmup, eighty timed and five counted
complete clear/flush/update/render/display frames each. With one thousand All
registrations, p50/p95 is 0.202042/0.241417 ms; actual Addon crossings are 4/0,
one draw, zero uploads, zero element ownership visits and zero callback
snapshot visits. All full-image hashes match. Main-thread frames still make
56–60 allocator requests across the cases; no zero-allocation or GPU claim.
Evidence and limits are in `../audit/6.3/core-plugin-acceptance.md`.

Only the exact three Core Plugin/registration rows are promoted: Core 549 =
472 local, seventeen partial and sixty pending. Supplemental 1547 remains
1528 local, eighteen partial and one opaque; `scope_complete` stays false.

Continue the remaining exact/partial Core rows and actual Node/Lua document
hosts. Upstream Lua has a process-global state and overwrites body/listener
instancers; this must be routed without replacing other script modes. Its
raw userdata, event lifetime and source-line handling also need actual
verification. Native optional libraries, GPU/platform IME, twenty applications/
113 visuals, rendered four-language pages, editor/package/CI and independent
final review remain active. No milestone stop, staging, commit, push,
publication, worktree or isolated build/test environment.

### 2026-11-17 managed Lua runtime checkpoint

The native Lua 5.4.8 host now executes document sources and typed scalar calls,
retains original source locations, and routes Node/Lua modes without replacing
the global body/listener registries. Documents retain their selected host.
DOM and data callbacks share scoped globals and checked event lifetimes.

Lua models retain their VM, track exact Context/native identity, invalidate
proxies before model destruction and release definitions afterward. Stable
paths read replacement arrays and structs. Lua instancers preserve pooled
allocator provenance through GC, tag replacement and direct Factory release.
Coroutines share VM ownership while preserving independent stacks. Active
proxy GC, data-event recursion, unsafe widget/Context mutations and finalizer
reentry reject.

Current verification: 28 Lua scenarios PASS; the complete runtime contains
102 test files, 988 PASS and zero failures. Lint, cpplint, consumer types, Native
format/naming and 21-source patch idempotence pass. The documentation build
validates 152 localized pages, 1,586 API pages in each of four languages,
303 redirects and all local links/assets. Types and guides describe both
document hosts. Event API routes and font overload source comments now match
their generated documentation pages.

This checkpoint promotes no existing declaration. Core remains 549 =
474 local, 17 partial and 58 pending. Supplemental remains 1,547 =
1,528 local, 18 partial and one opaque; `scope_complete` stays false.
The 55 Lua C++ declarations require exact consumer mapping. Lua Invaders/Game,
GetScriptObject customization and all remaining original obligations continue.
Evidence is in `../audit/6.3/core-lua-script-acceptance.md`.

### 2026-11-17 native script object checkpoint

Context, Element and Event now expose managed non-null script objects through
the actual native virtual. Native trees retain their records, detached and
owned closure cycles collect, and Factory transfer preserves retention and
original allocation chains. Context now inherits the typed ScriptInterface
facade and its actual native base identity. Its release rejects registrations.

Final package acceptance passes lint, cpplint, native/TypeScript builds,
consumer types and all 102 runtime test files: 1,003 PASS, zero FAIL. The
ScriptInterface group has 25 scenarios. File counts exclude smoke-summary
messages sharing the runtime prefix. Native format/naming and managed source
patch idempotence pass; all four adapter object files are newer than sources.
The site validates 152 localized pages, 1,586 API pages in four languages,
303 redirects and all local links/assets. Five source-type warning categories
remain open in whole-site QA.

Supplemental ScriptInterface's class and GetScriptObject rows are locally
verified. Supplemental remains 1,547 = 1,530 local, 16 partial and one opaque.
Core stays 549 = 474 local, 17 partial and 58 pending. No Core row is promoted
by this checkpoint, and scope_complete remains false.

Exact Core review and all 55 Lua mappings continue. Lua LoadString's
compile-without-execution semantics still need a managed consumer entry.
Core 19, modules, GPU/platform IME, twenty applications/113 visuals,
rendered documentation, editor/package CI and independent full-scope review
remain active. No milestone stop, staging, commit, push, publication, worktree
or isolated build/test environment. Evidence:
`../audit/6.3/script-object-acceptance.md`.

### Native interpreter and declaration reconciliation checkpoint

`LuaScriptHost.compile` produces an unexecuted native chunk; `getFunction`
captures a stable registry reference. `LuaFunction.call/callResults` preserve
function identity, exact result counts, scalar conversion and outer stacks.
Native references retain their VM after host GC, release independently and
invalidate at shutdown. Actual Lua stack limits are checked before argument
getters, then receiver/state/generation are revalidated.

`executeFile` uses the actual RmlUi FileInterface and Interpreter.LoadFile.
The file-syntax red case found a pinned-patch idempotence mismatch that left
LoadString's compiler failure log-only. A uniquely identified whole-function
patch now propagates original path/line errors. All 84 inspected Lua/Core
source files are unchanged after repeated patch application.

Final `npm test` exits zero: 103 actual runtime files, 1,016 PASS and zero FAIL.
Thirteen compiled/captured/file scenarios pass. Native formatting/naming,
consumer types and source/object identity checks pass. The site validates
152 localized pages, 1,587 API pages in four languages, 303 redirects and
all local links/assets. Five existing source-type warnings remain open.

All 55 Lua declarations have exact mappings, preserving the distinct struct
and typedef sharing a RegType signature. Ten managed equivalents have local
acceptance; 45 descriptor/template/Variant/index/external-VM records have
defined follow-up. The 67-record Core type source map explains 58 pending
types and nine type-level partials: 54 managed representations, 13 private
forwards. ElementScroll's separate public constructor and the native iterator
constructor/move contract remain explicit dependent-interface obligations.

The full 3,926-record inventory is cross-referenced against Core, Supplemental,
data and Lua maps. It represents 2,280 original records and leaves 1,646 needing
other evidence or implementation reconciliation. Those records are not
automatically missing runtime features or approved exclusions. Generated
input/ID constants, conversion/math/matrix/string/value types and public
dependent headers require exact mapping before whole-API acceptance.

No original Core/Supplemental row is promoted solely by this source checkpoint.
Core stays 549 = 474 local, 17 partial and 58 pending; Supplemental stays
1,547 = 1,530 local, 16 partial and one opaque. scope_complete stays false.
Full Core 19, remaining templates/dependencies, Lua follow-ups, modules,
GPU/platform IME, applications/visuals, rendered docs/editor/package CI and
independent whole-scope review continue. No worktree or isolated environment.

Evidence: `../audit/6.3/lua-interpreter-acceptance.md`,
`../audit/6.3/core-type-source-reconciliation.md`,
`../audit/6.3/full-inventory-reconciliation.json`,
`/tmp/rmlui-63-completion/lua-interpreter-source-review.md` and
`/tmp/rmlui-63-completion/lua-functions-package-4.log`.

### Continuation checkpoint: owned scroll and dependent declarations

`ElementScroll(element)` now allocates a distinct actual native scrollbar
component, independently of the element-owned borrowed view. Indexed host
destruction detaches widget listeners before native children die. Explicit
release and deferred GC cleanup clear the component's host edges; retained
invalid facades release those edges after document destruction and shutdown.
The allocation registry uses geometric sweeping and unchanged queries do not
scan other components.

Eleven owned-scroll scenarios and the existing component suite pass. Final
`npm test` exits zero: 104 actual runtime suite files, 1,027 PASS and zero FAIL.
Native builds, consumer types, ESLint, cpplint, three touched-file format
checks, both compilation-unit naming checks and source/object identity pass.
The four-language site validates 152 localized pages, 1,587 API pages per
language, 303 redirects and all local links/assets. All four source-comment
checks pass. Five existing RmlUi source-type warning categories remain open.

The dependent mapping preserves all 16 ElementScroll and 12 iterator
declarations, including two explicitly deleted copy operations. Three native
iterator construction/move contracts still require transfer execution and
exact managed-equivalent review. Eight stylesheet type partials and Event's
type partial now carry current Stream/matching/attachment/InstanceDecorators
and non-null ScriptInterface evidence without aggregate status promotion.

The compact indexed Input/EventId map accounts for 188 Input and 37 EventId
declarations, exact generated names/values and their existing runtime suites.
This is source mapping; device/platform and per-value native execution remain
separate. Seven maps represent 2,533 of the original 3,926 records; 1,393 still
require other evidence or implementation reconciliation. MediaQueryId and
FontFaceId are among the remaining public ID families.

Core remains 549 = 474 local, 17 partial and 58 pending. Supplemental remains
1,547 = 1,530 local, 16 partial and one opaque. Full Core 19 remains open.
Next pointer/template work must address actual Context and Event
ScriptInterface values, in addition to Element; current generic conversion
rejects SCRIPTINTERFACE and VOIDPTR, and current target ownership narrows to
Element. Opaque script/native pointers and the full typed destination matrix
remain explicit obligations. Lua's 45 follow-ups, modules, GPU/platform IME,
applications/visuals, rendered docs/editor/package CI and independent review
continue. No worktree or isolated environment was created.

Evidence: `../audit/6.3/core-scroll-construction-acceptance.md`,
`../audit/6.3/core-scroll-iterator-declaration-map.json`,
`../audit/6.3/core-input-event-declaration-map.json`,
`../audit/6.3/full-inventory-reconciliation.json`,
`/tmp/rmlui-63-completion/owned-scroll-source-review.md` and
`/tmp/rmlui-63-completion/owned-scroll-package-1.log`.

### Continuation checkpoint: guarded Context/Event Variant pointers

Native ScriptInterface storage accepts Element, Context and RmlEvent.
The scriptinterface selector invokes actual GetInto<ScriptInterface*> with
typed null and caller defaults; Property/style still use T{}. Copied values
share independent lifetime slots. Context removal/root destruction and Event
release/Factory transfer/dispatch expiry invalidate the same stored copies.
Context and Event inherit ScriptInterface's RTTI identity, so the adapter uses
nominal native handles and shared-slot registration rather than derived RTTI.

Reachable owners retain original facades through collectible private JS edges.
Independent Context document snapshots belong to that Context's handle.
Retirement queues weak Context states and clears their private pointer edges
at the outer native boundary; native destruction and GC do not allocate V8.
Two actual red regressions proved an independent document/context reference
cycle and a retained-invalid-context event root. Both are among thirteen
passing pointer scenarios. Sixteen unchanged frames have zero callback
snapshot visits and zero element ownership visits.

Code is grouped by validation, reading, lifetime changes and output, with blank
lines between logical sections, following the user's explicit readability
correction. Final native construction, focused scenarios, ESLint, consumer
types and touched formatting pass. Four-language site tests pass all 81 cases;
the site validates 152 localized pages, 1,588 API pages per language and
303 redirects. Five pre-existing source visibility warnings remain.
Two earlier full package runs were stopped after newly observed lifecycle
failures; they are not final package acceptance. Run the final complete package
against the current sources before recording the prepared evidence script.

The next complete package run, `variant-scriptinterfaces-package-3.log`,
exited 1 after 51 runtime files, 493 PASS lines and one FAIL line.
`events.test.cjs` / `parameter-validation` exposed direct nominal native
handles being accepted as template defaults despite their public exclusion.
Native selector validation now rejects those handles and requires an explicit
pointer selector. The native build, full event regression file and thirteen
pointer scenarios exit 0 in the default-build/default-green/green-5 logs.
Final complete-package acceptance remains pending.

Managed opaque `void*` storage is under implementation. Twelve focused
scenarios now cover identity, native copy/move, defaults, dictionaries/events,
GC roots/cycles, data-pointer rejection, public-field discrimination and
unchanged frames. The initial eleven scenarios all failed at the missing
`voidptr` adapter. A native build then exposed duplicate helper insertion when
upgrading an already refined upstream patch. The patcher now recognizes every
complete installed refinement stage; actual in-place upgrade, timestamp
stability and the second native build are being verified. No opaque acceptance
status is promoted before those focused and full-package results.

Core remains 549 = 474 local, 17 partial and 58 pending. Supplemental remains
1,547 = 1,530 local, 16 partial and one opaque. The prepared reconciliation
supplements nine Core and nine Supplemental rows without promoting generic
template statuses. Full Core 19, arbitrary ScriptObject/void* ownership,
the destination matrix, three iterator transfers, 1,393 unmatched declarations,
45 Lua follow-ups, optional modules, GPU/platform IME, applications/visuals,
rendered docs/editor/package CI and independent review continue.
No worktree or isolated build/test environment was created.

Evidence: `../audit/6.3/core-variant-scriptinterfaces-acceptance.md`,
`/tmp/rmlui-63-completion/variant-scriptinterfaces-green-4.log`,
`/tmp/rmlui-63-completion/variant-context-cycle-red.log`,
`/tmp/rmlui-63-completion/variant-removed-context-edge-red.log`,
`/tmp/rmlui-63-completion/variant-scriptinterfaces-site-2.log` and
`/tmp/rmlui-63-completion/record-variant-scriptinterfaces.py`.

### Verified continuation: managed opaque Variant and pointer defaults

The final complete package run, `variant-scriptinterfaces-package-4.log`,
exits 0 with 106 unique runtime files, 1,053 PASS lines and zero FAIL lines.
It includes all native/TS builds, lint, cpplint, consumer types and runtime
tests. Thirteen opaque-object scenarios, thirteen ScriptInterface scenarios
and sixteen focused event scenarios pass. Seven touched native compilation
units pass compiler-backed naming; all touched native formatting passes.
The four-language site passes 81 tests and validates 152 localized pages,
1,591 API pages per language, 303 redirects and all local links/assets.

Managed VOIDPTR storage now uses inline shared slots and registered JS object
identity, with collectible owner edges and actual GetInto<void*> semantics.
Native raw drag_element casts exclude guarded opaque values; the actual
SIGBUS regression passes. Template defaults require explicit pointer selectors.
Patch upgrades recognize each complete installed refinement stage, avoiding
duplicate native helper insertion. Sixteen unchanged frames record zero
callback snapshot visits and zero element ownership visits. CPU percentiles,
malloc/copied bytes and GPU work are not measured by these focused scenarios.

The evidence reconciler verified complete logs and fingerprints and updated
nine Core plus nine Supplemental rows without status promotion. Core remains
549 = 474 local, 17 partial and 58 pending; Supplemental remains
1,547 = 1,530 local, 16 partial and one opaque. ScriptObjectRecord associations
remain separate from managed opaque identity. External C++ ScriptObjects/void*
and the full destination/lifetime matrix remain required.

Continue source-level fixes for ComputedFields, ArrayPrimitiveType,
PrimitiveRecord and two ByteColour visibility warnings; three iterator transfer
contracts; exact type/forward rows and all 1,393 unmatched declarations;
45 Lua follow-ups; optional modules, GPU/platform IME, all applications/visuals,
editor/package CI and independent whole-scope review. No milestone stop or
staging/commit/push is authorized by this local verification.

Evidence: `../audit/6.3/core-variant-opaque-acceptance.md`,
`/tmp/rmlui-63-completion/variant-scriptinterfaces-package-4.log`,
`variant-void-pointers-green-1.log`, `variant-scriptinterfaces-green-6.log`,
`variant-void-pointers-naming-final.log`, `variant-void-pointers-site-1.log`,
and `record-variant-scriptinterfaces.py` in that same temporary directory.

### Verified continuation: public type source contracts

The computed generator now emits an independent readonly ComputedValuesView
interface from all 98 native getters. Its internal implementation class remains
internal. Public VariantByteColour preserves the readonly colourb discriminator.
TransformArrayPrimitiveType, TransformPrimitiveValues and
TransformPrimitiveRecord expose complete tuples without hidden dependencies.
All 98 getters and 83 setters, nullable defaults, copied values and observer
lifetimes retain their existing contracts.

Four localized TypeDoc tests reproduce five warnings before the source repair
and pass with zero public type reference warnings afterward. The package TS
build, consumer types and lint exit 0. Twelve computed and seven transform
runtime scenarios pass. All 81 site tests pass with zero failures or skips.
The complete site build validates 152 localized pages, 1,595 API pages per
language, 303 redirects and all local links/assets. Fifteen generated files
retain their bytes and timestamps on a repeated generator run.

Exact type/forward runtime reconciliation is running against 29 existing
consumer files. No ledger type status has yet been promoted by these results.
External C++ pointers, native iterator transfers, full conversion/lifetime
matrices, unmatched declarations, Lua, optional modules, GPU/platform IME,
applications/visuals, editor/package CI and independent whole review remain.
Continue without a milestone stop or staging/commit/push.

Evidence: `../audit/6.3/public-type-source-acceptance.md` and the
`public-types-*.log` files under `/tmp/rmlui-63-completion`.

### Verified continuation: exact type sites and iterator transfers

All 29 existing type/forward consumer files exit 0 with 318 PASS and no failed
files. Exact five-field reconciliation accounts for 67 Core type sites:
54 managed type representations and 13 private native forwards. This replaces
58 pending and nine type-level partial statuses only; callable and template
acceptance is not implied. Core now contains 474 existing local records,
54 verified managed type sites, 13 reviewed native private forwards and eight
remaining partial value/template records.

The persistent native property-iterator probe links current package objects
and passes actual unique-owner construction, move construction preserving
position, and move assignment releasing the replaced owner exactly once.
It also compiles the deleted-copy and noexcept-move contracts.
Formatting and cpplint pass. The existing JS iterator consumer verifies one
native entry, zero callbacks, independent property copies, style updates and
element destruction. All three transfer indices 2076–2078 are reconciled;
the managed API remains a complete native traversal into independent snapshots.

The reconciler records source/test fingerprints, exact original indices and
runtime exits; repeated reconciliation leaves all four artifacts byte-identical.
Full inventory matching remains 2,533 of 3,926 represented rows with 1,393
unmatched; these are not feature pass counts. Continue external C++ pointers,
full destination/lifetime matrices, remaining declarations including media/font
IDs, Lua follow-ups, modules, apps/visuals, GPU/platform IME, browser/editor/
package CI and independent whole review. No milestone stop or commit/push.

Evidence: `../audit/6.3/core-type-runtime-acceptance.md`,
`type-forward-runtime.log`, `type-forward-runtime-results.json`,
`property-iterator-transfer-native-final.log` and
`record-type-forward-runtime.py` under `/tmp/rmlui-63-completion`.

### Verified continuation: Variant string consumption

Public string destinations and Property/Definition/Specification serializers
reject direct pointer kinds before inspecting native addresses. Nested
decorator/filter values follow only actually serialized plain properties;
cached text and declarations without instancers retain native behavior.
Scalar conversion allocates no traversal containers or native owner scans.
The native-only C++ pointer string converters remain unchanged.

The existing external matrix passes 118 cases, including 72 rejection cases,
two cached-text controls and the previous 44 lifetime/consumer cases. The
independent original pointer string probe exits zero. Full package acceptance
exits zero: 109 unique runtime files, 1,096 PASS, zero FAIL and no native
compiler errors/warnings. Five LLVM 18 naming units, formatting and lint pass.
Four-language documentation has 81 passing tests, 152 localized pages,
1,596 API pages per language, 303 redirects and all local links/assets.

The separate direct native converter probe now executes 96 specializations
in four groups, with final compile/runtime/format/cpplint and naming checks.
It preserves actual platform long types, direct char-to-Character conversion,
integer vector copies and real ScriptInterface pointer copy behavior.
It reuses existing compiler flags and ScriptInterface object output;
it is not included in the ordinary package runtime counts.

This does not finish the 317 original converter declarations or promote any
Core/Supplemental template row. Continue exact templates, remaining full
inventory, Lua, modules, GPU/platform IME, applications/visuals, browser/editor/
package CI and whole-change review without a milestone stop or commit/push.

Evidence: `../audit/6.3/variant-serialization-acceptance.md`,
`../audit/6.3/variant-serialization-evidence.json`,
`type-converter-scalars-verify-3.log` and
`type-converter-scalars-naming-2.log` under `/tmp/rmlui-63-completion`.

### Exact converter and value-template continuation

The permanent native runner executes 152 concrete specializations directly:
all scalar pairs, exact platform widths, character/vector/colour/string/pointer
copies, string parsing and serialization, units and complex value lists.
Its actual loaded-addon consumer fixture verifies 26 native Variant storage
kinds and the exact Property, Element and Event template operations. It uses
existing product lifecycle symbols rather than stubs.

`../audit/6.3/type-converter-declaration-map.json` retains all 317 original
converter records and 26 consumer records by original index and complete
declaration key. Compiler rejection of unsupported Payload and Character string
conversion is recorded separately from runtime groups and from the original
parser records. Four-language guides and Variant TSDoc now describe native
destination mutation, bool/float parsing and complex string append behavior.

Observed acceptance: 22 native runtime groups, one successful compiler control,
two expected compiler rejections; complete `npm test` exit zero with 109 runtime
files, 1,099 PASS, zero FAIL and zero native compiler diagnostics. Native fixture
formatting/cpplint/naming pass. Site tests and build exit zero: 81 tests, no
failures/skips, 152 localized pages, 1,596 total API pages per language,
303 redirects and all local links/assets.

Eight original Core and nine Supplemental consumer rows have local
verification. Core retains 549 records: 482 local operation records,
54 managed type records and 13 private forwards. Supplemental retains 1,547:
1,539 local, seven partial and one opaque forward. Eight-map reconciliation
contains 2,859 represented and 1,067 unrepresented records; these are mappings,
not acceptance counts.

The durable acceptance and fingerprinted evidence are
`../audit/6.3/type-converter-template-acceptance.md` and
`../audit/6.3/type-converter-template-evidence.json`. Full Core nineteen groups,
remaining original declarations and Lua follow-ups, optional modules,
initialization/GPU/platform checks, applications/visual corpus, editor/package/
CI acceptance and whole-scope review remain active. Continue without a milestone
approval pause. No staging, commit, push, publication, worktree or isolated
build/test environment.

### Supplemental type relationship continuation

Seven original Supplemental records have exact source and consumer acceptance:
Factory and FontEffect forwards in FontEffectInstancer, the StyleSheet forward
in Decorator, the static Factory class, Event forwards in EventInstancer and
EventListener, and the Element forward in EventListener.

The Factory class was reconciled with all 31 original public operation records.
Its current suites include all nine instancer categories. Native friend
declarations add no public method; managed stylesheet interfaces preserve
owned-cache retention and scoped borrowing; event callbacks retain actual
allocation owners, active leases and checked target identity.

Observed execution uses the existing package/native build: 20 consumer files,
198 PASS, zero failed files. Supplemental now has 1,540 local operation/value
records, six managed type sites and one reviewed opaque forward, with no partial
record. Core's independent 549-record categories remain unchanged.
Nine-map inventory reconciliation represents 2,859 original records and leaves
1,067 unrepresented. These are mapping counts, not a completion percentage.

Evidence: `../audit/6.3/supplemental-type-acceptance.md`,
`../audit/6.3/supplemental-type-declaration-map.json` and
`../audit/6.3/supplemental-type-evidence.json`.
Continue supporting declarations, Lua follow-ups, Core nineteen groups,
optional modules, initialization/GPU/platform checks, applications/visuals,
editor/package/CI and whole-scope review. No milestone approval pause,
staging/commit/push/publication, worktree or isolated build/test environment.

### Native numeric declaration continuation

All 459 original numeric records have exact indexed mappings across twelve
headers. Native float row/column matrices, six float/int Vector2/3/4 types,
byte/float colours, int/float rectangles and Math execute directly against
existing native objects. Aliases, fields and declarations are distinguished
from operations; arbitrary custom component types and other platform ABIs
are not accepted by these probes.

The permanent runner produces 21 literal PASS lines: fifteen runtime groups,
one supported compilation control and five expected compile-time rejections.
Four matrix storage multiplication combinations, cross-storage transposed
aliases, singular inversion, strict positive random bounds and nonidentity
quaternion/perspective Compose results are checked. The nineteen exact vendor
edits remain reproducible and idempotent.

Six existing consumer suites verify owned snapshots, actual pixels,
premultiplied values, checked conversion destinations and fixed matrix buffers.
The 1k/10k/100k TransformBuffer refresh contracts use one entry with zero
callbacks, ownership visits and new buffer allocations; actual copy bytes
remain explicitly counted.

The complete package exits zero: 109 runtime files, 1,099 PASS, zero FAIL,
zero compiler errors and one compiler warning in the default clipboard adapter.
Current Unicode clipboard tests use custom callbacks. Default SFML clipboard
UTF-8 behavior and zero-warning package acceptance remain open.

Evidence: `../audit/6.3/numeric-native-contracts.md`,
`../audit/6.3/numeric-declaration-map.json` and
`../audit/6.3/numeric-native-evidence.json`.
Ten maps represent 3,318 original records and leave 608 unrepresented; these
are mapping counts. Core and Supplemental acceptance categories are unchanged.

Continue the default clipboard path, remaining supporting declarations,
Lua follow-ups, Core nineteen groups, modules, initialization/GPU/platform
checks, applications/visual corpus, editor/package/CI and whole-scope review.
No milestone approval pause, staging/commit/push/publication, worktree or
isolated build/test environment.

### Native string, URL and default clipboard continuation

The actual default clipboard now has independent read/write Unicode tests
against `sfml.js.Clipboard`. Both Unicode directions fail before explicit
UTF-8 conversion; all fourteen current SystemInterface scenarios pass
afterwards. The original clipboard text is restored in each test.

Six maintained string/URL edits correct URL replacement and query cache,
unsigned complete-byte URL encoding, embedded-NUL StringView equality and
nonadvancing empty-search replacement. The permanent native runner exits zero:
seven runtime groups and one hardened-source verification marker. Fourteen
partial RML entities execute against the actual extensively hardened source
and preserve their input; no out-of-bounds defect is claimed for those controls.

The complete patch pipeline remains idempotent with unchanged no-op source
timestamps. Native formatting, cpplint, patch ESLint and two maintained
identifier naming units pass. Evidence is recorded in
`../audit/6.3/string-url-native-contracts.md`.

Public String/URL APIs, checked retained byte views, batched codepoint/byte
offset conversions, four-language types/guides, exact 88-record mapping and
fresh complete package acceptance remain open. Numeric package-three evidence
retains its original compiler warning; it has not been rewritten.
The inventory still has ten maps, 3,318 represented and 608 unmatched records.
These are mapping counts, not pass counts.

Continue all remaining supporting declarations, Lua follow-ups, Core nineteen
groups, modules, initialization/GPU/platform checks, applications/visuals,
editor/package/CI and whole-scope review without a milestone approval pause.
No staging/commit/push/publication, worktree, clone, copied repository or
isolated build/test environment.

### Public String/URL and current package acceptance

This checkpoint supersedes the preceding String/URL pending list.
`../audit/6.3/string-url-declaration-map.json` reconciles all 88 original
declarations using exact indexed keys. Native pointer/literal/varargs domains
remain separate from checked retained views, numeric positions and typed
formatting. `StringView.begin/end` expose byte positions; `StringInput`
is publicly documented. Native owners, cached indices, overlapping batches,
iterator sentinels and callback accessors receive a separate controller review.

Current full `npm test` exits zero in `string-url-package-2.log`: 112 runtime
files, 1,125 literal PASS lines, zero failures and zero emitted native compiler
warnings/errors. All forty independent String/URL entries actually execute in
a worker while other runtime entries retain environment ownership protection.
The failed first current package run is preserved.

The permanent native runner records seven runtime groups plus a hardened-source
marker. Four-language TypeDoc checks pass with source-localized parameters,
returns and defaults. All four guides publish through the existing manifest
and execute their identical native example. The actual temporary npm archive
matches thirteen critical source/generated files; no isolated install or
archive-runtime execution is claimed.

`../audit/6.3/string-url-native-evidence.json` fingerprints current sources,
logs, original declaration keys and the archive. The independent evidence
verifier recomputes eleven-map 3,406 represented / 520 unrepresented records.
Representation is not a pass count. Original numeric evidence and Core
549 = 482 local + 54 managed + 13 private, Supplemental 1547 = 1540 local +
6 managed + 1 opaque remain unchanged.

Continue remaining 520 supporting records, Lua follow-ups, Core nineteen
groups, modules, initialization/GPU/platform input, twenty applications and
113 visuals, editor/browser/package/CI and the whole-binding review.
No milestone pause, staging, commit, push or publication. 禁止使用
`using-git-worktrees`，禁止创建 worktree，禁止为构建或测试创建隔离环境，
在现有工作目录完成任务。

## Native support and application logging acceptance

[Support acceptance](../audit/6.3/support-native-contracts.md) reconciles 157
original declarations across configured containers, observers, property sets,
traits, Debug, Log and Plugin. Original pointer syntax and native ABI facilities
retain native execution; managed consumers use checked handles, retained views,
records and detached ID snapshots.

`Log.message` and `Log.parseError` now format and dispatch through native
`Rml::Log` in one owned entry. Native truncation, NUL, percent, negative-line,
callback exception and worker ownership contracts execute in six scenarios.
The current complete `npm test` exits zero: 113 runtime files, 1,131 PASS,
zero failures and zero emitted compiler warnings/errors. Eight original native
support groups, four-language TypeDoc contracts, eleven guide-routing tests,
native formatting/naming and the 598-entry archive checks pass. Original
String/URL and numeric checkpoint artifacts remain retained.

[Exact reconciliation](../audit/6.3/full-inventory-reconciliation.json) includes
twelve maps: 3,563 represented and 363 unrepresented declarations.
Representation is not a pass count. Original Core and Supplemental acceptance
categories remain unchanged. Continue the remaining declarations, beginning
with XML parser callbacks, followed by Lua/Core nineteen groups, modules,
initialization/GPU/platform IME, twenty applications/113 visuals,
documentation/editor/package/CI and whole-binding acceptance. No milestone
pause, staging, commit, push or publication.

禁止使用 `using-git-worktrees`，禁止创建 worktree，禁止为构建或测试创建
隔离环境；在现有工作目录完成任务并保留其他任务的改动。

## Native XML parser and node-handler acceptance

[XML contracts](../audit/6.3/xml-native-contracts.md) account for 49 exact
original declarations: BaseXMLParser 19, XMLNodeHandler 8 and XMLParser 22.
Forward declarations and native lifecycle facilities remain distinct from
managed application operations. Upstream ReleaseHandlers stays internal to
checked shutdown.

Native tokenization and default DOM parsing each use one native entry with
zero host callbacks. Base public virtual dispatch, optional callback validation,
scoped parser references, native delegation, header copies/writeback, active
data submission, owned roots and setup/shutdown revision checks have behavioral
verification. Shared numeric and geometry contracts are unchanged.

The complete `npm test` exits zero: 114 runtime files, 1,148 PASS, zero FAIL
and zero emitted native compiler warnings/errors. Four original native groups,
17 XML scenarios, four-language TypeDoc, 11 guide-routing checks, actual guide
execution, native format/naming and 19 current source/dist archive comparisons
pass. The implementing assistant performed the source review; it is not an
independent reviewer. No isolated installation or archive-runtime claim.

[Exact inventory reconciliation](../audit/6.3/full-inventory-reconciliation.json)
contains thirteen maps: 3,612 represented and 314 unmatched declarations.
These are mapping counts, not pass counts. Earlier Support/String evidence
retains historical fingerprints after shared runtime/header edits.

Continue ConvolutionFilter/MeshUtilities and other unmatched declarations,
Lua follow-ups, nineteen Core groups, modules, initialization/GPU/platform IME,
twenty applications, 113 VisualTests, browser/editor/package/CI and whole-binding
acceptance. No milestone pause, staging, commit, push or publication.

禁止使用 `using-git-worktrees`，禁止创建 worktree，禁止临时 clone 或复制仓库，
禁止为构建或测试创建隔离环境；在现有工作目录完成任务并保留其他任务改动。

## Native geometry and convolution acceptance

[Utility contracts](../audit/6.3/utility-native-contracts.md) account for all
17 exact ConvolutionFilter/MeshUtilities declarations. Native owns kernels,
byte allocations and mesh vectors. Shared kernels survive reinitialization and
GC. Alpha-only Run checks signed indexing, stride, formats, backing and weights;
negative Sum output rejects before any destination writes.

The shared command adapter validates and submits a whole selected batch in
one Native entry. Mesh append retains old views, copies the prefix once only
when retained, and otherwise reuses geometrically growing buffers. Original
quad/line/background/border geometry matches five Native fixtures byte-for-byte.

Final complete `npm test` exits zero: 117 runtime files, 1,166 PASS, zero FAIL
and zero emitted Native compiler warnings/errors. Eighteen utility scenarios,
four Native groups, five byte comparisons, TypeScript consumers, four-language
TypeDoc, 11 routing checks, 12 guide code blocks, Native naming/format checks and
24 actual archive byte comparisons pass. No isolated install, archive-runtime
or independent source-review claim.

Nine CPU utility groups contain 720 timed samples and 45 separately counted
calls. The 100k shared quad batch p50/p95 is 1.564542/1.703000 ms with 1/0
crossings. The measurement excludes mesh reset, layout, render and GPU.
Existing Mesh.resize prefix copying remains an explicit Core optimization.

[Reconciliation](../audit/6.3/full-inventory-reconciliation.json) contains
14 maps: 3,629 represented declarations and 297 unmatched declarations.
These counts are not passes. Previous XML/Support/String evidence keeps its
historical source fingerprints after shared export/diagnostic changes.

Continue existing FontMetrics/TextShapingContext fields and remaining headers,
Lua follow-ups, 19 Core groups, modules, initialization/GPU/platform IME,
20 applications, 113 VisualTests, browser/editor/package/CI and whole-binding
acceptance. No milestone pause, staging, commit, push or publication.

禁止使用 `using-git-worktrees`，禁止创建 worktree，禁止临时 clone 或复制仓库，
禁止为构建或测试创建隔离环境；在现有工作目录完成任务并保留其他任务改动。

## Native font interface and field acceptance

[Font contracts](../audit/6.3/font-native-contracts.md) account for 15 exact
FontEngineInterface, nine FontMetrics and five TextShapingContext declarations.
The existing Native implementation required additional field/lifecycle evidence,
not a replacement adapter. Native production edits add logical blank lines.

Independent metrics snapshots expose all eight original fields. Shaping owns
language and shares the two enums and float32 spacing. Native calls snapshot
the language owner and all numbers before entering a provider. Callback changes
cannot alter later rows of the active batch; retained views survive observed
facade collection and shutdown.

The original FreeType engine passes three Native groups. Size 20 and 31 metrics
and 27 shaping combinations per size match scalar, array and shared-buffer
measurement through the managed API. Seven permanent field scenarios and all
43 font scenarios pass. The 100k numeric-access contract records 0/0 crossings;
it is not a complete-frame or GPU measurement.

Final complete `npm test` exits zero: 118 runtime files, 1,173 PASS, zero FAIL
and zero emitted Native compiler warnings/errors. Four localized API contracts
and 11 routing checks pass. Native naming/format, type consumers and 24 actual
archive byte comparisons pass. The archive has 612 entries and 1,568,685 bytes.
No isolated installation, archive runtime or independent review is claimed.

[Reconciliation](../audit/6.3/full-inventory-reconciliation.json) contains
15 maps: 3,658 represented declarations and 268 unmatched declarations.
These counts are not passes. Earlier font performance and other domains keep
their historical source fingerprints and verification scope.

Continue remaining ID/scroll/stylesheet/native aliases and renderer support,
Lua follow-ups, 19 Core groups, initialization/GPU/platform IME, optional
modules, 20 applications, 113 VisualTests, browser/editor/package/CI and
whole-binding acceptance. No milestone pause, staging, commit, push or publication.

禁止使用 `using-git-worktrees`，禁止创建 worktree，禁止临时 clone 或复制仓库，
禁止为构建或测试创建隔离环境；在现有工作目录完成任务并保留其他任务改动。

## Local ID and scroll declaration acceptance

[ID and scroll contracts](../audit/6.3/id-scroll-native-contracts.md) account
for 26 exact original MediaQueryId/FontFaceId declarations and 19 ScrollTypes
declarations. Public generated enums preserve all local constants and distinct
specifications. The existing Native scroll adapter preserves default and
boolean overloads, all four options and every original enum value.

Three Native groups verify the actual media parser, font-face defaults and
ordered sources, scroll constructors, five alignments on both axes and
fixed-clock Smooth/Auto behavior. Three comparison groups match all 34
constant members, ten scroll offsets and explicit/empty/omitted defaults.
The standalone Core fixture has a basic setup renderer and no data models;
its two binding-only Lua cleanup boundaries do not provide Lua acceptance.

The permanent local-ID suite passes three scenarios. The 17 layout and ten
document scenarios also pass, including all dual-axis alignments, nested
All/Closest parentage, invalid inputs, callback errors and accessor invalidation.
100,000 constant-access rounds have zero Native entries and zero callbacks.
Native naming, format, fixture style and type consumers pass.

The complete `npm test` exits zero: 119 runtime files, 1,177 PASS, zero FAIL
and zero emitted Native compiler warnings/errors. Four-language API and the
complete examples/navigation suite pass 30 checks; guide/media routing passes
11 checks. The navigation expectation now includes the existing Strings guide.
The actual archive has 618 entries and 1,573,175 bytes; twenty selected
generator/source/Native/dist members match current bytes. No isolated install
or archive runtime execution is claimed.

[Current reconciliation](../audit/6.3/full-inventory-reconciliation.json) uses
16 maps: 3,703 represented declarations and 223 unmatched declarations.
All 13 previous on-disk declaration maps retain their exact fingerprints.
Representation includes pending statuses and is not a pass count.

Continue renderer/stylesheet/native aliases and remaining module declarations,
Lua follow-ups, 19 Core groups, initialization/GPU/platform IME, 20 applications,
113 VisualTests, browser/editor/package/CI and whole-binding acceptance.
No milestone pause, staging, commit, push or publication.

禁止使用 `using-git-worktrees`，禁止创建 worktree，禁止临时 clone 或复制仓库，
禁止为构建或测试创建隔离环境；在现有工作目录完成任务并保留其他任务改动。

## Renderer declaration and Native compatibility acceptance

[Renderer contracts](../audit/6.3/renderer-native-contracts.md) reconcile
31 modern and 27 compatibility declarations without treating declared
signatures as full semantic acceptance. The modern interface remains an opaque
runtime-owned token; compatibility remains Native-only legacy support.

Six direct Native groups verify optional defaults, canonical adapter ownership,
snapshot/color conversion, per-texture compiled caching and release, immediate
fallback/retry, texture success/failure and legacy scissor/transform behavior.
The fixture creates no contexts, JS runtime, Lua models or GPU target.

Six renderer consumer suites pass 68 scenarios, zero failures. New real pixels
cover inverse and intersection masks and restoration after disabling them.
Existing consumers retain geometry/texture/custom-GLSL, scissor, affine
transforms, layers, blur, saved snapshots and GC/shutdown evidence.
Native naming, format, fixture style and lint pass. Production drawing was not
changed, and the previous complete package build was not repeated.

[Reconciliation](../audit/6.3/full-inventory-reconciliation.json) uses 17 maps:
3,761 represented declarations and 165 unmatched declarations.
All 14 prior on-disk declaration maps retain exact fingerprints.
Representation includes partial and pending rows; it is not a pass count.
Full built-in gradients, filters, readable base layers, backdrop combinations,
perspective, deep/transformed clipping and error protocols remain open.

Continue stylesheet/types/hash/debugger/SVG/Lottie declarations, Lua follow-ups,
19 Core groups, renderer/GPU/platform IME, modules, 20 applications,
113 VisualTests, browser/editor/package/CI and whole-binding acceptance.
No milestone pause, staging, commit, push or publication.

禁止使用 `using-git-worktrees`，禁止创建 worktree，禁止临时 clone 或复制仓库，
禁止为构建或测试创建隔离环境；在现有工作目录完成任务并保留其他任务改动。

## Stylesheet and shared type reconciliation

[Native contracts](../audit/6.3/stylesheet-types-native-contracts.md) retain
36 StyleSheetTypes, 98 Types and one HashCombine declaration. Six Native groups
verify configured scalar/handle/index/owner/value ABI, hashes, parser-owned
keyframe and decorator copies, media blocks and prioritized selector indices.
Forward declarations remain source-reviewed references to existing types,
without implicit acceptance of their member operations.

The negated media-query conjunction was corrected after a failing consumer
showed width 1 instead of 9 at an 80 × 240 context. The Native evaluation now
negates the complete conjunction. Its durable dependency patch is idempotent.
Four dimension combinations check outputs and compilation change results in
both Native and JS. Duplicate keyframe times retain the pinned last-block
replacement behavior.

Nine consumer suites pass 101 scenarios. Package lint, TypeScript fixtures and
Native fixture naming/format/style pass. Only the affected dependency object
and addon were rebuilt in the existing build tree; no complete package build,
isolated install or publication was repeated. Source review is implementer-only.

[Full reconciliation](../audit/6.3/full-inventory-reconciliation.json) now uses
18 inputs: 3,896 represented declarations and 30 unmatched declarations.
All fifteen preceding on-disk inputs retain their exact fingerprints.
Representation is not a pass count and the full scope remains incomplete.

Continue Debugger/Lottie/SVG, Lua follow-ups, nineteen Core groups, full renderer
semantics, GPU/platform IME/modules, twenty applications, 113 VisualTests,
editor/browser/package/CI and whole-binding acceptance without a milestone pause.

## Native alternate fonts and capabilities

[Font backend contracts](../audit/6.3/font-backend-native-contracts.md) record
the organized Native FreeType/HarfBuzz/bitmap factories and current runtime
capabilities. HarfBuzz 15.1.0 and its eleven upstream helpers compile without
sample `main`; bitmap uses two upstream helpers. Both providers reuse the
existing lifecycle/selection/generation checks and one compiled FreeType group.

The named-file HarfBuzz adapter retains Native bytes through shutdown.
Direct generation prepares cold glyphs before atlas creation. Atlas version
checks retire old texture views. A durable bitmap patch removes duplicate
quad expansion; actual installer repeats write zero files.

Eleven backend scenarios, 43 existing font scenarios, 31 resource scenarios
and four dependency checks pass. Four configurations build and verify
sequentially in the existing build directory, restoring both alternate engines
afterward. Native naming/format/style, lint, consumer types and four-language
comments pass. Package dry-run contains 640 files and 8,626,078 unpacked bytes;
no archive, isolated install or publication was performed.

[Fingerprinted evidence](../audit/6.3/font-backend-native-evidence.json) keeps
all final sources, logs, binary and configuration results. Red/intermediate
failures remain preserved. Original declaration maps and the 3,926-record
inventory remain unchanged. This is implementer-only local acceptance;
alternate-font applications, Linux/Windows, GPU and independent module review
remain unfinished.

Continue Lua registration/index/metamethod follow-ups, nineteen Core groups,
Mesh.resize prefix copying, full renderer/GPU/platform IME, twenty applications,
113 VisualTests, browser/editor/package/CI and whole-binding acceptance.

禁止使用 `using-git-worktrees`，禁止创建 worktree、临时 clone 或复制仓库，
禁止为构建或测试创建隔离环境；在现有工作目录保留无关改动继续执行。

## Source package, editor and rendered documentation checkpoint

The source package installs through its own shipped build and LSP helpers.
Dependency preparation and generated Native fields precede GYP. Installed
packages do not read unrelated Rush metadata. Actual install reused the
existing package and build tree; eight helper contracts pass. Source inventory
verifies 727 files and 57 install/build/application entry dependencies.

The completed whole-runtime run contains 149 suites, 1,550 PASS and zero FAIL.
It precedes the final installed-layout and publication tooling guards; those
contracts were separately rechecked without changing Native implementation.
Both original games retain their verified sources and pass twelve native
reference/loading/integrated contracts.

Installed VS Code 1.146.0 passes five activation, command, diagnostic,
completion, hover/color and restart contracts. The launcher requires this
run's report. The VSIX verifies current bundles, language assets and all four
README files, including VSCE's intentional README transformation and
monorepo-relative source links.

Four-language site build and links pass: 160 guide/example pages, 1,632 API
pages per language and 303 redirects. The browser run checks 1,920 RmlUi pages
at three widths. Four data-model guide bodies were empty because Vue executed
an inline RmlUi expression. The renderer now emits escaped code with `v-pre`.
Real SSR tests reproduce the prior expression error and verify literal output
in all four languages. All 56 RmlUi guides were rechecked at all three widths;
their 168 checks pass. The 1,864 API pages retain their earlier passing browser
checks with unchanged API sources. The site has 87 passing regression tests;
the final guide-output guard also passes its six focused tests and validation
of the built site.

Dedicated RmlUi/editor CI defines Linux, macOS and Windows jobs. Final workflow
validation passes with actionlint 1.7.12. Publication rejects all five open
scope gates, including six retained original VisualTests failures and physical
or cross-platform IME; nine rejection mutations pass. No remote job execution
is claimed.

The whitespace investigation traces trailing advance into line centering and
discarded whitespace-only span separators. The ellipsis investigation traces
later-line glyph insertion into an atlas rebuild after earlier UV generation.
Diagnostic marker priming removes repeat corruption, but leaves the canonical
failed captures and assertions unchanged.

[Current delivery evidence](../audit/6.3/source-package-editor-evidence.json)
and [original application evidence](../audit/6.3/official-package-applications-evidence.json)
retain exact sources, binaries and logs. Whole acceptance remains open.

Next: implement and verify missing non-macOS native IME bridges, obtain actual
platform/device evidence, resolve retained original visual contracts within
the pinned-Core constraints, and perform a distinct whole-change review.
Do not stage, commit, push or publish before complete acceptance.

禁止使用 `using-git-worktrees`，禁止创建 worktree、临时 clone 或复制仓库，
禁止为构建或测试创建隔离环境；在现有工作目录保留无关改动继续执行。

## Native Lua declaration consumers

[Native Lua contracts](../audit/6.3/lua-native-contracts.md) add thirteen direct
consumer scenarios in the existing package VM. Real custom value and Element
types instantiate the descriptor/template APIs; Element inheritance and
RmlUi RTTI remain native. Method dispatch, getter/setter overrides, function
and table fallbacks, equality, bounded pointer formatting, GC, checked casts,
expired aliases and isolated VM registrations are exercised.

Two failing consumers established the index overflow/narrowing and nil-method
receiver defects. The durable Lua dependency patch widens/checks indices before
narrowing and retains the nil-return branch before acquiring a receiver guard.
GC and error unwinding still retain live receivers. Native Variant/null
consumers preserve 64-bit extrema, embedded-null strings and typed values.

Native package builds, consumer naming/format/style, package lint, TypeScript
consumer contracts, four-language source comments and localized guide links
pass. Five dependency scenarios include two Lua patch repeats with zero writes.
[Evidence](../audit/6.3/lua-native-evidence.json) supplements the exact original
55-declaration map without promoting its historical statuses.
Concrete managed-VM checks are implementer-only; arbitrary foreign VM and
independent whole-scope acceptance remain open.

The complete runtime runner exits zero with 128 test files, 1,220 literal PASS
lines and zero failures. The thirteen native Lua consumers run separately
against that final native binary. This complete runtime result also includes
the alternate font providers introduced before this checkpoint.

Continue nineteen Core acceptance groups and full operation-ledger
reconciliation, Mesh.resize prefix copying, renderer/GPU/platform IME,
twenty applications, 113 VisualTests, browser/editor/package/CI and whole-scope
acceptance without a milestone pause.

禁止使用 `using-git-worktrees`，禁止创建 worktree、临时 clone 或复制仓库，
禁止为构建或测试创建隔离环境；在现有工作目录保留无关改动继续执行。

## Mesh resize destination storage

[Mesh resize acceptance](../audit/6.3/mesh-resize-acceptance.md) verifies fresh
destination-sized Native vectors and copies only the surviving prefixes.
Value-initialized new vertices/indices, same-size replacement, retired shared
views and invalid-count atomicity preserve the existing public contract.

Seven new data/lifetime scenarios, two performance contracts and 23 existing
geometry/utility scenarios pass. Eighteen workloads cover 1,000/10,000/100,000
source vertices, empty/small/doubled destinations and held/unheld views.
Actual macOS allocation requests for 100,000 to three vertices/nine indices
are 168 bytes; empty destinations request only the 72-byte shared control
block. Original failing allocation tests and baseline logs remain preserved.
Native builds, lint, cpplint, format and naming checks pass.

[Evidence](../audit/6.3/mesh-resize-evidence.json) records exact sources,
measurements, logs and final Native binary. This is local implementer
verification; Core's nineteen groups, full renderer/GPU/platform IME,
applications, VisualTests and final independent/package/CI acceptance continue.

## Core criterion and exact-source reconciliation

[Core observations](../audit/6.3/core-19-acceptance.md) link all nineteen
requirements to specific runtime assertions. Eighteen managed contracts have
local evidence; A19 remains open for complete resolved TypeScript overload
coverage and per-overload negative consumer review.

[Normalized exact references](../audit/6.3/core-operation-acceptance.json)
retain 549 Core and 1,547 dependent sites. Of these, 2,094 match the original
compiler inventory, and two conversion operators remain explicit source
supplements. Fourteen private/opaque forwards and twenty-four Factory type
references retain their actual native boundaries. Source, consumer and runtime
references are deduplicated; historical ledger/map bytes remain unchanged.

Five new Core boundary scenarios verify duplicate Context identity, repeated
shutdown, opacity/pointer-events interaction, disabled-option click versus
programmatic selection and transformed bounding boxes. Native float32 bounds
use a tolerance below 0.0001 and explicitly return null for depth-clipped
corners. Two RCSS diagnostic scenarios assert the exact Unicode source URL,
starting-line offsets, both native recovery warnings and the surviving rule.

The current runtime evidence is one complete 131-file runner with 1,301 literal
PASS lines and zero failed files. Eight direct Native event observations
match eight binding observations. Final fixture lint and complete consumer
compilation pass.

The TypeScript contract review resolves all 963 public callable signatures
to positive consumers. Ten annotated internal signatures retain actual source
allocation calls; there are no unmatched consumer signatures. Structural
parameter/return matching preserves union equivalence between source and
emitted declarations without removing distinct overloads.

One invalid mutation per public signature is rejected by the actual compiler:
963 rejections, zero unresolved cases, and zero original consumer diagnostics.
Eighteen overlapping/nested checks were repeated individually. Exact
declarations, positive call sites, mutations and diagnostic messages are
persisted in the audit directory. Separately authored negative fixtures and
package lint also pass.

All nineteen managed Core criteria now have bounded local observations.
This does not establish exhaustive upstream runtime or independent acceptance.
Continue full renderer/GPU/platform IME, twenty applications, 113 VisualTests,
rendered documentation/editor/package/CI and independent whole-scope
acceptance. No milestone pause or repository push.

禁止使用 `using-git-worktrees`，禁止创建 worktree、临时 clone 或复制仓库，
禁止为构建或测试创建隔离环境；在现有工作目录保留其他任务改动继续执行。

## Native color filter continuation

[Color filter observations](../audit/6.3/renderer-color-filter-acceptance.md)
cover all eight missing color names through dedicated
`native/rendering/effects/color-filter.*` and immutable
`effects/filter-record.h` state. The shader preserves premultiplied alpha,
constant-column alpha multiplication, native coefficients/defaults/radians
and ordered chains. Managed parameters reject nonnumeric or nonfinite values.
Unavailable effect shaders cannot produce a nominally valid filter handle.

The twelve initial pixel/parameter cases failed before implementation.
All twelve now pass, as do nine existing layer cases and four existing
compiled-resource cases. Package lint, consumer types, cpplint, six touched
native format files and three actual LLVM18 naming units pass. Naming uses
the established compatible LLVM standard headers with the current SDK;
the initial mismatched SDK/libc++ invocation is retained as failed evidence.
Four-language rendering guides now describe color filters and retain
explicit backdrop/perspective limitations.

The effect-enabled complete runtime runner passes all 131 files with 1,301
literal PASS lines and zero failed files. Core's normalized operation
references and nineteen-criterion matrix use this actual complete run and
its exact Native binary fingerprint.

[Evidence](../audit/6.3/renderer-color-filter-evidence.json) fingerprints the
actual sources, analytic pixel cases, regressions, logs and Native binary.
Readable owned layer zero, render-session rollback/host-view restoration,
full transforms/deep clipping, gradients, scale-correct blur/shadow,
GPU/platform/device IME and whole-application acceptance remain open.

## Geometry and clip protocol continuation

[Bounded observations](../audit/6.3/renderer-transform-clip-acceptance.md)
cover ordinary homogeneous geometry, clip geometry, perspective texture
interpolation, invalid index transactions, mask definition snapshots,
disable/re-enable, overlapping intersections and stencil normalization.
The renderer uses explicit vertex field conversion and subsystem-owned
geometry, clipping, layers, effects, shaders, textures and manager units.
Its native adapter can run with owned counters, independently of V8 state.

Seven analytic transform/UV cases, three clip pixel cases and five direct
native protocol cases pass. The complete 135-file runtime run records 1,323
literal PASS markers and zero failures; current source/binary hashes and
all 2,096 Core evidence sites reconcile through the supplemental renderer map.
Custom supplied vertex programs retain their original SFML affine convention;
built-in gradient/creation programs required full homogeneous integration at
that checkpoint; the subsequent bounded shader observations are recorded below.
Blur/shadow scheduling, GPU failures, platform/device IME, twenty applications,
113 VisualTests, documentation/editor/package/CI and independent whole
acceptance remain open. Continue those gates without a milestone pause.

## Gradient and creation continuation

[Bounded shader observations](../audit/6.3/renderer-shader-acceptance.md)
cover all six gradient variants and native creation with immutable typed
parameters, complete stop lists, premultiplied colors and full homogeneous
transforms. Equal stops and zero repeat intervals have explicit behavior.
Twenty-one stops, fixed clock values, combined scissor/stencil and perspective
pixels, actual GLSL failure and a content-positive RML decorator are verified.

The ten new native shader groups, five existing native renderer groups and
six managed resource groups pass. Native/TS builds, lint, cpplint, consumer
types, four-language source comments, formatting and naming pass.
The complete runtime passes 135 files and 1,335 literal PASS markers, with
zero failed files. Core/source provenance reconciles all 2,096 sites,
302 evidence groups and 1,174 current fingerprints. A separate GL3 driver
has captured 16 content-positive blur/shadow reference images; actual SFML
comparisons remain the next gate.
Scale-correct blur/shadow bounds, GPU/platform failures, device IME, official
applications, 113 VisualTests, site/editor/package/CI and independent whole
acceptance remain required. Continue without staging, committing or pushing.

### Task 9 continuation: complete static VisualTests reference captures

All 113 unchanged visual pages and eighteen match documents now execute through
the binding renderer and a separate pinned GL3 executable, reusing existing
Core objects and assets. The 144 primary and nineteen match top/scroll captures
all compare within one RGB byte at identical coordinates; 159 of 163 are
byte-identical. Every source fingerprint and per-page result is retained in
[the visual ledger](../audit/6.3/visual-corpus-evidence.json).

The corpus exposed source-alpha color-matrix clamping and missing ordinary
texture repeat addressing. Both are corrected with failing-before/passing-after
regressions. All 152 integrated runtime files pass with 1,541 literal PASS
markers and zero failed files. Native lint, formatting, naming and localized
documentation comment checks pass for this continuation.

All 113 pages have literal content assertions; 109 pass and four original
contracts fail in both the binding and independent upstream GL3. All eighteen
upstream match pages pass their pixel or explicit feature comparisons.
The assertions are organized into layout/inline, controls and rendering
subsystems. Both drivers freshly capture every auxiliary inline box, native
baseline, visibility, scrollbar size and debugger Auto ink bounds. All passing
content contracts are also executed against independent native captures;
49 mutations reject missing
rendering or corrupted content widths.

Twenty-five unchanged pages also execute live mouse/key/scroll/layout input
sequences through both drivers. All 165 checkpoints are byte-identical;
23 positive behavior contracts pass and two fail in both drivers.
Passing contracts cover animation endpoints, label forwarding, scroll retention,
media changes, arrow/Tab navigation, three anchoring modes and edge limits,
inline box splitting, both transformed drag clones, every inherited text
decorator hover case, all custom markers and the remaining block/flex
scroll extents. Sixteen mutations independently reject lost behavior in both
drivers. The
[interaction ledger](../audit/6.3/visual-interaction-evidence.json) records the
literal input hash and each verified checkpoint.

The failures in `position_05_floating_a_box_clear`,
`position_07_absolute_positioning_relative`, `white_space` and
`ink_overflow_bounding_box` are retained as failed contracts,
with source evidence in
[the checkpoint](../audit/6.3/visual-corpus-checkpoint.md). All original
whitespace requirements now run separately: trailing-I/final-ABC centering,
Hello World spacing and Duck word spacing fail. Actual debugger bounds cover
box shadows but omit the rendered 40px drop shadow. No fixture or Core source
was rewritten. The reference builder's current native context boundary now
also rejects unexpected Lua-model release, matching the existing Core
lifecycle hook.

Both drivers now initialize Debugger like the original VisualTests shell.
All 163 static captures were refreshed with that setup; all 109 passing
content contracts also pass against the fresh independent native captures.
The interaction validators use controls/layout/rendering directories, and frame
selection distinguishes a page from other pages sharing its name prefix.

Live `flex_04` resizing additionally reveals intrinsic auto-basis clamping:
the original `flex: none` long item shrinks from 263dp to 164dp.
Live `text_overflow_01` additionally reveals 264 changed first-line pixels
on a second render without input or time advancement. Both remain failed
original contracts, with independent messages and locations in the ledger.
No fixture or Core source is changed by this continuation.

Original contract resolution, platform work, physical IME,
documentation/editor/package/CI and independent whole acceptance remain open.
Continue without staging, committing or pushing.

## Original applications in the package build

Both native games now have GYP targets in the existing package build directory.
The application loader uses those modules without Python, compiler spawning or
another build directory. Unix loads the same Core/Lua symbols through the
binding's promoted image. Windows import/export and shared-CRT paths are
implemented but have no platform compilation/execution evidence.

The score-file wrappers preserve the original source bytes and avoid renaming
the Windows CRT's imported fopen declaration. Windows filename validation and
score I/O use UTF-8-to-wide conversion. Both upstream game-tree fingerprints
remain unchanged. Original application sources and the GYP fragments are
included in the source-package inventory.

A failing integrated regression exposed independent per-module application
slots. The corrected slot belongs to the shared Core generation; both module
orders reject a second original application, and runtime restart permits
another application. Current evidence records two compiler-free loading
contracts, ten unchanged native game cases and both integrated game lifecycles.
Native build, lint/format, TypeScript build/types, all 81 site tests, five
language-server test files and extension typecheck/bundling pass.

[Current package application evidence](../audit/6.3/official-package-applications-evidence.json)
keeps the source and binary fingerprints and the failed shared-slot regression.
The earlier full-runtime attempt was stopped to rebuild the shared slot and
does not establish final acceptance.

The source-package/editor/rendered-documentation checkpoint above records the
completed install helpers, whole-runtime run and local delivery verification.
The [native input boundary checkpoint](../audit/6.3/platform-input-boundary-evidence.json)
now records the deferred common queue, per-window callback registry and Cocoa
platform directory. The current Native build and complete runtime pass
150 files with 1,559 literal PASS markers and no failed files. Real
widget/Cocoa contracts and the callback registry pass. The SFML native hooks
and Windows/Linux adapters remain absent; no platform or whole-scope gate is
promoted. Earlier package/editor snapshots require a later actual rerun
before their Native fingerprints and moved paths can describe this revision.
Next: missing non-macOS native IME adapters, platform execution, physical IME,
six retained original VisualTests disagreements and independent whole-change
review. No task or whole-scope acceptance is promoted.

禁止使用 `using-git-worktrees`，禁止创建 worktree、临时 clone 或复制仓库，
禁止为构建或测试创建隔离环境；在现有工作目录保留无关改动继续执行。

## SFML native input hook continuation

Window now exports the native registration API and stores callback provenance
on its actual key/text queue. Windows deliveries bracket the original/default
window procedure; X11 deliveries report the actual filter result and use the
host display/XIM/XIC configuration. Both platforms retire registered handles
at native cleanup. Their composition adapters remain unimplemented.

The source preparation and platform build helpers are organized under
`packages/sfml.js-interop/tools/sfml`. They reuse existing dependency directories
and preserve the original System library. Patch/protocol/helper bytes all
participate in the installed marker. A two-call probe confirms that unchanged
preparation does not replace the installed library.

The real macOS SFML build and loaded-library protocol tests pass. Eight
registry/delivery tests pass with C++17, including nested detach/replacement,
unwinding and exact filter delivery. Whole native formatting passes 384 files;
protocol lint, shared JavaScript lint and focused compiler naming pass.
The RmlUi rebuild passes. The completed collector executes 150 test files with
1,559 literal PASS markers and no failed files; the separate real-widget/Cocoa
fixture passes 46 contracts. The collector took its file list before addition
of the Windows lineage test, whose three contracts pass separately.
Windows/Linux compilation, actual composition/candidate behavior, physical IME,
the six retained original visual contracts and independent whole acceptance
remain open.

Ruling: native filter ownership is reported by X11 before queuing its SFML
event, rather than inferred from a visible composition or public key payload.
Incorrect inference would permit an IME Enter key to insert an extra newline.
The actual installed-library test caught an initial Git patch invocation that
silently skipped absolute targets; the corrected helper runs in the existing
dependency source directory.

The [current hook checkpoint](../audit/6.3/platform-window-hook-evidence.json)
retains these source/binary hashes and actual failing-before logs. The Windows
platform directory now has a native delivery lineage model; three portable
synthetic tests pass for surrogate descendants, unrelated characters/keys
and unmatched native exits. The model has no event history or value matching.
Its formatting, package lint and compiler naming pass. An actual IMM32
adapter and the X11 preedit/caret adapter remain next.

## Windows and X11 adapter source checkpoint

[Current adapter evidence](../audit/6.3/platform-adapter-checkpoint.json)
records IMM32 composition/events/focus sources under `ime/windows`, and
XIM preedit/events/focus sources under `ime/x11`. The non-Apple factory now
has Windows and Linux implementations with platform GYP libraries. Their
target-platform translation units have not compiled or executed.

Real widgets on macOS verify four Windows UTF16/result/preedit contracts
and four X11 character/preedit/caret/cancel contracts. The complete dedicated
widget/Cocoa fixture passes 54 contracts. Nine registry contracts and three
loaded-library contracts pass. The XIC teardown regression initially failed:
closing released the native callback owner before destruction callbacks.
The registry now returns retirement ownership; SFML destroys the XIC inside
cleanup while retaining that owner and rejecting further capture.

Current macOS Window and RmlUi builds pass. Source-package verification
accepts 742 files and 57 install/build/application entries. Native formatting
accepts 396 files. Lint, declarations and four portable compiler naming
checks pass. The old runtime collector was stopped when the lifecycle patch
changed; its partial log cannot establish current runtime acceptance.

Next: execute remaining native encoding/caret/long-lookup contracts, complete
the current runtime collector, obtain Windows/Linux and physical IME evidence,
resolve six pinned original visual gates, refresh actual editor/package
delivery evidence and complete distinct independent whole-change review.
No task acceptance, staging, commit, push, tag or publication occurs here.

## X11 lookup, decoder and caret verification

Current prepared SFML X11 lookup retries the same native event after a
reported byte overflow. Its copied private header remains under
`sfml.js-interop/include/platform/x11`, with the patch and installer under
their existing subsystem directories. Four executable contracts pass using
the prepared production branch; the failing-before log records loss of a
151-byte commit. Short text uses the stack buffer until an actual overflow.

The actual X11 decoder/caret bodies execute against substituted Xlib data
declarations and real deferred queues/widgets on macOS. Nonterminated UTF-8,
wide text, locale restoration after invalid input, word grouping, clamped
positions and retired synchronous replies pass. The whole widget/Cocoa
fixture passes 60 contracts. These tests do not establish Linux ABI, actual
XIM engine callbacks or physical candidates. Display-line up/down and
previous/next movement remain open; current line-edge behavior covers only
a single display line.

The complete current `npm test` exits zero: 151 unique runtime files,
1,576 literal PASS markers, zero FAIL. Current Window protocol/registry/lookup
tests, 398-file native formatting, three portable naming units, source-package
inventory, actual editor host, VSIX inventory and four-language site checks
pass. The browser executes actual guide navigation and 168 checks across
56 guides at three widths, with zero failures or browser errors. No new full
API browser cohort is claimed.

[Current fingerprints and logs](../audit/6.3/platform-adapter-checkpoint.json)
retain all measured results and failures. The retained visual comparison
still exits one for four content contracts and two live contracts. Windows
and Linux execution, physical IME/candidates, display-line navigation,
the six original visual gates and distinct independent whole review remain
required. No scope flag, publication gate or final acceptance is promoted.

## X11 display-line layout continuation

Display-line caret queries now use a copied native layout in
`native/platform/ime/layout/text-layout.h`. The persistent dependency patch
exposes Unicode caret stops, display-line membership, physical horizontal
positions and a formatting revision. X11 sessions capture those fields only at
runtime entries; unchanged revisions reuse their snapshot. The SFML event pump
does not dereference a widget or call a font interface.

The initial `LineEnd` regression failed against the actual callback body.
The current real widget/Cocoa fixture passes 66 contracts, including twelve
actual XIM decoder/caret contracts. Display-line edges, next/previous-line,
proportional up/down, horizontal offset retention across short lines, rendered
soft-break affinity and Unicode preedit bounds execute against actual RmlUi
widgets. Existing native object inputs remain byte-identical through the run.
The fixture log is `/tmp/rmlui-63-completion/x11-lines-widget-final.log`.
Four portable naming units pass, whole native formatting passes 399 files,
the final fixture style checks pass, and the source package verifies 743 files
with 57 build/install/application entries. The dependency patch is idempotent
across its three installed source files.

Same-pump draw followed by a display-line move is still unsupported until the
new text has a runtime layout. The callback retains its copied caret and
captures an explicit layout-snapshot exception for the runtime boundary.
The real fixture verifies that this path does not fabricate a synchronous
position or apply the queued edit before surfacing the error. This is a
reported protocol gap, not accepted full XIM behavior.

The current full `npm test` exits zero: 151 runtime files, 1,582 literal PASS
markers and zero FAIL markers. The log is
`/tmp/rmlui-63-completion/x11-lines-package.log`. The adapter checkpoint records
41 matching source/dependency/binary fingerprints. Windows/Linux translation-unit
execution, actual IME candidates, six original visual gates and distinct
independent whole review remain required. No task-completion or publication flag
is promoted.

禁止使用 `using-git-worktrees`，禁止创建 worktree、临时 clone 或复制仓库，
禁止为构建或测试创建隔离环境；在现有工作目录保留无关改动继续执行。

## XIM feedback and Cocoa window-focus continuation

Feedback-only XIM draws now retain native layout, soft-break affinity and the
horizontal offset used for vertical movement. The real regression first returned
position 7 instead of 8 across a shorter line. Cocoa key-window recovery queues
the original native input-context activation at runtime; retiring the session
before drain discards it. Its valid regression first observed zero activations.
The separate CLI `currentInputContext` diagnostic is not an acceptance oracle.

The current complete package run exits zero: 151 runtime files, 1,586 literal
PASS markers and zero FAIL. The widget/Cocoa fixture passes 70 contracts and
preserves all existing native object hashes. Six compiler naming units,
399-file formatting, final fixture style and the 743-file source package pass.
The current adapter checkpoint records 44 matching source/dependency/binary
fingerprints. Logs use `/tmp/rmlui-63-completion/ime-feedback-focus-*`.

The desktop inventory finds enabled Sogou Pinyin while retaining ABC. No input
method action or usable screenshot is recorded. The temporary restoration parent
has compiled only. Same-pump XIM replacement/layout, physical and target-platform
execution, six original visual disagreements and independent whole review remain
open. All five publication gates still reject acceptance.

## Native test directories and bounded desktop attempt

IME native fixtures now live under
`test/native/platform/ime/{common,layout,macos,windows,x11}`.
General Cocoa probes and clipboard restoration use
`test/native/platform/macos`. Build entry points, native includes and
JavaScript runners use these paths. The current fixture passes 70 contracts,
the Windows lineage runner passes three, and the Cocoa probe build succeeds.
All thirteen fixture style checks, six compiler naming units, 399-file native
formatting and the 743-file source package pass. Current adapter evidence has
56 matching source/dependency/binary fingerprints.

No-change move hunks caused the file-editing tool to remove ten sources without
writing their destinations. Original task evidence and patch replay restored
those files; recorded source fingerprints match. Current native fixture and
builder execution verifies the restored directories. The interrupted complete
run and the initial missing-file log are failures, not acceptance results.
A fresh complete package run exits zero: 151 unique runtime files, 1,586 literal
PASS markers and zero FAIL. Its native/TS builds, package lint, native lint and
consumer types pass. The log is
`/tmp/rmlui-63-completion/ime-structure-package-restored.log`.

[The bounded desktop attempt](../audit/6.3/desktop-ime-attempt.json) selects
Sogou Pinyin and verifies restoration to ABC using an independent identical
inventory. Native foreground/key-window focus remains unavailable, and the
process foreground request returns -13066. An application-bundle launch
reports the same limitation. The initial English callbacks cannot establish
Chinese engine behavior. Physical input and candidates remain unaccepted.

The XIM scheduling investigation must preserve native event order, filter
results, source ownership, shared-window focus and XIC retirement. Moving only
KeyPress filtering would leave ClientMessage-driven preedit callbacks in the
SFML pump and reorder native input. No runtime replay implementation is accepted
at this checkpoint. Same-pump layout, target-platform execution, six original
visual disagreements and distinct independent whole review remain open.

禁止使用 `using-git-worktrees`，禁止创建 worktree、临时 clone 或复制仓库，
禁止为构建或测试创建隔离环境；在现有工作目录保留无关改动继续执行。

## Real Xlib declarations and deferred native queue

Four X11 production units now pass syntax checks with the installed Xlib 1.8.13
SDK and host Node/C++ headers. The failing regression records Xlib `True`,
`False` and `Status` macros corrupting V8/NAN declarations. The X11 boundary
cleans those macros. The current widget/Cocoa fixture passes 70 contracts using
real Xlib declarations and production state, including fourteen decoder/caret
contracts. No XIC or input method engine is created by this fixture.

The current complete `npm test` exits zero: 152 unique runtime files,
1,590 literal PASS markers and zero FAIL. Its lint, native/TS builds and consumer
types pass. Native formatting covers 401 files; six current X11/queue compiler
naming units and the 743-file source-package inventory pass. Current adapter
evidence retains 63 matching source/dependency/binary fingerprints. Logs use
`/tmp/rmlui-63-completion/x11-real-*`.

The private native queue in
`sfml.js-interop/include/platform/x11/event-queue.h` passes five portable
ordering, nested-polling, retirement, destruction and exception contracts.
Address/undefined-behavior sanitizers pass the same cases. The queue is not
yet connected to SFML or RmlUi; same-pump XIM layout remains unsupported.

The complete interop runtime suite passes eleven tests. Seven initial SDK
archive tests failed while loading a native builder absent from their archive
fixture. `ensureSdk()` now exposes the same real archive operation used by the
CLI, which still builds the native extension afterward. The tests execute that
operation without substituting a builder. Actual CLI bootstrap separately
reuses the existing SDK and native build marker. The failure and corrected
logs remain retained.

Next: connect deferred interpretation to runtime event delivery while preserving
the original key-repeat filtering and full native event order. The SFML close
path must retire its implementation through the active queue stack; pending
entries must retain the correct client across replacement and XIC destruction.
Only guarded runtime interpretation may format the current widget for a
synchronous XIM line reply. Keep `waitEvent()` behavior, event-source ownership,
shared-window focus and callback exceptions covered by executable regressions.
Then continue target-platform/physical evidence, the six retained pinned visual
contracts and distinct independent whole review. Whole acceptance stays false.

禁止使用 `using-git-worktrees`，禁止创建 worktree、临时 clone 或复制仓库，
禁止为构建或测试创建隔离环境；在现有工作目录保留无关改动继续执行。

## Private SFML queue integration

The shared native queue now lives in `sfml.js-interop/include/platform`.
X11 collection records each delivery after the original repeat filtering.
Runtime polling interprets it in delivery order; generated SFML events stay
ahead of later raw input. Weak input-generation tokens prevent old deliveries
from entering a replaced XIC. The original WM protocol branch remains available
when input generation expires. Native configuration refuses XIC replacement
while its current interpreter is on-stack.

`WindowBase` retains its implementation through active private polling without
changing the public unique-pointer layout. Closing immediately retires input
registration and discards pending entries. The retained callback owner survives
the derived destructor and `XDestroyIC`. The wait loop interprets callback-only
deliveries before deciding whether to collect more input; nested polling on the
active window returns without repopulating its queue.

Seven queue/generation contracts and five tests executing the exact prepared
SFML collection, deferral, polling and retirement bodies pass. The external
X server and native fixture host are substituted. All twelve contracts pass
address and undefined-behavior sanitizers. Five prepared lookup contracts pass,
including rejection of lookup against a replacement XIC. The complete prepared
`WindowImplX11.cpp` passes syntax checks against real Xlib and Xorg extension
headers with the host compiler/libc. This is not Linux linking or engine evidence.

The existing macOS Window dependency rebuild and complete interop suite pass.
The final formatting rebuild preserves the Window binary bytes. Current
`npm test` exits zero with 152 unique runtime files, 1,590 literal PASS markers
and zero FAIL. The RmlUi binary retains its preceding bytes. Native formatting
passes 402 files; the source package verifies 743 files and 57 entries.
The interop archive verifies 30 entries and exact current queue/protocol/
installer bytes. [Current evidence](../audit/6.3/platform-adapter-checkpoint.json)
has 67 matching source/dependency/binary fingerprints. Logs use
`/tmp/rmlui-63-completion/x11-queue-*`.

Guarded RmlUi interpretation remains open: native XIM callbacks still queue
widget work and same-delivery text replacement cannot yet force a fresh layout
for a synchronous line reply. Next implement the runtime bridge with callback
exception and active-element lifetime guards, then verify actual same-delivery
preedit/line movement. Continue platform/physical evidence, the six original
visual gates and distinct independent whole review. All five publication gates
remain unaccepted.

禁止使用 `using-git-worktrees`，禁止创建 worktree、临时 clone 或复制仓库，
禁止为构建或测试创建隔离环境；在现有工作目录保留无关改动继续执行。

## Guarded runtime and current XIM layout

The private X11 interpreter now enters the owning RmlUi runtime before the
native handler. Rejected entry retains its original raw delivery; `waitEvent`
returns immediately rather than spinning. An interrupted delivery stops
interpretation and preserves generated output before later raw input.
Callback and runtime-exit destruction errors retain their original JS identity.

Preedit callbacks drain edits synchronously inside that permitted interpreter.
The drain protects every encountered widget through font/event callbacks.
The widget's native `OnLayout` path refreshes dirty text before capturing
display-line stops. The same-delivery Draw/line-movement regression now replies
with code-point 4 without Update, Render or a separate scheduled drain.
Retired input generations suppress XIC focus calls as well as filtering/lookup.

Six live-addon runtime/font/lifetime contracts and 71 real-widget/Cocoa
contracts pass. Nine queue contracts and six exact prepared SFML delivery
contracts pass address and undefined-behavior sanitizers; six actual lookup/
focus guards pass with external Xlib calls substituted. Complete prepared
X11 and four adapter units pass real-Xorg/Xlib syntax checks on macOS.
This does not establish Linux ABI, linking, XIC or engine execution.

The completed `npm test` verifies 153 runtime files, 1,597 PASS markers and
zero FAIL, including lint, native/TS builds and consumer types. The final
Window rebuild preserves the macOS bytes used by that run. Three core Window
suites pass 35 contracts; the complete interop suite passes all twelve tests.
Formatting passes 404 maintained files and the changed fixtures; ten compiler
naming units and current patch idempotence pass.

The shipped source inventory verifies 745 files and 57 entries. Five current
queue/protocol/patch/installer entries match their exact bytes in the 30-entry
interop archive. [Current evidence](../audit/6.3/platform-adapter-checkpoint.json)
retains 72 matching source/dependency/binary fingerprints. Logs use
`/tmp/rmlui-63-completion/x11-runtime-*`.

Next: investigate the six retained original visual assertions, obtain available
target-platform and physical IME evidence, and complete distinct whole-change
review and delivery acceptance. All five publication gates remain rejected.
No staging, commit, push, tag or publication is performed at this checkpoint.

禁止使用 `using-git-worktrees`，禁止创建 worktree、临时 clone 或复制仓库，
禁止为构建或测试创建隔离环境；在现有工作目录保留无关改动继续执行。

## Original visual contracts and capture diagnosis

[The six-page diagnosis](../audit/6.3/visual-failure-diagnosis.md) traces the
retained original assertions through the unchanged Core and capture paths.
Fresh SFML and independent GL3 captures produce 38 byte-exact frame pairs with
zero warnings/errors. Four content assertions and two interaction assertions
still fail in both drivers. The complete retained 113-page corpus revalidation
reports 109 positive passes, four positive failures and no reference mismatch;
the retained interaction cohort reports 23 passes and two failures.

The original metadata reader truncated attribute values containing the other
quote delimiter. It now preserves matching quoted values; three literal
unchanged-page regressions and focused lint pass. Original page hashes,
fixtures, pixel thresholds and failed capture images are retained.

The text-overflow failure is sensitive to lazy font-atlas generation. A
temporary single premeasurement of the ellipsis reduces fresh repeat-frame
differences from 278 to zero and passes the unchanged interaction validator.
That experiment is not acceptance evidence and does not change production
rendering or the original capture sequence.

Fresh compiler-memory contract checks resolve all 963 public callable
signatures and reject all 963 corresponding invalid usages with zero baseline
diagnostics. Ten internal signatures retain native construction calls.
The source package still verifies 745 shipped files and 57 install/build/
application entries. All five publication gates remain rejected.

The complete package verification exited zero. The user explicitly selected
deferring proven upstream defects: 「如果是它自身问题，就先不用管了。
它自己都有问题过不了，你还能怎么办？它能过的，你为什么过不了」。
The production Core scope boundary is now pinned-upstream parity. Original
failure records remain failures; only the six diagnosed page/scope/source-hash/
assertion-stack combinations may receive a separate binding deferral, with
all reference frames still required to match. Upstream-pass/SFML-fail,
missing native proof and pixel/layout regressions remain blockers.

Next: verify the parity gates, continue the distinct whole-change review, and
obtain genuinely available target-platform and physical IME evidence.
Whole acceptance remains false.

禁止使用 `using-git-worktrees`，禁止创建 worktree、临时 clone 或复制仓库，
禁止为构建或测试创建隔离环境；在现有工作目录保留无关改动继续执行。

## Authorized upstream parity and current integration review

The unchanged 113-page corpus passes measured binding acceptance: 109 original
content passes, four diagnosed upstream failures deferred, 163 reference frames
and zero binding regressions. The 25-page input cohort retains 23 original
passes and two diagnosed upstream failures; all 165 input frames are byte-exact.
Original errors, failed statuses and counts remain present.

The distinct source/integration review checked renderer session rollback, layer
ownership and recycling, mask/filter order, shader failure/4×4 transform routes,
runtime ownership and guarded input, application adapters, build helpers and
publication evidence. It reproduced and corrected the aggregate comparator's
trust in attached input acceptance flags. Removing a real GL3 input outcome
now rejects the corpus CLI even if the report retains a passing summary.
Four Python parity tests and 22 publication evidence mutations pass.

The completed `npm test` command exits zero: lint, cpplint, same-tree Native and
TypeScript builds, consumer checks and all 154 runtime suites, with 1,600 PASS
markers and zero FAIL. Source-package verification reports 745 files and 57
install/build/application entries. The updated workflow passes actionlint.
All 72 current platform, ten diagnosed upstream and sixteen delivery-source
fingerprints match.

This controller review does not assert independent reviewer acceptance.
Publication still rejects Core scope/independent review, physical/cross-platform
IME and whole delivery acceptance. Linux/Windows target ABI, linking and native
execution, actual composition/candidates and independent whole-change
acceptance remain unverified. The earlier foreground attempt's `-13066` result
is retained; no repeated foreground probe, isolated environment, staging,
commit, push or publication was performed.
