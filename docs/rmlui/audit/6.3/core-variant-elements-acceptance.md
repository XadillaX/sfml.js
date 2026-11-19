# Persistent element Variant ownership

Property values and element attributes accept checked Element references.
Native SCRIPTINTERFACE storage uses a pointer and shared lifetime slot inside
the existing Variant buffer. Compiler assertions preserve its size and
alignment. Numeric Variants gain no field or allocation; unguarded upstream
pointers retain their original representation without a lifetime allocation.

Each target shares one native ownership observer. Copied and moved Variants
read the same slot, and native destruction nulls it before plugin, meta and
child teardown. The observer does not retain ElementState or native Element,
allocate V8 objects, invoke JS or alter observer registrations during notices.

Reachable Property, dictionary and detached-tree owners retain target handles
through private JS edges. Actual native-owned DOM/default sources selectively
root their targets. Removing or replacing values, destroying targets and
shutdown release these edges. Self and cross-element cycles remain collectible.
Initial and refreshed pointer edges use the same private key, so destroyed
target wrappers do not remain retained by an old Property copy.

The pointer ownership pass checks native resource, topology and ownership
versions. Unchanged frames skip snapshots; frames without current or previously
observed pointer lifetimes skip the pass entirely. Arrays are allocated only
for live pointer targets. The existing snapshot traversal still has a
mutation-time cost; this record makes no new complete-frame timing claim.

`Property.getElementValue()` uses native Get<ScriptInterface*> and narrows to
Element. `Element.getElementAttribute(name, fallback = null)` uses the native
pointer template: missing keys or conversion failure return the fallback,
while a destroyed stored target converts successfully to null. Raw Property
value, attribute value and dictionary snapshots return canonical Element
wrappers or null.

String template reads and direct Property/definition text conversion reject
pointer values. The upstream guarded-pointer-to-string conversion also fails,
preventing addresses from reaching RML serialization. Arbitrary VOIDPTR and
unregistered ScriptObject values remain unsupported.

Bulk conversion resolves element handles only after all user accessors.
Mutation then restores the outer active-element depth before checking its
receiver. This supports a current-call self-reference while preserving the
existing recursive callback and control-replacement restrictions.

## Verification scope

The runtime suite contains eleven focused scenarios: native copies,
typed defaults and address-free output, DOM destruction, detach/reparent,
dictionary retention/clear, attribute replacement/removal, reference cycles,
native document roots, stale target handles, unchanged owner scan counts,
and accessor/restarted-generation guards. The initial eight scenarios
failed before implementation; an additional stale-handle regression failed
before the final pointer-edge correction.

`npm_config_jobs=4 npm test` exits zero with 90 unique runtime test files,
839 PASS and zero FAIL. Lint, cpplint, Native build, TypeScript and consumer
types pass. All 81 site tests pass. The final Native sources pass clang-format
and compiler identifier checks; the naming check suppresses dependency and
existing NOLINT warnings and reports no user-code error.

Sixteen unchanged update/query iterations record zero callback snapshot visits
and zero element ownership visits. No complete-frame timing or GPU claim is
made for this pointer contract.

Exact patch validation loads the four changed files from pinned upstream 6.3
into memory, applies the composed binding patches, and compares them to the
existing dependency. The second application writes zero files. Validation
creates no copied dependency tree.

The distinct source review is performed by the controller, not an independent
reviewer. Four-language TSDoc and property guides describe the public contracts.
Logs and source hashes are retained in the authoritative completion ledger
under `/tmp/rmlui-63-completion`.

## Remaining contracts

Integer-vector and Character templates need explicit consumer representations.
The compiler inventory contains 43 Core/Variant.h declarations absent from the
supplemental ledger; class/type/method representation must be reviewed one by
one. The aggregate template/value rows remain partial. This record does not
accept non-null ScriptObjects, Core/19, global initialization, scripting,
optional modules, renderer/platform execution, applications or whole-plan
acceptance.

Core retains 549 declarations: 459 local, 17 partial and 73 pending.
The supplemental ledger retains 1482 declarations: 1469 local, twelve partial
and one reviewed opaque declaration. Eleven aggregate value rows receive
this evidence; no aggregate row is promoted to full acceptance.
