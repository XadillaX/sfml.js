# Core event dispatcher and background component acceptance

> Two exact Element accessor keys have local macOS arm64 acceptance.
> ElementStyle, full Core nineteen-group acceptance and Tasks 5–10 remain open.

## Exact representations

| Original inventory declaration | Consumer representation |
| --- | --- |
| `Core/Element.h:566` `GetEventDispatcher() const` | Canonical checked EventDispatcher owned by the native element. |
| `Core/Element.h:570` `GetElementBackgroundBorder() const` | Canonical checked ElementBackgroundBorder owned by the native element. |

The dependent objects expose actual upstream operations:

| Native declaration | Representation and verified behavior |
| --- | --- |
| `EventDispatcher::AttachEvent(EventId, EventListener*, bool)` | `attachEvent(idOrName, listener, capture = false)` reuses Element's indexed function and typed listener registrations, with native deduplication. |
| `EventDispatcher::DetachEvent(EventId, EventListener*, bool)` | `detachEvent(...)` matches id, listener and capture; unmatched removal is a no-op. Registrations are interchangeable with Element's listener methods. |
| `EventDispatcher::DetachAllEvents()` | Recurses through all children, including non-DOM scrollbars and native widget listeners; active callbacks retain their own lease. Typed notifications run after native unwinding. |
| `EventDispatcher::DispatchEvent(Element*, EventId, const String&, const Dictionary&, bool, bool, DefaultActionPhase)` | Static `dispatchEvent` requires all arguments and retains explicit id/name/flags, exact default-action phases and typed parameter conversion. |
| `EventDispatcher::ToString() const` | `toString()` copies native event-name/count summaries. |
| `ElementBackgroundBorder::Render(Element*)` | Component `render()` uses its checked owner, computed values, layout and current SFML manager state. |
| `ElementBackgroundBorder::DirtyBackground()` | `dirtyBackground()` marks native geometry for regeneration. |
| `ElementBackgroundBorder::DirtyBorder()` | `dirtyBorder()` marks native border geometry for regeneration. |
| `ElementBackgroundBorder::GetClipGeometry(Element*, BoxArea)` | `getClipGeometry(area)` snapshots Border/Padding/Content geometry through existing native resource ownership; Margin and Auto reject. |

Component construction is owned by Element. These borrowed views do not claim
independent upstream constructor representations or full forward-class coverage.
The Core ledger retains 549 unique records: 420 locally verified, 18 partial,
111 pending, and `scope_complete: false`.

## Events and lifetime

Ten dispatcher groups pass, including shared registration identity, capture
separation, non-DOM recursive removal, self-removal during active dispatch,
delayed notification exceptions, explicit default phases, separate id/name,
typed BigInt and element parameters, nested registration, hostile parameter
getters, function/payload GC, detached owner retention and generation checks.

The static upstream default-action ancestor loop is independent of bubbles.
The tabset test verifies ancestor default actions with bubbles false; the
checkbox test distinguishes None from Target. Saved propagation operations
retain their existing callback expiry rules. Name copies remain stable across
nested event registration.

A missing function check in the shared JS adapter was found by the invalid
listener test. `eventCallback` now rejects non-functions before registration.
Existing listener, typed-listener, event and registration suites pass.

## Rendering and snapshots

Background and border rendering uses SFML. A component cannot render into
another manager's active layer or mutate geometry during an effect callback.
Detached elements without a manager retain upstream no-op rendering and return
empty invalid geometry snapshots.

Pixel checks prove red backgrounds, green borders, resized blue backgrounds,
magenta borders and rounded white clipping on a black surface. Border, padding
and content snapshots retain their exact native mesh extents. Old rectangular
snapshots remain rectangular after rounded native regeneration; releasing or
editing one snapshot cannot change another or the component.

Snapshots are independent of component and element lifetime, but retain manager
resource affinity and invalidation. Copied Mesh storage survives manager
release and shutdown. The established detached-element release guard remains
unchanged; its test reattaches the managerless node before document destruction.

## Validation evidence

`npm test` exits zero with 81 unique runtime suite files, 743 literal PASS lines
and zero FAIL lines. That run contains all ten dispatcher groups and the first
six background groups. The subsequently added rounded clip case passes in its
own bounded child command and the complete seven-group background recheck;
it is not included in the 743 count. Consumer types,
lint, cpplint and native/TypeScript builds pass. The final site run passes all
81 tests with zero failures or skips.

Native formatting passes all six changed source/header files. Compiler-backed
identifier naming passes the event, background, render-layer, geometry and addon
compilation units using the established LLVM/MacOSX15.4 SDK configuration.
Four-language TSDoc and guides describe registration, explicit flags, viewport
preparation, snapshots and lifetime.

Evidence is under `/tmp/rmlui-63-completion/`: `event-dispatcher-red.log`,
`event-dispatcher-green-final.log`, `event-dispatcher-{listeners,typed-listeners,events,registration}.log`,
`element-background-red.log`, `element-background-green-final.log`,
`element-background-rounded.log`, `core-dependent-components-package.log`,
`element-background-complete.log`,
`core-dependent-components-site-final.log`, `core-components-types-final.log`,
`core-components-format-final.log`, `element-background-naming.log`,
`core-components-{events,layers,geometry,addon}-naming.log` and
`core-dependent-components-source-review.md`.

All 27 task-owned source, test and documentation files have zero trailing
whitespace. The two promoted accessor records have no missing evidence paths.

The acceptance covers measured behavior and source contracts only. It does not
claim GPU timing, other platform execution or full-plan completion.
