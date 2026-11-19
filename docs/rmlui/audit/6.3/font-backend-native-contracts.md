# Native font backends and runtime capabilities

This is a local macOS arm64 checkpoint for FreeType, HarfBuzz and bitmap
engines. The [fingerprinted evidence](font-backend-native-evidence.json) records
the final sources, binary, logs and sequential configurations. Review was
performed by the implementer; it is not an independent module review or
whole-project acceptance.

## Implementation

`native/fonts/rmlui-font-backends.{h,cc}` constructs the selected provider
without initializing its process-wide font state. The existing engine owner,
runtime lock, active-selection and generation checks remain authoritative.
Core invokes provider initialization and shutdown. Construction of unused
engines does not initialize another FreeType provider.

HarfBuzz 15.1.0 is compiled from its pinned amalgamation. Eleven upstream
HarfBuzz engine helpers and two bitmap helpers are included without sample
`main.cpp`. FreeType is compiled once in the existing RmlUi target and shared
by the default and HarfBuzz providers. Optional OS shapers are not enabled.

The upstream HarfBuzz sample lacks the named-file loading virtual. A Native
adapter reads through the active file interface, closes its token with an
RAII lease, and retains bytes through provider shutdown. Short and empty reads
fail before registration; thrown callbacks retain their original error and
still invalidate the file token. Byte ownership also covers partially loaded
collections.

Direct built-in generation discovers cold glyphs in Native before building
their atlas. Core's regular layout and rendering stay in Native. Returned mesh
bytes own their snapshots. Font texture views check both the global font
generation and their face's atlas version before accessing an upstream index.
Atlas rebuilding invalidates earlier borrowed texture views.

The bitmap patch removes obsolete manual vector expansion before the
appending `MeshUtilities::GenerateQuad` helper. Runtime geometry now contains
one quad per character. The dependency patch is idempotent and ships with the
source package.

## Public contracts

`new FontEngineInterface()` remains FreeType. Passing `freetype`, `harfbuzz`
or `bitmap` selects a built-in engine; passing callbacks creates `custom`.
Selection occurs before initialization. `kind` is generation checked;
shutdown requires constructing a fresh engine before another selection.

`registerLanguage(language, script, direction)` forwards HarfBuzz's language
registration before initialization. It accepts an ASCII language tag,
four-letter ISO15924 script and explicit `ltr` or `rtl`. Runtime checks reject
other engines, invalid arguments and late registration. A positive Native
direction test proves registration affects Auto flow and that explicit
directions override it.

`getCapabilities()` distinguishes linked support from active runtime
availability. Module entry points require initialization; a font additionally
requires selection. Feature flags describe each compiled implementation, not
guaranteed support in a disabled or inactive engine. Snapshots are independent.

HarfBuzz shapes clusters and ligatures and honors language, direction, kerning
and integer spacing. Its upstream measurement ignores the prior character.
Bitmap supports file metadata, fixed single-page atlases, advances and kerning
including the prior character. It ignores shaping, spacing, kerning switches
and font effects. General memory loads fail. Its debugger-specific family
reports success without decoding the embedded font. Family and size selection
use the upstream permissive heuristic. These limits appear in capabilities,
TSDoc and all four font guides.

## Verification

- Eleven backend scenarios pass: compiled/active state, real Latin ligatures,
  Arabic joining, memory ownership, file overloads, short-read/close ownership,
  atlas retirement, kerning/spacing, registered direction, bitmap UV/advance/
  kerning comparisons and language validation.
- Native default versus HarfBuzz produces twelve versus four vertices for
  Lato `ffi`, and eight versus four vertices for Cairo lam-alef. Measured and
  generated advances agree. These are actual Native engine results.
- Forty-three existing default/custom/packed/field font scenarios and
  thirty-one geometry/resource/callback-texture scenarios pass after restoring
  the default binary.
- Four dependency checks pass, including missing dependency rejection and
  two actual font patch repeats with zero writes.
- Four configurations build and pass their configuration checks in sequence:
  HarfBuzz off, bitmap off, both off, both on. The final binary and compiler
  database are restored to both on. All reuse the existing build tree.
- Native formatting, cpplint, lint, consumer types, four-language source
  comments and four Native compilation-unit naming checks pass.
- Source package dry-run contains 640 files and 8,626,078 unpacked bytes,
  including the new adapter, declarations and installer patch. No archive,
  isolated install, publication or packaged runtime smoke test was performed.

Raw red and intermediate failures remain in the evidence record. The kerning
fixture uses Lato `To`, which has an actual nonzero pair adjustment; its `AV`
pair does not. Callback-error cleanup suppresses later JS hooks while still
closing the Native token. The first naming attempt used mismatched SDK headers;
the successful invocation uses LLVM 18 with matching standard, builtin and
SDK headers and the actual build flags.

The original 3,926-declaration inventory and previous declaration maps are
preserved. Existing reports retain their historical source fingerprints.
Linux/Windows runtime validation, GPU timing, official font applications,
complete Lua/Core/renderer/platform/editor/package acceptance and independent
module/whole-project review remain separate unfinished work.
