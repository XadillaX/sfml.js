# RmlUi 6.3 coverage audit and completion specification

**Baseline: incomplete.** This document records the full-integration acceptance
scope agreed with the user. It does not claim that implementation or acceptance
is complete. The reference is the package's pinned RmlUi 6.3 source, not the
upstream development branch.

## Evidence and inventory

| Record | Contents |
| --- | --- |
| [Public declarations](upstream-api.json) | Header fingerprints and 3,926 compiler declaration records |
| [Core review](core.md) | Runtime, contexts, documents, elements, events, forms, text, stylesheets, resource operations |
| [Core nineteen-criterion observations](core-19-acceptance.md) | Nineteen locally observed managed contracts, exact Native event comparison, one complete 131-file runtime run and bounded positive/negative consumers for all 963 public callable signatures; whole-scope and independent acceptance remain open |
| [Core exact operation provenance](core-operation-acceptance.json) | 549 Core and 1,547 dependent exact sites, deduplicated source/consumer/runtime references and unchanged historical input fingerprints; references do not imply independent or per-overload acceptance |
| [Native color filter observations](renderer-color-filter-acceptance.md) | Eight color filters, ordered premultiplied chains, resolved RCSS parameters and bounded macOS pixel checks; full renderer acceptance remains open |
| [Renderer review](renderer.md) | All 21 RenderInterface virtuals, effect protocols, system/file/font/text-input adapters |
| [Modules and samples](modules-and-samples.md) | Debugger, data models, scripting, nine Factory categories, optional libraries, all 20 sample applications |
| [Data scale measurements](data-performance.md) | Actual 1k/10k/100k bound rows, scoped native counters, ownership scan correction and raw samples |
| [Binding performance architecture](architecture-performance.md) | Whole-binding responsibility matrix, shared storage, callbacks, ownership, rendering, resource-loading gaps, and implementation acceptance |
| [Performance architecture results](architecture-performance-results.md) | Local macOS acceptance: 37 cases, 95 workloads, 7,600 timed CPU frames; shared/batched crossings, incremental ownership, geometry uploads/draws, preload contracts and persistent verification logs |
| [Managed Lua acceptance](core-lua-script-acceptance.md) | Native Lua 5.4.8 execution, checked callbacks/models/instancers/coroutines; 28 Lua scenarios and complete 102-file/988-PASS runtime verification |
| [Managed interpreter references](lua-interpreter-acceptance.md) | Compile without execution, captured functions, exact result counts and native file execution; thirteen local scenarios and all 55 declaration mappings |
| [Native Lua declaration consumers](lua-native-contracts.md) | Concrete native value/Element registration, descriptors, casts, metatable dispatch, GC and corrected integer/nil boundaries; [fingerprinted evidence](lua-native-evidence.json) supplements the unchanged 55-declaration map |
| [Core type source reconciliation](core-type-source-reconciliation.md) | Exact source mappings for 58 pending and nine partial type records; private forwards, concrete public definitions and remaining constructor/template obligations |
| [Scroll and iterator declarations](core-scroll-iterator-declaration-map.json) | All 28 exact dependent declarations; owned scrollbar lifecycle, batched iterator snapshots and all three native ownership transfers verified |
| [Native scrollbar construction](core-scroll-construction-acceptance.md) | Distinct owned native component, checked release, indexed destruction, deferred GC and host-root cleanup; eleven local lifecycle scenarios |
| [Input and event declarations](core-input-event-declaration-map.json) | Fingerprinted indexed mappings for all 188 Input and 37 EventId declarations, exact generated values and their existing runtime suites |
| [Full inventory cross-reference](full-inventory-reconciliation.json) | 3,926 original declarations represented in twenty maps, including partial and pending routes; representation is not a pass count |
| [Native script objects](script-object-acceptance.md) | Managed Context/Element/Event associations, native RTTI, incremental roots, GC and original release chains; 25 scenarios, 102 runtime files and 1,003 PASS |
| [ScriptInterface Variant lifetimes](core-variant-scriptinterfaces-acceptance.md) | Guarded Element/Context/Event storage, native pointer destinations, expiring event leases and collectible independent-context roots; complete package and four-language documentation verified |
| [Opaque Variant objects](core-variant-opaque-acceptance.md) | Managed void* identity, collectible owner edges, native defaults and drag-pointer separation; 13 focused scenarios, complete package and documentation verified |
| [Public type source acceptance](public-type-source-acceptance.md) | Generated readonly computed views, canonical byte colours and exact transform tuples; zero unresolved public type references in all four languages |
| [Core type runtime acceptance](core-type-runtime-acceptance.md) | 67 exact type sites, 29 consumer files and 318 passing scenarios; three native iterator ownership transfers and batched snapshot lifetimes verified |
| [Variant string consumers](variant-serialization-acceptance.md) | Direct and nested pointer serialization checks; 118 external scenarios, independent original probe, complete package and four-language documentation verification |
| [Converter and value templates](type-converter-template-acceptance.md) | 317 exact converter declarations, 152 direct native specializations, 26 consumer sites and 17 original ledger promotions; complete package and four-language documentation verification |
| [Supplemental type relationships](supplemental-type-acceptance.md) | Seven exact Factory/font/stylesheet/event/element sites, all 31 Factory operations and 20 existing suites with 198 PASS; no Supplemental partial records remain |
| [Native numeric support](numeric-native-contracts.md) | [459 exact numeric declarations](numeric-declaration-map.json), native runtime/compile contracts and six consuming suites; [historical fingerprinted evidence](numeric-native-evidence.json) retains its 1,099-PASS runtime and default-clipboard compiler warning |
| [Native strings, URL and clipboard](string-url-native-contracts.md) | [88 exact declaration routes](string-url-declaration-map.json), native owners, batched offsets, typed formatting and four-language guides; [fingerprinted checkpoint](string-url-native-evidence.json) verifies 112 runtime files, 1,125 PASS and zero emitted compiler warnings/errors, including real default clipboard Unicode |
| [Native support and application logging](support-native-contracts.md) | [157 exact declaration routes](support-declaration-map.json), native ownership/ABI/container contracts and checked scalar Log helpers; [historical checkpoint](support-native-evidence.json) verifies eight native groups, 113 runtime files and 1,131 PASS against its saved source fingerprints |
| [Native XML parser and handlers](xml-native-contracts.md) | [49 exact declaration routes](xml-declaration-map.json), native tokenization/DOM, scoped callbacks, header writeback and retained roots; [historical checkpoint](xml-native-evidence.json) verifies four native groups, 17 XML scenarios, 114 runtime files and 1,148 PASS |
| [Native geometry and convolution](utility-native-contracts.md) | [17 exact declaration routes](utility-declaration-map.json), shared Native kernels/bytes, ordered mesh batches and retained views; [fingerprinted checkpoint](utility-native-evidence.json) verifies four Native groups, five byte comparisons, 117 runtime files and 1,166 PASS |
| [Mesh resize storage](mesh-resize-acceptance.md) | Fresh destination-sized Native vectors, retained old views, seven lifetime/data scenarios and eighteen allocation workloads; [fingerprinted evidence](mesh-resize-evidence.json) retains the failing allocation bound and final measurements |
| [Native font interface and fields](font-native-contracts.md) | [29 exact declaration routes](font-declaration-map.json), Native provider lifecycle, independent metrics and shared shaping fields; [fingerprinted checkpoint](font-native-evidence.json) verifies three Native groups, 54 widths across three measurement paths, 118 runtime files and 1,173 PASS |
| [Native font backends and capabilities](font-backend-native-contracts.md) | Default/HarfBuzz/bitmap selection, truthful capabilities, Native shaping/atlas ownership and four sequential same-tree configurations; [fingerprinted checkpoint](font-backend-native-evidence.json) records eleven backend, 43 existing font and 31 resource scenarios; independent and cross-platform acceptance remain open |
| [Local property IDs and scrolling](id-scroll-native-contracts.md) | [45 exact declaration routes](id-scroll-declaration-map.json), all media/font IDs, actual Native defaults and dual-axis scroll results; [fingerprinted checkpoint](id-scroll-native-evidence.json) verifies three Native groups, three comparisons, 119 runtime files and 1,177 PASS |
| [Renderer and legacy compatibility contracts](renderer-native-contracts.md) | [58 exact declaration routes](renderer-declaration-map.json), Native default/adapter contracts and real SFML consumer paths; [current focused evidence](renderer-native-evidence.json) verifies six Native groups and 68 scenarios; full effects, base-layer/perspective and GPU timing remain open |
| [Stylesheet and shared Native types](stylesheet-types-native-contracts.md) | [135 exact declaration routes](stylesheet-types-declaration-map.json), Native ABI/hash/index contracts, keyframe snapshots and negated media-query correction; [focused evidence](stylesheet-types-native-evidence.json) verifies six Native groups and 101 consumer scenarios; forward and alias routes do not imply complete callable acceptance |
| [Native Debugger](debugger-native-contracts.md) | [Six exact declaration routes](debugger-declaration-map.json), separate/owned contexts, native logs/reflection and allocator lifetimes; [focused evidence](debugger-native-evidence.json) verifies 18 Debugger and 95 dependent consumer scenarios; SVG/Lottie/font and whole-project acceptance remain open |
| [Native macOS IME](native-ime-checkpoint.md) | [Desktop item closed by user acceptance](desktop-ime-acceptance.md); actual preedit/commit, cancellation, rollback, caret coordinates and repeat failures remain recorded; the native fixture passes 73 contracts; waived desktop checks and Linux/Windows execution remain unverified |
| [Original visual failure diagnosis](visual-failure-diagnosis.md) | Six retained failures traced through unchanged source and validators; 38 fresh byte-exact SFML/GL3 pairs and an isolated ellipsis premeasurement experiment; whole acceptance remains open |
| [Source package and editor delivery](source-package-editor-evidence.json) | Existing-tree install, shipped helper inventory, 149 runtime suites/1,550 PASS, five actual VS Code host contracts, verified VSIX and four-language browser checks; platform, visual and independent whole acceptance remain open |

