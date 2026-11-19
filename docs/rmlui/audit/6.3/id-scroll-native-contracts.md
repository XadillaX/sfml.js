# Local property IDs and scroll contracts

> Local ID exports and existing scroll adapters have direct Native contract
> coverage. The [declaration map](id-scroll-declaration-map.json) records 45
> original declarations. [Fingerprint evidence](id-scroll-native-evidence.json)
> preserves the tested scope. Whole RmlUi acceptance remains open.

## Declaration scope

The original `Core/ID.h` inventory contains 17 MediaQueryId records and nine
FontFaceId records, including the two enum declarations. The generated public
exports contain all 16 media constants and eight font constants. These values
belong to local specifications, separate from PropertyId and ShorthandId.
TypeScript rejects assignments between the enum types.

The original `Core/ScrollTypes.h` inventory contains 19 declarations: three
enums, ten constants, one options type, its constructor and four fields.
The managed options interface supplies optional fields to the actual Native
constructor. Empty options and omitted arguments preserve Start vertically,
Nearest horizontally, Instant behavior and All ancestor containers.

```js
element.scrollIntoView({
  vertical: ScrollAlignment.End,
  horizontal: ScrollAlignment.Adaptive,
  behavior: ScrollBehavior.Instant,
  parentage: ScrollParentage.All,
});
```

## Native and managed consumers

The standalone fixture links the existing vendor objects listed by the active
makefile. It parses all 14 media properties into their actual local IDs and
checks three font-loading calls: a default declaration and two ordered sources
with explicit family, style, weight, fallback and collection index.

The Native fixture checks the options constructor and each alignment on both
axes. Its fixed clock advances smooth scrolling without waiting for wall time,
then verifies Auto uses the context configuration. A comparison runner reads
all five enum objects from Native, compares every public member, and compares
all ten measured scroll offsets with the addon. Empty options and the omitted
boolean overload match explicit Native defaults.

The standalone renderer supplies only basic Core setup; it does not measure
GPU rendering. The patched Core destructor requires two binding-only Lua
hooks. This fixture provides a no-model cleanup hook and a rejecting model
invalidation hook; it never creates data models or tests Lua. Production addon
tests exercise the full binding rather than these fixture boundaries.

The managed specification suite checks all media conditions at their inclusive
boundaries, then changes dimensions, density and theme and checks the resulting
matches. Resolution uses `2x`, the actual RmlUi unit. The font suite preserves
default fields and source order through the selected Native font provider.
The constant access loop observes zero Native entries and zero callbacks over
100,000 iterations.

The expanded layout suite checks all five alignments on both axes, repeat
Nearest/Adaptive behavior, default and boolean overloads, nested All/Closest
containers, Smooth/Auto, invalid fields, callback exceptions and receiver
invalidation during accessor conversion. Type consumers exercise all four
option fields and reject invalid behavior and parentage values.

## Evidence boundaries

The complete `npm test` exits zero with 119 runtime files, 1,177 PASS and zero
FAIL, Native compiler warnings or Native compiler errors. The three direct
Native groups and three Native/addon comparison groups pass. Naming, format,
fixture style, TypeScript consumers, four localized API contracts, navigation
and guide/media route checks pass.

The actual package archive has 618 entries and 1,573,175 bytes. Twenty selected
generator, source, Native and emitted JS/type members match current workspace
bytes. No isolated install was created, and runtime execution used the current
workspace rather than the archive.

The JSON evidence records each completed check, exact source fingerprint,
runtime scenario census, Native reference and matched archive member. Generated
enum access is a bridge contract. It does not provide initialization-cost,
whole-frame, allocation or GPU measurements.

Other accepted declaration maps retain their original contents and checkpoint
fingerprints. Reconciliation now uses sixteen maps: 3,703 represented original
declarations and 223 unmatched declarations. Representation includes pending
statuses from earlier maps and is not a passing-test count.
