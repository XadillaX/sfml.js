# Native font interface and field contracts

> The existing Native font interface and shared field adapters pass local
> acceptance. [29 exact declaration routes](font-declaration-map.json) and
> [current evidence](font-native-evidence.json) preserve the verification scope.
> Whole RmlUi acceptance remains open.

## Declaration scope

The original inventory contains 15 FontEngineInterface declarations, nine
FontMetrics declarations and five TextShapingContext declarations. These 29
records include type and lifecycle support; they are not 29 runtime scenarios.
Provider lifecycle, loading, opaque face/effect handles, geometry generation,
version and release use the existing Native implementation and custom-provider
consumers.

| Original field | Managed representation | Storage and behavior |
| --- | --- | --- |
| `FontMetrics::size` | `FontMetrics.size` | Read-only signed int32 snapshot |
| `ascent`, `descent` | Named getters and `values[0..1]` | Independent shared float32 fields |
| `line_spacing`, `x_height` | `lineSpacing`, `xHeight`, `values[2..3]` | Independent shared float32 fields |
| `underline_position`, `underline_thickness` | Named getters and `values[4..5]` | Independent shared float32 fields |
| `has_ellipsis` | `hasEllipsis` | Read-only bool8 snapshot |
| `TextShapingContext::language` | `language` | Native-owned immutable string replaced through checked Native methods |
| `text_direction`, `font_kerning` | `textDirection`, `fontKerning`, `enums[0..1]` | Writable shared int32 fields |
| `letter_spacing` | `letterSpacing`, `values[0]` | Writable shared float32 field validated at the provider boundary |

Editing a FontMetrics snapshot does not alter the engine's cached metrics.
Retained views own their numerical storage after facade collection and runtime
shutdown. Shaping defaults are empty language, Auto direction, Auto kerning
and zero spacing.

Native provider calls copy the language owner and numerical fields before
entering the provider. Custom callbacks receive a frozen scalar snapshot.
Changing language, direction, kerning or spacing during the first row cannot
alter later rows of the active batch. The original language allocation remains
alive until the Native call finishes.

Creation and language access use the shared RuntimeScope with
`allow_callback=true` and `require_initialized=false`. Contexts support setup
and reuse after shutdown but retain the runtime owner environment restrictions.
Numerical getters and setters access shared storage directly.

## Observed verification

Seven permanent field scenarios pass. They exercise all eight metrics fields,
independent snapshots, all enum values, Unicode language replacement and runtime
restart, active-batch snapshots, packed measurement and generation snapshots,
invalid shared writes before any callback, and views after observed facade
collection and engine shutdown.

The numerical access scenario performs 100,000 rounds of metric and shaping
field reads/writes. It observes zero Native entries, zero host callbacks and
zero element-ownership visits. This is a bridge contract, not a complete-frame,
allocation or GPU measurement.

The actual upstream FreeType engine passes three Native groups. A Native
reference captures all metrics at font sizes 20 and 31 and 27 combinations of
direction, kerning and spacing per size. The managed scalar, array and reusable
shared-buffer paths match all 54 original widths; four comparison groups pass.
The runner links only vendor objects named by the active makefile, preserving
the existing build and avoiding stale component objects.

Native naming and format checks pass for the font ownership source and
reference fixture. TypeScript consumers pass for all fields, shared views,
enum namespaces, private snapshot construction and read-only size. All four
localized API contracts and guide routing pass, with 15 checks and zero failures.

The complete `npm test` exits zero with 118 runtime files, 1,173 PASS and zero
FAIL, Native compiler warnings or Native compiler errors. The four font suites
contain 43 scenarios. An actual package archive contains 612 entries and
1,568,685 bytes; 24 current Native/source/dist members match their workspace
bytes. The archive was not installed into an isolated environment or used as
the runtime source.

## Behavior limits and remaining scope

Default FreeType applies pair kerning except in None mode and truncates spacing
to an integer for every glyph. It does not perform complex-script shaping.
Forwarding language and direction to the provider does not establish HarfBuzz
or bitmap-engine integration.

The Native production changes in this continuation add logical blank lines.
No replacement field adapter or new provider semantics were necessary. Earlier
font engine performance records retain their original evidence scope.

Complete initialization-cost, CPU-frame, GPU, platform IME, remaining Core
groups, optional modules, applications, VisualTests, editor/browser, package
runtime and CI acceptance remain open. No independent source-review or
whole-integration completion is claimed.