The installed include tree contains 122 `.h`, nine `.inl`, two `.hpp`, and one
license file. Matching Xcode libclang parsed all 121 non-vendor `.h` entry points
with zero diagnostics. The excluded `.h` and two `.hpp` are bundled container
implementations. Inline definitions belong to their public headers. Lua headers
were parsed against official Lua 5.4.8 headers in the baseline inventory.
The current package also builds and executes its managed Lua runtime; see
the separate acceptance report above.

The compiler records include declarations, forwards, constructors, overloads,
templates, fields and enums. Their count is not a feature count or completion
percentage. Review tables name the application operations and their semantic
gaps. Every installed header belongs either to those tables or the supporting
facilities below.

The review reports retain their original baseline line references and findings.
Their reviewer-specific scope exclusions only divide review work. They are not
user-approved feature exclusions; the rulings in this document take precedence.

## Accepted outcome

Complete the application-facing RmlUi 6.3 integration and its native adapters:
safe runtime ownership, the Core application surface, full event behavior,
declarative data binding, document scripting, Debugger, supported custom
extensions, SVG, Lottie, HarfBuzz and bitmap-font engines, the 6.3 rendering
protocol, and equivalent official sample behavior.

Account for upstream Lua separately from Node document scripting. Both require
real execution evidence. Platform text input must include composition semantics,
not merely final Unicode text events. Build-only ABI/compiler knobs and
third-party container APIs are not new JavaScript libraries.

