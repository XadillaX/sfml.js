# Converter and value-template acceptance

> Local macOS arm64 verification covers all 317 original TypeConverter
> declaration records and 26 exact value-template consumer records.
> Native execution covers 152 concrete converter specializations.
> This does not complete Core's nineteen acceptance groups or the full plan.

The [declaration map](type-converter-declaration-map.json) preserves the
original inventory index and full declaration key for every record. The
[execution evidence](type-converter-template-evidence.json) fingerprints the
actual source files, native runner, compiler checks and complete verification
logs. The original 3,926-record inventory remains unchanged.

## Native converter contracts

The 317 compiler records contain 152 concrete specialization classes, their
152 methods, one ScriptInterface forward declaration, four generic method
records, three class templates, two helper function templates, two pointer
typedefs and one Unit forward declaration. Declarations and inline definitions
remain distinct records.

The scalar probe directly executes all nine-by-nine numeric pairs. It
preserves exact platform `long` types, floating-point fractions, truncation and
zero/nonzero boolean conversion. Character, vector, colour, string and allocated
pointer copies are tested separately. These 96 specializations do not normalize
through Variant storage.

The string and complex probes execute the remaining 56 specializations:
integer width boundaries and decimal prefixes, `atof`, bool parsing, vector
components, byte-colour parsing, native-only pointer formatting, Unit suffixes,
transforms, transitions, animations, declaration effects, colour stops and
shadows. Shared-pointer identity and independent value copies are verified
separately. Complex string conversion tests both append and replacement behavior.

Conversion failure does not always preserve the entire destination. Integer
vectors retain converted prefix components. An empty byte-colour string leaves
the destination untouched; nonempty invalid colour text resets it to opaque
black before returning false. Float components convert nonnumeric text to zero
and report success. Variant and Property preserve these native results.

The generic non-string converter reports false and preserves its destination.
The unsupported string converter fails at compile time. A supported compiler
control succeeds; actual unsupported Payload and Character instantiations each
produce the upstream static assertion. The original parser did not emit that
partial specialization at `TypeConverter.inl:416–429`, so its compiler evidence
is recorded separately without inventing an original declaration.

Native `ToString` and `FromString` instantiate their existing C++ templates.
JS selects conversion through typed values and defaults at consuming APIs.
Native pointer formatting remains unchanged; public JS string consumers retain
their verified direct and nested pointer rejection.

## Exact consuming declarations

The native consumer fixture runs inside the actual loaded binding, using its
existing runtime and Lua lifecycle symbols. It executes all 26 Variant storage
kinds, exact reference reads, lvalue/rvalue construction, assignment, native
Property construction and conversion, Element attribute dictionaries, const and
mutable raw attribute reads, property templates and Event parameter templates.
No lifecycle stub replaces a product implementation.

| Original declaration sites | Native assertion | JS representation |
| --- | --- | --- |
| `Element.h:199`, `Element.inl:4` | `CheckElementAndEventTemplates` | Property conversion uses `T{}`; raw Property reads produce owned snapshots |
| `Element.h:287`, `Element.inl:16` | Actual native `SetAttribute<T>` | Checked Variant copies with retained pointer and callback owners |
| `Element.h:291,293` | Const/mutable pointer identity and actual mutable write | `getAttributeValue` returns a snapshot; `setAttribute` performs writes |
| `Element.h:298`, `Element.inl:26` | Native default, enum and partial vector output | Attribute typed defaults and checked receiver lifetime |
| `Element.h:308,311` | Source dictionary independence and retained native values | Validated dictionary writes and independent output snapshots |
| `Event.h:78` | Native parameter copy, default, enum and partial output | Typed parameters and dispatch-bound pointer expiry |
| `Property.h:25,42,50` | `CheckAllStorage`, `CheckConversionDestinations` | Explicit value/unit construction, `T{}` conversion and guarded value copies |
| `Variant.h:18,59,63,74,82,87` | All storage kinds and exact conversion results | Owned storage, assignment, defaults, success flags and checked reference snapshots |
| `Variant.inl:3,9,15,23,72,79` | Actual inline definitions of the same native operations | Shared type inspection and the corresponding owned value APIs |

The existing pointer lifetime, opaque-owner, scalar and serialization suites
remain part of the evidence. Native raw reference access does not become a
borrowed JS reference: aggregate outputs are copied, while native pointer
identities use guarded, collectible owners.

Eight original Core rows and nine original Supplemental rows now have local
consumer verification. The seven other Supplemental partial rows remain
separate. The recovered Core ledger contains 482 local operation records,
54 managed type records and 13 reviewed private forwards. Supplemental values
contain 1,539 local records, seven partial records and one opaque forward.
These categories do not establish full Core acceptance.

The full inventory cross-reference now has eight inputs: 2,859 represented
records and 1,067 unrepresented records. Representation is not a pass count.
The remaining records require their own source and execution reconciliation.

## Observed verification

The permanent native runner records 22 runtime groups, one successful compiler
control and two expected compiler rejections. Its 25 literal PASS lines are
outside the ordinary package runtime count.

```bash
python3 packages/sfml.js-rmlui/test/native/build-type-converter-contracts.py \
  /tmp/rmlui-63-completion
```

The runner requires the existing macOS native build and an existing temporary
output directory. It reuses compiler flags and vendor objects, enables
assertions and creates no repository copy or isolated environment. Other
platform execution remains unverified.

Complete `npm test` exits zero: native and TypeScript builds, lint, cpplint,
consumer types and 109 runtime files with 1,099 PASS and zero FAIL. Native
compiler errors and warnings are zero. Native fixture formatting, cpplint and
identifier naming pass.

The site test and build commands both exit zero: 81 tests, zero failures or
skips, 152 localized pages, 1,596 total API pages in each of four languages,
303 redirects and all local links/assets. Four-language guides and Variant
TSDoc describe the verified parsing, mutation and serialization behavior.

Continue the 1,067 unrepresented declarations, remaining Supplemental and Lua
follow-ups, Core nineteen groups, initialization and GPU/platform checks,
optional modules, official applications, visual corpus, editor/package/CI
acceptance and the final whole-scope review. No commit, push or publication
is implied by this local acceptance.