Complete each implemented capability with public types, four-language
documentation, examples where applicable, and behavioral acceptance. Mark a
platform result unverified until that platform actually runs the check.

The eventual authorized commit/push includes the VS Code extension. It remains
pending this acceptance. No npm, Marketplace, binary release, or tag publication
is authorized by this work.

The user's 2026-11-19 decision defers proven upstream defects. Visual binding
acceptance now uses [the diagnosed upstream-parity policy](visual-failure-diagnosis.md#authorized-acceptance-policy):
all upstream-passing contracts must pass in SFML; only the six reviewed
page/scope/source-hash/assertion-stack combinations may be deferred when both
drivers reproduce them and all reference frames still match. Original failures
remain recorded as failures. This decision does not waive physical IME,
target-platform execution or whole-change review.

## Global constraints

- 禁止使用 `using-git-worktrees`，禁止创建 worktree，禁止为构建或测试创建隔离环境，在现有工作目录完成任务。
- Work in `/Users/bytedance/Workspace/github/sfml.js`; preserve all existing
  changes and do not clone/copy the repository or move HEAD for testing.
- Render through SFML 3.1 APIs. No direct OpenGL calls. Existing RmlUi geometry
  stays native; custom computation uses native-owned buffers and handles.
- Native code owns lifetimes. Numeric views use the existing shared-memory
  interop pattern where appropriate. Preserve snapshot semantics.
- Preserve upstream sample resource structure, state transitions, frame behavior
  and controls; a static document preview is not an application port.
- Public TSDoc and guides use English, Chinese, Japanese and Korean. Source
  identifiers/comments/logs and example UI use English unless explicitly
  localized.
- Follow root formatting/naming/lint rules for owned native files, including
  `.mm`. Keep files focused rather than adding everything to one binding file.
- Reuse existing dependency/build directories; temporary scripts, reports and
  test outputs belong in `/tmp`. Do not install a new isolated test environment.
- No no-op return, declared method, compile success or limitation paragraph
  counts as functional completion.
- Do not commit/push while any agreed implementation or acceptance remains
  missing. Preserve specific evidence for every claimed result.

## Supporting headers and representation rulings

| Header family | Required treatment |
| --- | --- |
| `Config`, `Types`, `Header`, `Platform`, `Traits` | Preserve native ABI. Use typed checked handles and values. Runtime casts must produce the correct document/control/text wrapper. Build macros and RTTI templates have no separate JS object. |
| `ObserverPtr`, releasers, `UniqueRenderResource` | Implement safe native ownership and destruction detection. C++ pointer syntax maps to checked handles; no stale raw pointer dereferences. |
| Vectors, matrices, colors, rectangles, vertices | Provide typed values/shared views at consuming APIs; retain all matrix components and color/alpha conventions. |
| `Span`, `StableVector`, `Dictionary`, container aliases | Arrays, records and typed arrays over retained native storage; no dangling iterator or buffer views. |
| `Variant`, `TypeConverter`, `NumericValue`, `Unit` | Explicit typed conversion, exact 64-bit values where present, and meaningful errors for unsupported values. |
| `Box`, `RenderBox`, `ComputedValues`, `ScrollTypes` | Expose layout, box edges, computed properties and scroll information through typed inspection APIs. |
| Property classes, dictionaries, iterators, specifications, IDs, styles | Property parsing, registration, inspection and enum values used by custom styles must work; map C++ iteration to snapshots or views. |
| Transform primitives, tween, animation | Typed animation/transform operations and event completion. C++ operators map to named JS operations where needed. |
| `URL`, `StringUtilities` | Preserve RmlUi resource-URL and RML escaping rules; implement character/byte offset conversions needed by text APIs. Generic JS substitutes require matching semantics. |
| `Math` | Numeric utilities may use JS computation where equivalent; RmlUi-specific rounding, pixel-grid and interpolation semantics must remain testable. |
| Mesh, geometry, texture, callbacks, render manager, convolution | Native-owned handles/leases for custom drawing, font and decorator operations. Do not transport built-in per-frame geometry through JS. |
| Streams and files | Owned byte sources and callback adapters with seek/read/error contracts, source URLs and retention. |
| XML parser and node-handler classes | Native parser integration and registered callback adapters; browser parsers are not substitutes. |
| `Debug`, `Log`, `Profiling` | Application logging is exposed; assertions and Tracy are build/support facilities. They are distinct from the visual Debugger. |
| `RenderInterfaceCompatibility` | Legacy RmlUi ≤5 native support; never use it as the 6.3 renderer or count it as advanced rendering coverage. |
| `.inl` and bundled container sources | Native implementation support for the corresponding public header; accounted for without inventing JS template APIs. |

## Findings that determine implementation order

1. Listener removal ignores element and capture identity. Destroyed callbacks can
   leave live dispatcher registrations. Callbacks also survive document teardown.
2. Context/document/element handles do not detect destruction or reinitialization.
   The worker-enabled module shares a global runtime without owner checks.
3. Event snapshots lose target/current-target identity, phase, interruption and
   typed parameters. SFML input forwarding loses modifiers and some keys.
4. Core DOM construction, typed controls, animations, stylesheets, resource
   operations and custom integration APIs are largely absent.
5. Debugger, Node document scripts, Lua, data models, extension adapters, SVG,
   Lottie and alternative font engines are not integrated.
6. The renderer has all virtual method names but rejects gradient protocol,
   eight built-in filters, ignores masks, rejects base-layer reads and discards
   perspective. Layer/resource error paths and strict aliasing also need repair.
7. Clipboard conversion uses locale/ANSI paths instead of explicit UTF-8.
8. Only four of 20 upstream sample applications have launcher entries, with
   partial behavior. The 113 VisualTests pages are previews without assertions.

## Build, package and CI acceptance

The three existing runtime files pass locally, including 1×/2× density checks.
They cover a small baseline only. `test:types` has no dedicated consumer fixture.

`npm pack --dry-run --ignore-scripts` for RmlUi contains a generated dependency
fragment but no native addon or install script; the advertised native build uses
an unshipped repository-root helper. No clean-machine installation has been
verified. The editor package has no README in its package inventory.

Required work includes a reproducible dependency manifest, working package-local
install/build path, explicit packaged-file inventory and supported runtime
libraries, editor package documentation/VSIX verification, and RmlUi/editor CI
gates. The existing Linux/macOS/Windows and publish workflows test only core and
ImGui explicitly. Add the missing gates; do not call configured jobs passed.

Verify packages using the current workspace and staged inventories, without
creating isolated installations. Use existing CI runners for actual platform
results only when reached through the authorized integration workflow; pending
platform evidence remains visible.

## Acceptance record

For every capability record: upstream contract, JS/native implementation,
positive and negative tests, platform, actual result and remaining limitation.
Use independent pixel oracles for effects; two equally blank screenshots are not
success. Exercise sample controls and state changes. Prove optional-library
execution, not just file presence.

Track all 20 sample applications separately from the 113 VisualTests. Track
build-only options and native extension boundaries explicitly. A behavior may be
re-expressed idiomatically in JavaScript, but may not disappear from the ledger.

The [implementation plan](../../plans/2026-11-14-rmlui-63-completion.md) consumes
this audit. Its execution ledger stays in `/tmp/rmlui-63-completion/` until final
acceptance evidence is ready for the repository.
